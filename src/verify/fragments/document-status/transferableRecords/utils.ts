import { TradeTrustToken__factory } from '@tradetrust-tt/token-registry-v4/contracts';
import {
  CodedError,
  InvalidTokenRegistryStatus,
  OpenAttestationEthereumTokenRegistryStatusCode,
  ValidTokenRegistryStatus,
} from '@tradetrust-tt/tt-verify';
import { constants, errors, providers } from 'ethers';

// TODO: Remove and replace with ethers v6 ERROR interfaces https://github.com/ethers-io/ethers.js/blob/v6.13.4/src.ts/utils/errors.ts#L156
type EthersError = {
  message?: string;
  data?: string;
  method?: string;
  reason?: string;
  code?: errors;
};

const isNonExistentToken = (error: EthersError) => {
  const message: string | undefined = error.message;
  if (!message) {
    // ERC721NonexistentToken error
    return error.data && error.data.slice(0, 10) === '0x7e273289';
  }
  return message.includes('owner query for nonexistent token');
};

const isMissingTokenRegistry = (error: EthersError) => {
  return (
    !error.reason &&
    error.method?.toLowerCase() === 'ownerOf(uint256)'.toLowerCase() &&
    error.code === errors.CALL_EXCEPTION
  );
};

export const decodeError = (error: EthersError) => {
  const reason =
    error.reason && Array.isArray(error.reason) ? error.reason[0] : (error.reason ?? '');
  switch (true) {
    case isNonExistentToken(error):
      return `Document has not been issued under token registry`;
    case isMissingTokenRegistry(error):
      return `Token registry is not found`;
    case reason.toLowerCase() === 'ENS name not configured'.toLowerCase() &&
      error.code === errors.UNSUPPORTED_OPERATION:
      return 'ENS name is not configured';
    case reason.toLowerCase() === 'invalid address'.toLowerCase() &&
      error.code === errors.INVALID_ARGUMENT:
      return `Invalid token registry address`;
    case error.code === errors.INVALID_ARGUMENT:
      return `Invalid contract arguments`;
    case error.code === errors.SERVER_ERROR:
    case error.code === errors.NETWORK_ERROR:
      throw new CodedError(
        'Unable to connect to the network, please try again later',
        OpenAttestationEthereumTokenRegistryStatusCode.SERVER_ERROR,
        OpenAttestationEthereumTokenRegistryStatusCode[
          OpenAttestationEthereumTokenRegistryStatusCode.SERVER_ERROR
        ],
      );
    default:
      throw error;
  }
};

export const isTokenMintedOnRegistry = async ({
  tokenRegistryAddress,
  tokenId,
  provider,
}: {
  tokenRegistryAddress: string;
  tokenId: string;
  provider: providers.Provider;
}): Promise<ValidTokenRegistryStatus | InvalidTokenRegistryStatus> => {
  try {
    // Import TradeTrustToken v4 as we are only using ownerOf method, which is identical to v5
    const tokenRegistryContract = TradeTrustToken__factory.connect(tokenRegistryAddress, provider);
    const minted = await tokenRegistryContract
      .ownerOf(tokenId)
      .then((owner: string) => owner !== constants.AddressZero);
    return minted
      ? { minted, address: tokenRegistryAddress }
      : {
          minted,
          address: tokenRegistryAddress,
          reason: {
            code: OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED,
            codeString:
              OpenAttestationEthereumTokenRegistryStatusCode[
                OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED
              ],
            message: `Document ${tokenId} has not been issued under contract ${tokenRegistryAddress}`,
          },
        };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return {
      minted: false,
      address: tokenRegistryAddress,
      reason: {
        message: decodeError(error),
        // message: (error as Error).message,
        code: OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED,
        codeString:
          OpenAttestationEthereumTokenRegistryStatusCode[
            OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED
          ],
      },
    };
  }
};
