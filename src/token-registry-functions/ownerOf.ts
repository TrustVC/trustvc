import { checkSupportsInterface } from '../core';
import { v5Contracts, v5SupportInterfaceIds } from '../token-registry-v5';
import { v4Contracts, v4SupportInterfaceIds } from '../token-registry-v4';
import { Signer as SignerV6, Contract as ContractV6 } from 'ethersV6';
import { Signer as SignerV5, Contract as ContractV5 } from 'ethers';
import { OwnerOfTokenOptions, OwnerOfTokenParams, TransactionOptions } from './types';
import { getEthersContractFromProvider } from '../utils/ethers';

/**
 * Retrieves the owner of a given token from the TradeTrustToken contract.
 * Supports both Token Registry V4 and V5 implementations.
 * @param {OwnerOfTokenOptions} contractOptions - Options containing the token registry address.
 * @param {SignerV5 | SignerV6} signer - Signer instance (v5 or v6) used to query the blockchain.
 * @param {OwnerOfTokenParams} params - Contains the `tokenId` of the token to query ownership for.
 * @param {TransactionOptions} options - Includes the `titleEscrowVersion` and other optional metadata for interface detection.
 * @returns {Promise<string>} A promise that resolves to the owner address of the specified token.
 * @throws {Error} If token registry address or signer provider is not provided.
 * @throws {Error} If the token registry does not support V4 or V5 interfaces.
 */
const ownerOf = async (
  contractOptions: OwnerOfTokenOptions,
  signer: SignerV5 | SignerV6,
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
  const Contract = getEthersContractFromProvider(signer.provider);
  // Connect V5 contract by default
  let tradeTrustTokenContract: ContractV5 | ContractV6;
  if (isV5TT) {
    tradeTrustTokenContract = new Contract(
      tokenRegistryAddress,
      v5Contracts.TradeTrustToken__factory.abi,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signer as any,
    );
  } else if (isV4TT) {
    tradeTrustTokenContract = new Contract(
      tokenRegistryAddress,
      v4Contracts.TradeTrustToken__factory.abi,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signer as any,
    );
  } else {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  // Send the actual transaction

  return await tradeTrustTokenContract.ownerOf(tokenId);
};
export { ownerOf };
