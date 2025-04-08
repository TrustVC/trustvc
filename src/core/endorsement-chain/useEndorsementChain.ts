import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { supportInterfaceIds as supportInterfaceIdsV4 } from '../../token-registry-v4/supportInterfaceIds';
import { supportInterfaceIds as supportInterfaceIdsV5 } from '../../token-registry-v5/supportInterfaceIds';
import { getEthersContractFromProvider } from '../../utils/ethers';
import { decrypt } from '../decrypt';
import {
  fetchEscrowTransfersV4,
  fetchEscrowTransfersV5,
} from '../endorsement-chain/fetchEscrowTransfer';
import { fetchTokenTransfers } from '../endorsement-chain/fetchTokenTransfer';
import { mergeTransfersV4, mergeTransfersV5 } from '../endorsement-chain/helpers';
import { getEndorsementChain } from '../endorsement-chain/retrieveEndorsementChain';
import { EndorsementChain, TransferBaseEvent } from '../endorsement-chain/types';
import { Provider } from '@ethersproject/abstract-provider';

export const TitleEscrowInterface = {
  V4: supportInterfaceIdsV4.TitleEscrow,
  V5: supportInterfaceIdsV5.TitleEscrow,
};

// Helper to fetch Title Escrow Factory Address
const fetchTitleEscrowFactoryAddress = async (
  tokenRegistry: ethers.Contract | ethersV6.Contract,
): Promise<string> => {
  return tokenRegistry.titleEscrowFactory();
};

// Interact with contract using calldata
const calldata = async (
  provider: Provider | ethersV6.Provider,
  functionSignature: string,
  contractAddress: string,
  functionTypes: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params: any[],
): Promise<string> => {
  const functionSelector = ethers.utils.id(functionSignature).slice(0, 10);
  const encodedParams = ethers.utils.defaultAbiCoder.encode(functionTypes, [...params]);
  const calldata = functionSelector + encodedParams.slice(2);
  const result = await provider.call({
    to: contractAddress,
    data: calldata,
  });
  // Decode the returned hex string into an address format
  return ethers.utils.getAddress(ethers.utils.hexDataSlice(result, 12));
};

// Helper to resolve Title Escrow Address
const resolveTitleEscrowAddress = async (
  provider: Provider | ethersV6.Provider,
  titleEscrowFactoryAddress: string,
  tokenRegistryAddress: string,
  tokenId: string,
  options?: {
    titleEscrowVersion?: 'v4' | 'v5';
  },
): Promise<string> => {
  try {
    if (options?.titleEscrowVersion === 'v4') {
      return await calldata(
        provider,
        'getAddress(address,uint256)',
        titleEscrowFactoryAddress,
        ['address', 'uint256'],
        [tokenRegistryAddress, tokenId],
      );
    }
    return await calldata(
      provider,
      'getEscrowAddress(address,uint256)',
      titleEscrowFactoryAddress,
      ['address', 'uint256'],
      [tokenRegistryAddress, tokenId],
    );
  } catch {
    if (options?.titleEscrowVersion === 'v4') {
      // If 'v4' option fails, try searching with 'v5' function getEscrowAddress
      return await calldata(
        provider,
        'getEscrowAddress(address,uint256)',
        titleEscrowFactoryAddress,
        ['address', 'uint256'],
        [tokenRegistryAddress, tokenId],
      );
    }
    // Have to query getAddress using calldata as getAddress is a internal function in ethers v6.
    // getAddress in ethers v6, return TitleEscrowFactoryAddress instead of TitleEscrowAddress
    return await calldata(
      provider,
      'getAddress(address,uint256)',
      titleEscrowFactoryAddress,
      ['address', 'uint256'],
      [tokenRegistryAddress, tokenId],
    );
  }
};

export const getTitleEscrowAddress = async (
  tokenRegistryAddress: string,
  tokenId: string,
  provider: Provider | ethersV6.Provider,
  options?: {
    titleEscrowVersion?: 'v4' | 'v5';
  },
): Promise<string> => {
  const Contract = getEthersContractFromProvider(provider);

  const tokenRegistryAbi = [
    'function titleEscrowFactory() external view returns (address)',
    'function ownerOf(uint256 tokenId) view returns (address)',
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenRegistry = new Contract(tokenRegistryAddress, tokenRegistryAbi, provider as any);
  const titleEscrowOwner = await tokenRegistry.ownerOf(tokenId);

  const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
  const isInactiveEscrow = [BURN_ADDRESS, tokenRegistryAddress]
    .map((address) => address.toLowerCase())
    .includes(titleEscrowOwner.toLowerCase());

  if (!isInactiveEscrow) return titleEscrowOwner;

  const titleEscrowFactoryAddress = await fetchTitleEscrowFactoryAddress(tokenRegistry);

  return resolveTitleEscrowAddress(
    provider,
    titleEscrowFactoryAddress,
    tokenRegistryAddress,
    tokenId,
    options,
  );
};

// Check Title Escrow Interface Support
const checkSupportsInterface = async (
  titleEscrowAddress: string,
  interfaceId: string,
  provider: Provider | ethersV6.Provider,
): Promise<boolean> => {
  try {
    const Contract = getEthersContractFromProvider(provider);
    const titleEscrowAbi = [
      'function supportsInterface(bytes4 interfaceId) external view returns (bool)',
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const titleEscrowContract = new Contract(titleEscrowAddress, titleEscrowAbi, provider as any);
    return await titleEscrowContract.supportsInterface(interfaceId);
  } catch {
    return false;
  }
};

interface TitleEscrowVersionParams {
  tokenRegistryAddress?: string;
  tokenId?: string;
  titleEscrowAddress?: string;
  versionInterface: string;
  provider: Provider | ethersV6.Provider;
}

/**
 * To provide (tokenRegistryAddress and tokenId) or (titleEscrowAddress)
 * @param {TitleEscrowVersionParams} params - TitleEscrowVersionParams
 * @returns {Promise<boolean>} - return true if titleEscrow matches supportInterface
 */
export const isTitleEscrowVersion = async ({
  tokenRegistryAddress,
  tokenId,
  titleEscrowAddress,
  versionInterface,
  provider,
}: TitleEscrowVersionParams): Promise<boolean> => {
  try {
    if (!titleEscrowAddress && (!tokenRegistryAddress || !tokenId)) {
      throw new Error('Missing required dependencies');
    } else if (!titleEscrowAddress) {
      titleEscrowAddress = await getTitleEscrowAddress(tokenRegistryAddress, tokenId, provider);
    }
    return await checkSupportsInterface(titleEscrowAddress, versionInterface, provider);
  } catch {
    return false;
  }
};

export const fetchEndorsementChain = async (
  tokenRegistryAddress: string,
  tokenId: string,
  provider: Provider | ethersV6.Provider,
  keyId?: string,
): Promise<EndorsementChain> => {
  if (!tokenRegistryAddress || !tokenId || !provider) {
    throw new Error('Missing required dependencies');
  }
  const titleEscrowAddress = await getTitleEscrowAddress(tokenRegistryAddress, tokenId, provider);

  const [isV4, isV5] = await Promise.all([
    isTitleEscrowVersion({
      titleEscrowAddress,
      versionInterface: TitleEscrowInterface.V4,
      provider,
    }),
    isTitleEscrowVersion({
      titleEscrowAddress,
      versionInterface: TitleEscrowInterface.V5,
      provider,
    }),
  ]);

  if (!isV4 && !isV5) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  let transferEvents: TransferBaseEvent[] = [];

  if (isV4) {
    const [tokenLogs, titleEscrowLogs] = await Promise.all([
      fetchTokenTransfers(provider, tokenRegistryAddress, tokenId),
      fetchEscrowTransfersV4(provider, titleEscrowAddress),
    ]);

    transferEvents = mergeTransfersV4([...titleEscrowLogs, ...tokenLogs]);
  } else if (isV5) {
    const titleEscrowLogs = await fetchEscrowTransfersV5(
      provider,
      titleEscrowAddress,
      tokenRegistryAddress,
    );
    transferEvents = mergeTransfersV5(titleEscrowLogs);
  }

  const endorsementChain = await getEndorsementChain(provider, transferEvents);

  return isV4
    ? endorsementChain
    : endorsementChain.map((event) => ({
        ...event,
        remark: event?.remark?.slice(2) ? decrypt(event.remark.slice(2), keyId ?? '') : '',
      }));
};
