import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { supportInterfaceIds as supportInterfaceIdsV4 } from '../../token-registry-v4/supportInterfaceIds';
import { supportInterfaceIds as supportInterfaceIdsV5 } from '../../token-registry-v5/supportInterfaceIds';
import { getEthersContractFromProvider } from '../../utils/ethers';
import { decrypt } from '../decrypt';
import { isTransientRpcError, sleep } from '../endorsement-chain/fetchLogsChunked';
import {
  fetchEscrowTransfersV4,
  fetchEscrowTransfersV5,
  fetchEscrowTransfersObligation,
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

/** Current ERC165 id from token-registry (includes mintBlock/shredBlock). */
export const ObligationEscrowInterface = supportInterfaceIdsV5.ObligationEscrow;

/**
 * Pre-mintBlock/shredBlock ERC165 id. Adding those functions changed
 * `type(IObligationEscrow).interfaceId`, so older deployments only answer to this id.
 */
export const ObligationEscrowInterfaceLegacy = '0xe43144bd';

const OBLIGATION_ESCROW_INTERFACE_IDS = [
  ObligationEscrowInterface,
  ObligationEscrowInterfaceLegacy,
] as const;

// Helper to fetch Title Escrow Factory Address
const getTitleEscrowFactoryAddress = async (
  tokenRegistryAddress: string,
  provider: Provider | ethersV6.Provider,
): Promise<string> => {
  const Contract = getEthersContractFromProvider(provider);
  const tokenRegistryAbi = ['function titleEscrowFactory() external view returns (address)'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenRegistry = new Contract(tokenRegistryAddress, tokenRegistryAbi, provider as any);
  return await tokenRegistry.titleEscrowFactory();
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
  const titleEscrowOwner = await getDocumentOwner(tokenRegistryAddress, tokenId, provider);

  const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
  const isInactiveEscrow = [BURN_ADDRESS, tokenRegistryAddress]
    .map((address) => address.toLowerCase())
    .includes(titleEscrowOwner.toLowerCase());

  if (!isInactiveEscrow) return titleEscrowOwner;

  const titleEscrowFactoryAddress = await getTitleEscrowFactoryAddress(
    tokenRegistryAddress,
    provider,
  );

  return resolveTitleEscrowAddress(
    provider,
    titleEscrowFactoryAddress,
    tokenRegistryAddress,
    tokenId,
    options,
  );
};

export const getDocumentOwner = async (
  tokenRegistryAddress: string,
  tokenId: string,
  provider: Provider | ethersV6.Provider,
): Promise<string> => {
  const Contract = getEthersContractFromProvider(provider);
  const tokenRegistryAbi = ['function ownerOf(uint256 tokenId) view returns (address)'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenRegistry = new Contract(tokenRegistryAddress, tokenRegistryAbi, provider as any);
  return await tokenRegistry.ownerOf(tokenId);
};

const MAX_INTERFACE_CHECK_RETRIES = 3;

// Check Title Escrow Interface Support
export const checkSupportsInterface = async (
  contractAddress: string,
  interfaceId: string,
  provider: Provider | ethersV6.Provider,
): Promise<boolean> => {
  for (let attempt = 0; ; attempt++) {
    try {
      const Contract = getEthersContractFromProvider(provider);
      const abi = ['function supportsInterface(bytes4 interfaceId) external view returns (bool)'];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const contract = new Contract(contractAddress, abi, provider as any);
      return await contract.supportsInterface(interfaceId);
    } catch (err) {
      if (isTransientRpcError(err) && attempt < MAX_INTERFACE_CHECK_RETRIES) {
        await sleep(Math.min(1000 * 2 ** attempt, 8000));
        continue;
      }
      return false;
    }
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

/**
 * Detect ObligationEscrow. Prefer ERC165 (current + legacy ids); fall back to probing
 * `isRegistered()`, which exists on ObligationEscrow but not TitleEscrow.
 * @param {string} titleEscrowAddress - Escrow contract address to check
 * @param {Provider | ethersV6.Provider} provider - Ethers provider
 * @returns {Promise<boolean>} - true if the address is an ObligationEscrow
 */
export const isObligationEscrow = async (
  titleEscrowAddress: string,
  provider: Provider | ethersV6.Provider,
): Promise<boolean> => {
  const supported = await Promise.all(
    OBLIGATION_ESCROW_INTERFACE_IDS.map((interfaceId) =>
      checkSupportsInterface(titleEscrowAddress, interfaceId, provider),
    ),
  );
  if (supported.some(Boolean)) return true;

  try {
    const Contract = getEthersContractFromProvider(provider);
    const abi = ['function isRegistered() view returns (bool)'];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contract = new Contract(titleEscrowAddress, abi, provider as any);
    await contract.isRegistered();
    return true;
  } catch {
    return false;
  }
};

export const fetchEndorsementChain = async (
  tokenRegistryAddress: string,
  tokenId: string,
  provider: Provider | ethersV6.Provider,
  keyId?: string,
  titleEscrowAddress?: string,
): Promise<EndorsementChain> => {
  if (!tokenRegistryAddress || !tokenId || !provider) {
    throw new Error('Missing required dependencies');
  }
  const resolvedTitleEscrowAddress =
    titleEscrowAddress ?? (await getTitleEscrowAddress(tokenRegistryAddress, tokenId, provider));

  const [isV4, isV5, isObligation] = await Promise.all([
    isTitleEscrowVersion({
      titleEscrowAddress: resolvedTitleEscrowAddress,
      versionInterface: TitleEscrowInterface.V4,
      provider,
    }),
    isTitleEscrowVersion({
      titleEscrowAddress: resolvedTitleEscrowAddress,
      versionInterface: TitleEscrowInterface.V5,
      provider,
    }),
    isObligationEscrow(resolvedTitleEscrowAddress, provider),
  ]);

  if (!isV4 && !isV5 && !isObligation) {
    throw new Error('Only Token Registry V4/V5 or Obligation Registry is supported');
  }

  let transferEvents: TransferBaseEvent[] = [];

  if (isV4) {
    const [tokenLogs, titleEscrowLogs] = await Promise.all([
      fetchTokenTransfers(provider, tokenRegistryAddress, tokenId),
      fetchEscrowTransfersV4(provider, resolvedTitleEscrowAddress),
    ]);

    transferEvents = mergeTransfersV4([...titleEscrowLogs, ...tokenLogs]);
  } else if (isObligation) {
    const obligationEscrowLogs = await fetchEscrowTransfersObligation(
      provider,
      resolvedTitleEscrowAddress,
      tokenRegistryAddress,
    );
    transferEvents = mergeTransfersV5(obligationEscrowLogs);
  } else if (isV5) {
    const titleEscrowLogs = await fetchEscrowTransfersV5(
      provider,
      resolvedTitleEscrowAddress,
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
