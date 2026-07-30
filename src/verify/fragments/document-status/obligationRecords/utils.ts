import { TrustVCToken__factory } from '@tradetrust-tt/token-registry-v5/contracts';
import {
  CodedError,
  InvalidTokenRegistryStatus,
  OpenAttestationEthereumTokenRegistryStatusCode,
  ValidTokenRegistryStatus,
} from '@tradetrust-tt/tt-verify';
import { constants, providers } from 'ethers';
import { decodeError } from '../transferableRecords/utils';

export const isTokenMintedOnObligationRegistry = async ({
  obligationRegistryAddress,
  tokenId,
  provider,
  chainId,
}: {
  obligationRegistryAddress: string;
  tokenId: string;
  provider: providers.Provider;
  chainId?: number | string;
}): Promise<ValidTokenRegistryStatus | InvalidTokenRegistryStatus> => {
  if (chainId !== undefined) {
    const network = await provider.getNetwork();
    const expectedChainId =
      typeof chainId === 'string' ? Number.parseInt(chainId, 10) : Number(chainId);
    // ethers v6 returns chainId as bigint
    const actualChainId = Number(network.chainId);

    if (!Number.isFinite(expectedChainId) || actualChainId !== expectedChainId) {
      return {
        minted: false,
        address: obligationRegistryAddress,
        reason: {
          code: OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT,
          codeString:
            OpenAttestationEthereumTokenRegistryStatusCode[
              OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT
            ],
          message: `Provider chain ID ${actualChainId} does not match credentialStatus.tokenNetwork.chainId ${expectedChainId}`,
        },
      };
    }
  }

  try {
    const obligationRegistryContract = TrustVCToken__factory.connect(
      obligationRegistryAddress,
      provider,
    );
    const minted = await obligationRegistryContract
      .ownerOf(tokenId)
      .then((owner: string) => owner !== constants.AddressZero);

    return minted
      ? { minted, address: obligationRegistryAddress }
      : {
          minted,
          address: obligationRegistryAddress,
          reason: {
            code: OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED,
            codeString:
              OpenAttestationEthereumTokenRegistryStatusCode[
                OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED
              ],
            message: `Document ${tokenId} has not been issued under contract ${obligationRegistryAddress}`,
          },
        };
  } catch (error: unknown) {
    // Same shape as transferableRecords: map ownerOf failures to DOCUMENT_NOT_MINTED via decodeError.
    // If decodeError rethrows (e.g. ethers v6 BAD_DATA with hex-only revert data), still treat as not minted.
    let message: string;
    try {
      message = decodeError(error);
    } catch (decodedError) {
      if (decodedError instanceof CodedError) {
        throw decodedError;
      }
      message = `Document ${tokenId} has not been issued under contract ${obligationRegistryAddress}`;
    }

    return {
      minted: false,
      address: obligationRegistryAddress,
      reason: {
        message,
        code: OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED,
        codeString:
          OpenAttestationEthereumTokenRegistryStatusCode[
            OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED
          ],
      },
    };
  }
};
