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

// Helper to resolve Title Escrow Address
const resolveTitleEscrowAddress = async (
  titleEscrowFactoryContract: ethers.Contract | ethersV6.Contract,
  tokenRegistryAddress: string,
  tokenId: string,
): Promise<string> => {
  try {
    return await titleEscrowFactoryContract.getEscrowAddress(tokenRegistryAddress, tokenId);
  } catch {
    return titleEscrowFactoryContract.getAddress(tokenRegistryAddress, tokenId);
  }
};

export const getTitleEscrowAddress = async (
  tokenRegistryAddress: string,
  tokenId: string,
  provider: ethers.providers.Provider | ethersV6.Provider,
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
  const titleEscrowFactoryContract = new Contract(
    titleEscrowFactoryAddress,
    [
      'function getAddress(address, uint256) view returns (address)',
      'function getEscrowAddress(address, uint256) view returns (address)',
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );

  return resolveTitleEscrowAddress(titleEscrowFactoryContract, tokenRegistryAddress, tokenId);
};

// Check Title Escrow Interface Support
const checkSupportsInterface = async (
  titleEscrowAddress: string,
  interfaceId: string,
  provider: ethers.providers.Provider | ethersV6.Provider,
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

export const isTitleEscrowVersion = async (
  versionInterface: string,
  tokenRegistryAddress: string,
  tokenId: string,
  provider: ethers.providers.Provider | ethersV6.Provider,
): Promise<boolean> => {
  try {
    const titleEscrowAddress = await getTitleEscrowAddress(tokenRegistryAddress, tokenId, provider);
    return await checkSupportsInterface(titleEscrowAddress, versionInterface, provider);
  } catch {
    return false;
  }
};

export const fetchEndorsementChain = async (
  tokenRegistryAddress: string,
  tokenId: string,
  provider: ethers.providers.Provider | ethersV6.Provider,
  keyId?: string,
): Promise<EndorsementChain> => {
  if (!tokenRegistryAddress || !tokenId || !provider) {
    throw new Error('Missing required dependencies');
  }

  const [isV4, isV5] = await Promise.all([
    isTitleEscrowVersion(TitleEscrowInterface.V4, tokenRegistryAddress, tokenId, provider),
    isTitleEscrowVersion(TitleEscrowInterface.V5, tokenRegistryAddress, tokenId, provider),
  ]);

  if (!isV4 && !isV5) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  const titleEscrowAddress = await getTitleEscrowAddress(tokenRegistryAddress, tokenId, provider);
  let transferEvents: TransferBaseEvent[] = [];

  if (isV4) {
    const [tokenLogs, titleEscrowLogs] = await Promise.all([
      fetchTokenTransfers(provider, tokenRegistryAddress, tokenId),
      fetchEscrowTransfersV4(provider, titleEscrowAddress),
    ]);

    transferEvents = mergeTransfersV4([...titleEscrowLogs, ...tokenLogs]);
  } else if (isV5) {
    const titleEscrowLogs = await fetchEscrowTransfersV5(provider, titleEscrowAddress);
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
