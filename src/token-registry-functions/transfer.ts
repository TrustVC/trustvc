import {
  encrypt,
  getTitleEscrowAddress,
  isTitleEscrowVersion,
  TitleEscrowInterface,
} from 'src/core';
import { v4Contracts } from 'src/token-registry-v4';
import { v5Contracts } from 'src/token-registry-v5';
import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  ContractOptions,
  NominateParams,
  TransactionOptions,
  TransferBeneficiaryParams,
  TransferHolderParams,
  TransferOwnersParams,
} from './types';
import { getTxOptions } from './utils';

/**
 * Transfers holder role of a Title Escrow contract to a new address.
 * The caller of this function must be the current holder.
 * @param {ContractOptions} contractOptions - Contains `tokenRegistryAddress` and optionally `tokenId` and  `titleEscrowAddress`.
 * @param {Signer | SignerV6} signer - The signer (ethers v5 or v6) who initiates the transaction.
 * @param {TransferHolderParams} params - Object containing `holderAddress` (address to transfer to) and optional `remarks`.
 * @param {TransactionOptions} options - Transaction options including:
 *   - `titleEscrowVersion` (optional): Either "v4" or "v5"
 *   - `chainId` (optional): Used for gas station lookup
 *   - `maxFeePerGas` (optional), `maxPriorityFeePerGas` (optional): EIP-1559 gas fee configuration
 *   - `id` (optional): ID used for encrypting remarks
 * @throws If required fields like `titleEscrowAddress` or `signer.provider` are missing.
 * @throws If the version is unsupported (neither v4 nor v5).
 * @throws If the dry-run via `callStatic` fails.
 * @returns {Promise<ContractTransaction>} The transaction response for `transferHolder`.
 */
const transferHolder = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: TransferHolderParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenRegistryAddress, tokenId } = contractOptions;
  const { titleEscrowVersion } = options;
  let { titleEscrowAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      { titleEscrowVersion },
    );
  }

  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { holderAddress, remarks } = params;

  // Connect V5 contract by default
  let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
    v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V4,
        provider: signer.provider,
      }),
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V5,
        provider: signer.provider,
      }),
    ]);
  }
  if (!isV4TT && !isV5TT) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  // Switch to V4 if needed
  if (isV4TT) {
    titleEscrowContract = v4Contracts.TitleEscrow__factory.connect(
      titleEscrowAddress,
      signer as Signer,
    );
  }
  //   check for current holder and signer
  //   const currentHolder = await titleEscrowContract.holder();

  //   if (currentHolder.toLowerCase() === holderAddress.toLowerCase()) {
  //     throw new Error('Cannot transfer to current holder');
  //   }
  //   const signerAddress = await getSignerAddressSafe(signer);
  //   if (currentHolder.toLowerCase() !== signerAddress.toLowerCase()) {
  //     throw new Error('Only the current holder can transfer');
  //   }

  // Check callStatic (dry run)
  try {
    if (isV5TT) {
      await (titleEscrowContract as v5Contracts.TitleEscrow).callStatic.transferHolder(
        holderAddress,
        encryptedRemarks,
      );
    } else if (isV4TT) {
      await (titleEscrowContract as v4Contracts.TitleEscrow).callStatic.transferHolder(
        holderAddress,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferHolder failed');
  }

  // If gas values are missing, query gas station if available
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction
  if (isV5TT) {
    return await (titleEscrowContract as v5Contracts.TitleEscrow).transferHolder(
      holderAddress,
      encryptedRemarks,
      txOptions,
    );
  } else if (isV4TT) {
    return await titleEscrowContract.transferHolder(holderAddress, txOptions);
  }
};

/**
 * Transfers the beneficiary role of a Title Escrow contract to a new beneficiary address.
 * The caller of this function must be the current holder.
 * @param {ContractOptions}  contractOptions - Contains `tokenRegistryAddress` and optionally `tokenId` and  `titleEscrowAddress`.
 * @param {Signer | SignerV6} signer - The signer (ethers v5 or v6) who initiates and signs the transaction.
 * @param {TransferBeneficiaryParams} params - Object containing:
 *   - `newBeneficiaryAddress`: Address to which the beneficiary role is being transferred.
 *   - `remarks` (optional): Optional encrypted message attached with the transaction.
 * @param {TransactionOptions} options - Transaction configuration options:
 *   - `titleEscrowVersion` (optional): Token registry version, either `'v4'` or `'v5'`.
 *   - `chainId` (optional): Used to query gas station info if gas fee values are missing.
 *   - `maxFeePerGas`(optional), `maxPriorityFeePerGas`(optional): EIP-1559 gas fee parameters.
 *   - `id`(optional): Used for encryption of remarks.
 * @throws If required values like `titleEscrowAddress` or `signer.provider` are missing.
 * @throws If the version is unsupported (neither v4 nor v5).
 * @throws If the dry-run `callStatic` fails for pre-checking the transaction.
 * @returns {Promise<ContractTransaction>} The transaction response for the `transferBeneficiary` call.
 */
const transferBeneficiary = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: TransferBeneficiaryParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenId, tokenRegistryAddress } = contractOptions;
  const { titleEscrowVersion } = options;
  let { titleEscrowAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      { titleEscrowVersion },
    );
  }
  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { newBeneficiaryAddress, remarks } = params;

  // Connect V5 contract by default
  let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
    v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V4,
        provider: signer.provider,
      }),
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V5,
        provider: signer.provider,
      }),
    ]);
  }
  if (!isV4TT && !isV5TT) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  // Switch to V4 if needed
  if (!isV5TT) {
    titleEscrowContract = v4Contracts.TitleEscrow__factory.connect(
      titleEscrowAddress,
      signer as Signer,
    );
  }

  // check for current beneficiary and signer
  //   const currentHolder = await titleEscrowContract.holder();
  //   const currentBeneficiary = await titleEscrowContract.beneficiary();
  //   if (currentBeneficiary.toLowerCase() === newBeneficiaryAddress.toLowerCase()) {
  //     throw new Error('Cannot transfer to current beneficiary');
  //   }
  //   const signerAddress = await signer.getAddress();
  //   if (currentHolder.toLowerCase() !== signerAddress.toLowerCase()) {
  //     throw new Error('Only the current holder can transfer');
  //   }

  // Check callStatic (dry run)
  try {
    if (isV5TT) {
      await (titleEscrowContract as v5Contracts.TitleEscrow).callStatic.transferBeneficiary(
        newBeneficiaryAddress,
        encryptedRemarks,
      );
    } else if (isV4TT) {
      await (titleEscrowContract as v4Contracts.TitleEscrow).callStatic.transferBeneficiary(
        newBeneficiaryAddress,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferBeneficiary failed');
  }

  // If gas values are missing, query gas station if available
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction
  if (isV5TT) {
    const tx = await (titleEscrowContract as v5Contracts.TitleEscrow).transferBeneficiary(
      newBeneficiaryAddress,
      encryptedRemarks,
      txOptions,
    );
    return tx;
  } else if (isV4TT) {
    const tx = await (titleEscrowContract as v4Contracts.TitleEscrow).transferBeneficiary(
      newBeneficiaryAddress,
      txOptions,
    );
    return tx;
  }
};

/**
 * Transfers both the holder and beneficiary roles of a Title Escrow contract to new addresses.
 * The caller of this function must be the current holder and beneficiary both.
 * @param {ContractOptions} contractOptions - Contains `tokenRegistryAddress` and optionally `tokenId` and  `titleEscrowAddress`.
 * @param {Signer | SignerV6} signer - The signer (ethers v5 or v6) who initiates and signs the transaction.
 * @param {TransferOwnersParams} params - Object containing:
 *   - `newBeneficiaryAddress`: The new beneficiary address.
 *   - `newHolderAddress`: The new holder address.
 *   - `remarks` (optional): Optional remarks that will be encrypted and included with the transaction.
 * @param {TransactionOptions} options - Transaction configuration options:
 *   - `titleEscrowVersion` (optional): Token registry version, either `'v4'` or `'v5'`.
 *   - `chainId` (optional): Used for gas station lookup if gas fee values are not provided.
 *   - `maxFeePerGas`(optional), `maxPriorityFeePerGas`(optional): EIP-1559 gas fee parameters.
 *   - `id`(optional): Used for encrypting remarks.
 * @throws If required fields like `titleEscrowAddress` or `signer.provider` are missing.
 * @throws If the title escrow version is unsupported.
 * @throws If the pre-check `callStatic.transferOwners` fails.
 * @returns {Promise<ContractTransaction>} The transaction response from the `transferOwners` call.
 */
const transferOwners = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: TransferOwnersParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenId, tokenRegistryAddress } = contractOptions;
  const { titleEscrowVersion } = options;
  let { titleEscrowAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      { titleEscrowVersion },
    );
  }
  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { newBeneficiaryAddress, newHolderAddress, remarks } = params;

  // Connect V5 contract by default
  let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
    v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V4,
        provider: signer.provider,
      }),
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V5,
        provider: signer.provider,
      }),
    ]);
  }
  if (!isV4TT && !isV5TT) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  // Switch to V4 if needed
  if (!isV5TT) {
    titleEscrowContract = v4Contracts.TitleEscrow__factory.connect(
      titleEscrowAddress,
      signer as Signer,
    );
  }

  // check for current beneficiary, holder and signer
  //   const currentHolder = await titleEscrowContract.holder();
  //   const currentBeneficiary = await titleEscrowContract.beneficiary();
  //   if (currentBeneficiary.toLowerCase() === newBeneficiaryAddress.toLowerCase()) {
  //     throw new Error('Cannot transfer to current beneficiary');
  //   }
  //   if (currentHolder.toLowerCase() === newHolderAddress.toLowerCase()) {
  //     throw new Error('Cannot transfer to current holder');
  //   }
  //   const signerAddress = await signer.getAddress();
  //   if (
  //     currentHolder.toLowerCase() !== signerAddress.toLowerCase() ||
  //     currentBeneficiary.toLowerCase() !== signerAddress.toLowerCase()
  //   ) {
  //     throw new Error('Holder and Beneficiary must be current signer');
  //   }

  // Check callStatic (dry run)
  try {
    if (isV5TT) {
      await (titleEscrowContract as v5Contracts.TitleEscrow).callStatic.transferOwners(
        newBeneficiaryAddress,
        newHolderAddress,
        encryptedRemarks,
      );
    } else if (isV4TT) {
      await (titleEscrowContract as v4Contracts.TitleEscrow).callStatic.transferOwners(
        newBeneficiaryAddress,
        newHolderAddress,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferOwners failed');
  }

  // If gas values are missing, query gas station if available
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction

  if (isV5TT) {
    return await (titleEscrowContract as v5Contracts.TitleEscrow).transferOwners(
      newBeneficiaryAddress,
      newHolderAddress,
      encryptedRemarks,
      txOptions,
    );
  } else if (isV4TT) {
    return await (titleEscrowContract as v4Contracts.TitleEscrow).transferOwners(
      newBeneficiaryAddress,
      newHolderAddress,
      txOptions,
    );
  }
};

/**
 * Nominates a new beneficiary on the Title Escrow contract.
 * The caller of this function must be the current beneficiary.
 * @param {ContractOptions} contractOptions - Contains `tokenRegistryAddress` and optionally `tokenId` and  `titleEscrowAddress`.
 * @param {Signer | SignerV6} signer - The signer (ethers v5 or v6) who will sign and send the transaction.
 * @param {NominateParams} params - Nomination parameters:
 *   - `newBeneficiaryAddress`: The Ethereum address to nominate as the new beneficiary.
 *   - `remarks` (optional): Remarks to include with the transaction (will be encrypted).
 * @param {TransactionOptions} options - Transaction-level configuration:
 *   - `titleEscrowVersion` (optional): Specifies token registry version, either `'v4'` or `'v5'`.
 *   - `chainId` (optional): Chain ID used for querying gas stations if fees are not set.
 *   - `maxFeePerGas`(optional), `maxPriorityFeePerGas`(optional): EIP-1559-compatible gas fee settings.
 *   - `id`(optional): Used for encrypting the remarks string.
 * @throws If required inputs like `titleEscrowAddress` or `signer.provider` are missing.
 * @throws If token registry version is unsupported.
 * @throws If the dry-run `callStatic.nominate()` fails.
 * @returns {Promise<ContractTransaction>} The transaction response from the `nominate` method.
 */
const nominate = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: NominateParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenId, tokenRegistryAddress } = contractOptions;
  const { titleEscrowVersion } = options;
  let { titleEscrowAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      { titleEscrowVersion },
    );
  }
  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { newBeneficiaryAddress, remarks } = params;

  // Connect V5 contract by default
  let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
    v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V4,
        provider: signer.provider,
      }),
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V5,
        provider: signer.provider,
      }),
    ]);
  }

  // Switch to V4 if needed
  if (!isV5TT) {
    titleEscrowContract = v4Contracts.TitleEscrow__factory.connect(
      titleEscrowAddress,
      signer as Signer,
    );
  }

  // check for current beneficiary and signer
  //   const currentBeneficiary = await titleEscrowContract.beneficiary();
  //   const signerAddress = await signer.getAddress();
  //   if (currentBeneficiary.toLowerCase() !== signerAddress.toLowerCase()) {
  //     throw new Error('Beneficiary must be current signer');
  //   }
  //   if (currentBeneficiary.toLowerCase() === newBeneficiaryAddress.toLowerCase()) {
  //     throw new Error('Cannot nominate to current beneficiary');
  //   }

  // Check callStatic (dry run)
  try {
    if (isV5TT) {
      await (titleEscrowContract as v5Contracts.TitleEscrow).callStatic.nominate(
        newBeneficiaryAddress,
        encryptedRemarks,
      );
    } else if (isV4TT) {
      await (titleEscrowContract as v4Contracts.TitleEscrow).callStatic.nominate(
        newBeneficiaryAddress,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for nominate failed');
  }

  // If gas values are missing, query gas station if available
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction

  if (isV5TT) {
    return await (titleEscrowContract as v5Contracts.TitleEscrow).nominate(
      newBeneficiaryAddress,
      encryptedRemarks,
      txOptions,
    );
  } else if (isV4TT) {
    return await (titleEscrowContract as v4Contracts.TitleEscrow).nominate(
      newBeneficiaryAddress,
      txOptions,
    );
  }
};

export { transferHolder, transferBeneficiary, transferOwners, nominate };
