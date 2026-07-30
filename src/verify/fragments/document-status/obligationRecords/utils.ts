import { TrustVCToken__factory } from '@tradetrust-tt/token-registry-v5/contracts';
import {
  CodedError,
  InvalidTokenRegistryStatus,
  OpenAttestationEthereumTokenRegistryStatusCode,
  ValidTokenRegistryStatus,
} from '@tradetrust-tt/tt-verify';
import { constants, errors, providers } from 'ethers';
import { decodeError } from '../transferableRecords/utils';

type EthersError = {
  message?: string;
  data?: string;
  method?: string;
  reason?: string;
  code?: errors;
};

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

    if (!Number.isFinite(expectedChainId) || network.chainId !== expectedChainId) {
      return {
        minted: false,
        address: obligationRegistryAddress,
        reason: {
          code: OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT,
          codeString:
            OpenAttestationEthereumTokenRegistryStatusCode[
              OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT
            ],
          message: `Provider chain ID ${network.chainId} does not match credentialStatus.tokenNetwork.chainId ${expectedChainId}`,
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
    if (error instanceof CodedError) {
      throw error;
    }
    if ((error as EthersError).code !== errors.CALL_EXCEPTION) {
      throw error;
    }
    const decodedMessage = decodeError(error as EthersError);

    return {
      minted: false,
      address: obligationRegistryAddress,
      reason: {
        message: decodedMessage,
        code: OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED,
        codeString:
          OpenAttestationEthereumTokenRegistryStatusCode[
            OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED
          ],
      },
    };
  }
};
