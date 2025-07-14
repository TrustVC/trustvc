import { checkSupportsInterface } from './../../src/core';
import { v5Contracts, v5SupportInterfaceIds } from './../../src/token-registry-v5';
import { v4Contracts, v4SupportInterfaceIds } from './../../src/token-registry-v4';
import { Signer as SignerV6 } from 'ethersV6';
import { Signer } from 'ethers';
import { OwnerOfTokenOptions, OwnerOfTokenParams, TransactionOptions } from './types';

/**
 * Retrieves the owner of a given token from the TradeTrustToken contract.
 * Supports both Token Registry V4 and V5 implementations.
 * @param {OwnerOfTokenOptions} contractOptions - Options containing the token registry address.
 * @param {Signer | SignerV6} signer - Signer instance (v5 or v6) used to query the blockchain.
 * @param {OwnerOfTokenParams} params - Contains the `tokenId` of the token to query ownership for.
 * @param {TransactionOptions} options - Includes the `titleEscrowVersion` and other optional metadata for interface detection.
 * @returns {Promise<string>} A promise that resolves to the owner address of the specified token.
 * @throws {Error} If token registry address or signer provider is not provided.
 * @throws {Error} If the token registry does not support V4 or V5 interfaces.
 */
const ownerOf = async (
  contractOptions: OwnerOfTokenOptions,
  signer: Signer | SignerV6,
  params: OwnerOfTokenParams,
  options: TransactionOptions,
): Promise<string> => {
  const { tokenRegistryAddress } = contractOptions;
  const { titleEscrowVersion } = options;
  const { tokenId } = params;

  if (!tokenRegistryAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');

  // Detect version if not explicitly provided checkSupportsInterface
  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      checkSupportsInterface(tokenRegistryAddress, v4SupportInterfaceIds.SBT, signer.provider),
      checkSupportsInterface(tokenRegistryAddress, v5SupportInterfaceIds.SBT, signer.provider),
    ]);
  }

  if (!isV4TT && !isV5TT) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }
  // Connect V5 contract by default
  let tradeTrustTokenContract: v5Contracts.TradeTrustToken | v4Contracts.TradeTrustToken;
  if (isV5TT) {
    tradeTrustTokenContract = v5Contracts.TradeTrustToken__factory.connect(
      tokenRegistryAddress,
      signer,
    );
  } else if (isV4TT) {
    tradeTrustTokenContract = v4Contracts.TradeTrustToken__factory.connect(
      tokenRegistryAddress,
      signer as Signer,
    );
  }

  // Send the actual transaction

  if (isV5TT) {
    return await (tradeTrustTokenContract as v5Contracts.TradeTrustToken).ownerOf(tokenId);
  } else if (isV4TT) {
    return await (tradeTrustTokenContract as v4Contracts.TradeTrustToken).ownerOf(tokenId);
  }
};
export { ownerOf };
