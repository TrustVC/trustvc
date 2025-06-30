import {
  encrypt,
  getTitleEscrowAddress,
  isTitleEscrowVersion,
  TitleEscrowInterface,
} from 'src/core';
import { v5Contracts } from 'src/token-registry-v5';
import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import { getTxOptions } from './utils';
import { ContractOptions, RejectTransferParams, TransactionOptions } from './types';

/**
 * Rejects the transfer of holder for a title escrow contract.
 * @param {ContractOptions} contractOptions - Contract-related options including the token registry address, and optionally, token ID and the title escrow address.
 * @param {Signer | SignerV6} signer - Ethers signer (V5 or V6) used to sign and send the transaction.
 * @param {RejectTransferParams} params - Contains the `remarks` field which is an optional string that will be encrypted and sent with the transaction.
 * @param {TransactionOptions} options - Transfer options including optional `chainId`, `titleEscrowVersion`,  `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws error if the title escrow address or signer provider is missing.
 * @throws if the version is not V5 compatible.
 * @throws if the dry-run (`callStatic`) fails.
 * @returns {Promise<ContractTransaction>} The transaction response of the rejectTransferHolder call.
 */
const rejectTransferHolder = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: RejectTransferParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenRegistryAddress, tokenId } = contractOptions;
  let { titleEscrowAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas, titleEscrowVersion } = options;

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      {},
    );
  }

  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { remarks } = params;

  // Connect V5 contract by default
  const titleEscrowContract = v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  let isV5TT = titleEscrowVersion === 'v5';
  if (titleEscrowVersion === undefined) {
    isV5TT = await isTitleEscrowVersion({
      titleEscrowAddress,
      versionInterface: TitleEscrowInterface.V5,
      provider: signer.provider,
    });
  }

  if (!isV5TT) {
    throw new Error('Only Token Registry V5 is supported');
  }

  // Check callStatic (dry run)
  try {
    await titleEscrowContract.callStatic.rejectTransferHolder(encryptedRemarks);
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferHolder failed');
  }

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction

  return await titleEscrowContract.rejectTransferHolder(encryptedRemarks, txOptions);
};

/**
 * Rejects the transfer of beneficiary for a title escrow contract.
 * @param {ContractOptions} contractOptions - Contract-related options including the token registry address, and optionally, token ID and the title escrow address.
 * @param {Signer | SignerV6} signer - Ethers signer (V5 or V6) used to sign and send the transaction.
 * @param {RejectTransferParams} params - Contains the `remarks` field which is an optional string that will be encrypted and sent with the transaction.
 * @param {TransactionOptions} options - Transfer options including optional `chainId`, `titleEscrowVersion`,  `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws error if the title escrow address or signer provider is missing.
 * @throws error if the version is not V5 compatible.
 * @throws error if the dry-run (`callStatic`) fails.
 * @returns {Promise<ContractTransaction>} The transaction response of the rejectTransferBeneficiary call.
 */
const rejectTransferBeneficiary = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: RejectTransferParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenRegistryAddress, tokenId } = contractOptions;
  let { titleEscrowAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas, titleEscrowVersion } = options;

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      {},
    );
  }

  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { remarks } = params;

  // Connect V5 contract by default
  const titleEscrowContract = v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  let isV5TT = titleEscrowVersion === 'v5';
  if (titleEscrowVersion === undefined) {
    isV5TT = await isTitleEscrowVersion({
      titleEscrowAddress,
      versionInterface: TitleEscrowInterface.V5,
      provider: signer.provider,
    });
  }

  if (!isV5TT) {
    throw new Error('Only Token Registry V5 is supported');
  }

  // Check callStatic (dry run)
  try {
    await titleEscrowContract.callStatic.rejectTransferBeneficiary(encryptedRemarks);
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferHolder failed');
  }

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction

  return await titleEscrowContract.rejectTransferBeneficiary(encryptedRemarks, txOptions);
};

/**
 * Rejects the transfer of ownership for a title escrow contract.
 * @param {ContractOptions} contractOptions - Contract-related options including the token registry address, and optionally, token ID and the title escrow address.
 * @param {Signer | SignerV6} signer - Ethers signer (V5 or V6) used to sign and send the transaction.
 * @param {RejectTransferParams} params - Contains the `remarks` field which is an optional string that will be encrypted and sent with the transaction.
 * @param {TransactionOptions} options - Transfer options including optional `chainId`, `titleEscrowVersion`,  `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws error if the title escrow address or signer provider is missing.
 * @throws an error if the version is not V5 compatible.
 * @throws an error if the dry-run (`callStatic`) fails.
 * @returns {Promise<ContractTransaction>} The transaction response of the rejectTransferOwners call.
 */
const rejectTransferOwners = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: RejectTransferParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenRegistryAddress, tokenId } = contractOptions;
  let { titleEscrowAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas, titleEscrowVersion } = options;

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      {},
    );
  }

  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { remarks } = params;

  // Connect V5 contract by default
  const titleEscrowContract = v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  let isV5TT = titleEscrowVersion === 'v5';
  if (titleEscrowVersion === undefined) {
    isV5TT = await isTitleEscrowVersion({
      titleEscrowAddress,
      versionInterface: TitleEscrowInterface.V5,
      provider: signer.provider,
    });
  }

  if (!isV5TT) {
    throw new Error('Only Token Registry V5 is supported');
  }

  // Check callStatic (dry run)
  try {
    await titleEscrowContract.callStatic.rejectTransferOwners(encryptedRemarks);
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferHolder failed');
  }

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction

  return await titleEscrowContract.rejectTransferOwners(encryptedRemarks, txOptions);
};

export { rejectTransferHolder, rejectTransferBeneficiary, rejectTransferOwners };
