import { TrustVCToken__factory } from '@tradetrust-tt/token-registry-v5/contracts';
import {
  InvalidTokenRegistryStatus,
  OpenAttestationEthereumTokenRegistryStatusCode,
  ValidTokenRegistryStatus,
} from '@tradetrust-tt/tt-verify';
import { constants, providers } from 'ethers';
import { decodeError, type EthersError } from '../transferableRecords/utils';

const notMintedReason = (
  obligationRegistryAddress: string,
  tokenId: string,
  message?: string,
): InvalidTokenRegistryStatus => ({
  minted: false,
  address: obligationRegistryAddress,
  reason: {
    code: OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED,
    codeString:
      OpenAttestationEthereumTokenRegistryStatusCode[
        OpenAttestationEthereumTokenRegistryStatusCode.DOCUMENT_NOT_MINTED
      ],
    message:
      message ??
      `Document ${tokenId} has not been issued under contract ${obligationRegistryAddress}`,
  },
});

// Same minted semantics as classic ETR: ownerOf !== AddressZero (includes burn 0xdEaD).
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
    const expectedChainId = Number(chainId);
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

    if (!minted) {
      return notMintedReason(obligationRegistryAddress, tokenId);
    }

    return { minted: true, address: obligationRegistryAddress };
  } catch (error: unknown) {
    // Only ownerOf absence / registry miss maps to DOCUMENT_NOT_MINTED.
    // CodedError (e.g. SERVER_ERROR) and unexpected reverts from decodeError propagate.
    const ethersError = error as EthersError;
    return notMintedReason(obligationRegistryAddress, tokenId, decodeError(ethersError));
  }
};
