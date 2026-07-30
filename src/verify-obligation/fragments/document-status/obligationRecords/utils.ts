import { TradeTrustToken__factory } from '@tradetrust-tt/token-registry-v4/contracts';
import { errors, constants, Contract, providers } from 'ethers';
import { Provider as ProviderV6 } from 'ethersV6';
import { obligationRegistryContracts } from '../../../../obligation-registry';
import { getTitleEscrowAddress } from '../../../../core/endorsement-chain';
import { isV6EthersProvider } from '../../../../utils/ethers';
import {
  ObligationRecordsCodedError,
  ObligationRecordsStatusCode,
  ObligationRegistryMintStatus,
} from './obligationRecordVerifier.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isNonExistentToken = (error: any): boolean => {
  const hasNonExistentSelector = Boolean(error.data && error.data.slice(0, 10) === '0x7e273289');
  const hasNonExistentMessage =
    typeof error.message === 'string' &&
    error.message.includes('owner query for nonexistent token');
  return hasNonExistentSelector || hasNonExistentMessage;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isMissingObligationRegistry = (error: any): boolean => {
  return (
    !error.reason &&
    error.method?.toLowerCase() === 'ownerOf(uint256)'.toLowerCase() &&
    error.code === errors.CALL_EXCEPTION
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const decodeObligationRegistryError = (error: any): string => {
  const reason =
    error.reason && Array.isArray(error.reason) ? error.reason[0] : (error.reason ?? '');
  switch (true) {
    case isNonExistentToken(error):
      return `Document has not been issued under obligation registry`;
    case isMissingObligationRegistry(error):
      return `Obligation registry is not found`;
    case reason.toLowerCase() === 'ENS name not configured'.toLowerCase() &&
      error.code === errors.UNSUPPORTED_OPERATION:
      return 'ENS name is not configured';
    case reason.toLowerCase() === 'invalid address'.toLowerCase() &&
      error.code === errors.INVALID_ARGUMENT:
      return `Invalid obligation registry address`;
    case error.code === errors.INVALID_ARGUMENT:
      return `Invalid contract arguments`;
    case error.code === errors.SERVER_ERROR:
    case error.code === errors.NETWORK_ERROR:
      throw new ObligationRecordsCodedError(
        'Unable to connect to the network, please try again later',
        ObligationRecordsStatusCode.SERVER_ERROR,
        ObligationRecordsStatusCode[ObligationRecordsStatusCode.SERVER_ERROR],
      );
    default:
      throw error;
  }
};

const normalizeChainId = (chainId: number | string): number =>
  typeof chainId === 'string' ? Number.parseInt(chainId, 10) : chainId;

const getProviderChainId = async (provider: providers.Provider | ProviderV6): Promise<number> => {
  if (isV6EthersProvider(provider)) {
    const network = await (provider as ProviderV6).getNetwork();
    return Number(network.chainId);
  }
  const network = await (provider as providers.Provider).getNetwork();
  return network.chainId;
};

export const isTokenMintedOnObligationRegistry = async ({
  obligationRegistry,
  tokenId,
  provider,
  chainId,
}: {
  obligationRegistry: string;
  tokenId: string;
  provider: providers.Provider | ProviderV6;
  chainId: number | string;
}): Promise<ObligationRegistryMintStatus> => {
  try {
    const providerChainId = await getProviderChainId(provider);
    const declaredChainId = normalizeChainId(chainId);
    if (providerChainId !== declaredChainId) {
      return {
        minted: false,
        address: obligationRegistry,
        reason: {
          code: ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
          codeString:
            ObligationRecordsStatusCode[ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT],
          message: `Provider network chain ID (${providerChainId}) does not match credential's declared chain ID (${declaredChainId})`,
        },
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const registryContract = TradeTrustToken__factory.connect(obligationRegistry, provider as any);
    const minted = await registryContract
      .ownerOf(tokenId)
      .then((owner) => owner !== constants.AddressZero);
    return minted
      ? { minted, address: obligationRegistry }
      : {
          minted,
          address: obligationRegistry,
          reason: {
            code: ObligationRecordsStatusCode.DOCUMENT_NOT_MINTED,
            codeString:
              ObligationRecordsStatusCode[ObligationRecordsStatusCode.DOCUMENT_NOT_MINTED],
            message: `Document ${tokenId} has not been issued under contract ${obligationRegistry}`,
          },
        };
  } catch (error) {
    return {
      minted: false,
      address: obligationRegistry,
      reason: {
        message: decodeObligationRegistryError(error),
        code: ObligationRecordsStatusCode.DOCUMENT_NOT_MINTED,
        codeString: ObligationRecordsStatusCode[ObligationRecordsStatusCode.DOCUMENT_NOT_MINTED],
      },
    };
  }
};

export const getObligationEscrowEnrichment = async ({
  obligationRegistry,
  tokenId,
  provider,
}: {
  obligationRegistry: string;
  tokenId: string;
  provider: providers.Provider | ProviderV6;
}): Promise<{ status: number; terminationReason: number }> => {
  const escrowAddress = await getTitleEscrowAddress(obligationRegistry, tokenId, provider, {
    titleEscrowVersion: 'v5',
  });
  const escrow = new Contract(
    escrowAddress,
    obligationRegistryContracts.ObligationEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    provider as any,
  );
  const [status, terminationReason] = await Promise.all([
    escrow.status(),
    escrow.terminationReason(),
  ]);
  return {
    status: Number(status),
    terminationReason: Number(terminationReason),
  };
};
