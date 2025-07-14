import { checkSupportsInterface, encrypt } from '../../src/core';
import { v5Contracts, v5SupportInterfaceIds } from '../../src/token-registry-v5';
import { v4Contracts, v4SupportInterfaceIds } from '../../src/token-registry-v4';
import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import { getTxOptions } from './utils';
import { MintTokenOptions, MintTokenParams, TransactionOptions } from './types';

/**
 * Mints a new token into the TradeTrustToken registry with the specified beneficiary and holder.
 * Supports both Token Registry V4 and V5 contracts.
 * @param {MintTokenOptions} contractOptions - Contains the `tokenRegistryAddress` for the minting contract.
 * @param {Signer | SignerV6} signer - Signer instance (Ethers v5 or v6) that authorizes the mint transaction.
 * @param {MintTokenParams} params - Parameters for minting, including `beneficiaryAddress`, `holderAddress`, `tokenId`, and optional `remarks`.
 * @param {TransactionOptions} options - Transaction metadata including gas values, version detection, chain ID, and optional encryption ID.
 * @returns {Promise<ContractTransaction>} A promise resolving to the transaction result from the mint call.
 * @throws {Error} If the token registry address or signer provider is not provided.
 * @throws {Error} If neither V4 nor V5 interfaces are supported.
 * @throws {Error} If the `callStatic.mint` fails as a pre-check.
 */
const mint = async (
  contractOptions: MintTokenOptions,
  signer: Signer | SignerV6,
  params: MintTokenParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenRegistryAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas, titleEscrowVersion } = options;

  if (!tokenRegistryAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { beneficiaryAddress, holderAddress, tokenId, remarks } = params;

  // Detect version if not explicitly provided checkSupportsInterface
  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      checkSupportsInterface(
        tokenRegistryAddress,
        v4SupportInterfaceIds.TradeTrustTokenMintable,
        signer.provider,
      ),
      checkSupportsInterface(
        tokenRegistryAddress,
        v5SupportInterfaceIds.TradeTrustTokenMintable,
        signer.provider,
      ),
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

  const encryptedRemarks = remarks && isV5TT ? `0x${encrypt(remarks, options.id!)}` : '0x';
  // Check callStatic (dry run)
  try {
    if (isV5TT) {
      await (tradeTrustTokenContract as v5Contracts.TradeTrustToken).callStatic.mint(
        beneficiaryAddress,
        holderAddress,
        tokenId,
        encryptedRemarks,
      );
    } else if (isV4TT) {
      await (tradeTrustTokenContract as v4Contracts.TradeTrustToken).callStatic.mint(
        beneficiaryAddress,
        holderAddress,
        tokenId,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for mint failed');
  }

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction

  if (isV5TT) {
    return await (tradeTrustTokenContract as v5Contracts.TradeTrustToken).mint(
      beneficiaryAddress,
      holderAddress,
      tokenId,
      encryptedRemarks,
      txOptions,
    );
  } else if (isV4TT) {
    return await (tradeTrustTokenContract as v4Contracts.TradeTrustToken).mint(
      beneficiaryAddress,
      holderAddress,
      tokenId,
      txOptions,
    );
  }
};
export { mint };
