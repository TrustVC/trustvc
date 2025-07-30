import {
  checkSupportsInterface,
  encrypt,
  getTitleEscrowAddress,
  isTitleEscrowVersion,
  TitleEscrowInterface,
} from '../core';
import { v5Contracts, v5SupportInterfaceIds } from '../token-registry-v5';
import { v4Contracts, v4SupportInterfaceIds } from '../token-registry-v4';
import { Signer as SignerV6, Contract as ContractV6 } from 'ethersV6';
import { Contract as ContractV5, ContractTransaction, Signer } from 'ethers';
import { getTxOptions } from './utils';
import {
  AcceptReturnedOptions,
  AcceptReturnedParams,
  ContractOptions,
  RejectReturnedOptions,
  RejectReturnedParams,
  ReturnToIssuerParams,
  TransactionOptions,
} from './types';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';

/**
 * Returns the token to the original issuer from the Title Escrow contract.
 * @param {ContractOptions} contractOptions - Options including token ID, registry address, and optionally title escrow address.
 * @param {Signer | SignerV6} signer - Signer instance (Ethers v5 or v6) that will execute the transaction.
 * @param {ReturnToIssuerParams} params - Contains optional remarks to be encrypted and attached to the transaction.
 * @param {TransactionOptions} options - Transaction settings including gas fees, escrow version, chain ID, and optional encryption ID.
 * @returns {Promise<ContractTransaction>} Promise that resolves to the transaction response from the `returnToIssuer` function.
 * @throws {Error} If title escrow address or provider is not provided or if version is unsupported.
 * @throws {Error} If the `callStatic.returnToIssuer` fails as a pre-check.
 */
const returnToIssuer = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: ReturnToIssuerParams,
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

  if (!titleEscrowAddress) throw new Error('Title Escrow address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { remarks } = params;

  // Connect V5 contract by default
  // let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
  //   v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks && options.id ? `0x${encrypt(remarks, options.id)}` : '0x';

  // Detect version if not explicitly provided
  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      await isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V4,
        provider: signer.provider,
      }),
      await isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V5,
        provider: signer.provider,
      }),
    ]);
  }

  if (!isV5TT && !isV4TT) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  const Contract = getEthersContractFromProvider(signer.provider);
  // Connect V5 contract by default
  let titleEscrowContract: ContractV5 | ContractV6;
  if (isV5TT) {
    titleEscrowContract = new Contract(
      titleEscrowAddress,
      v5Contracts.TitleEscrow__factory.abi,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signer as any,
    );
  } else if (isV4TT) {
    titleEscrowContract = new Contract(
      titleEscrowAddress,
      v4Contracts.TitleEscrow__factory.abi,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signer as any,
    );
  }

  // Check callStatic (dry run)
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    const args = isV5TT ? [encryptedRemarks] : [];
    const staticCallFxn = isV5TT ? 'returnToIssuer' : 'surrender';

    if (isV6) {
      await (titleEscrowContract as ContractV6)[staticCallFxn].staticCall(...args);
    } else {
      await (titleEscrowContract as ContractV5).callStatic[staticCallFxn](...args);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for returnToIssuer failed');
  }

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction
  if (isV5TT) {
    return await titleEscrowContract.returnToIssuer(encryptedRemarks, txOptions);
  } else if (isV4TT) {
    return await titleEscrowContract.surrender(txOptions);
  }
};

/**
 * Rejects a previously returned token by restoring it back to the token registry.
 * This is only supported on Token Registry V5 contracts with the `restore` functionality.
 * @param {AcceptReturnedOptions} contractOptions - Contains the `tokenRegistryAddress` used to locate the TradeTrustToken contract.
 * @param {Signer | SignerV6} signer - Signer instance (v5 or v6) used to authorize the transaction.
 * @param {AcceptReturnedParams} params - Includes the `tokenId` to restore and optional `remarks` to encrypt.
 * @param {TransactionOptions} options - Configuration for the transaction including version, gas fees, and optional `id` used for encryption.
 * @returns {Promise<ContractTransaction>} A promise that resolves to the transaction result of the `restore` call.
 * @throws {Error} If the token registry address or provider is missing.
 * @throws {Error} If the token registry version is unsupported.
 * @throws {Error} If the callStatic pre-check fails.
 */
const rejectReturned = async (
  contractOptions: AcceptReturnedOptions,
  signer: Signer | SignerV6,
  params: RejectReturnedParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenRegistryAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas, titleEscrowVersion } = options;

  if (!tokenRegistryAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { tokenId, remarks } = params;

  // Detect version if not explicitly provided checkSupportsInterface
  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      checkSupportsInterface(
        tokenRegistryAddress,
        v4SupportInterfaceIds.TradeTrustTokenRestorable,
        signer.provider,
      ),
      checkSupportsInterface(
        tokenRegistryAddress,
        v5SupportInterfaceIds.TradeTrustTokenRestorable,
        signer.provider,
      ),
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
  }

  const encryptedRemarks = remarks && isV5TT ? `0x${encrypt(remarks, options.id!)}` : '0x';
  // Check callStatic (dry run)
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    const args = isV5TT ? [tokenId, encryptedRemarks] : [tokenId];

    if (isV6) {
      await (tradeTrustTokenContract as ContractV6).restore.staticCall(...args);
    } else {
      await (tradeTrustTokenContract as ContractV5).callStatic.restore(...args);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for rejectReturned failed');
  }

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction

  if (isV5TT) {
    return await tradeTrustTokenContract.restore(tokenId, encryptedRemarks, txOptions);
  } else if (isV4TT) {
    return await tradeTrustTokenContract.restore(tokenId, txOptions);
  }
};
/**
 * Accepts the returned token by burning it from the TradeTrustToken contract.
 * Only supported on Token Registry V5 contracts that implement the burnable interface.
 * @param {RejectReturnedOptions} contractOptions - Contains the `tokenRegistryAddress` from which the token will be burned.
 * @param {Signer | SignerV6} signer - Signer instance (v5 or v6) used to authorize and send the burn transaction.
 * @param {AcceptReturnedParams} params - Includes the `tokenId` to burn and optional `remarks` for audit trail.
 * @param {TransactionOptions} options - Transaction settings including chain ID, gas fee values, escrow version, and encryption ID for remarks.
 * @returns {Promise<ContractTransaction>} A promise resolving to the transaction result of the burn call.
 * @throws {Error} If token registry address or signer provider is not provided.
 * @throws {Error} If the contract does not support Token Registry V5.
 * @throws {Error} If `callStatic.burn` fails as a pre-check.
 */
const acceptReturned = async (
  contractOptions: RejectReturnedOptions,
  signer: Signer | SignerV6,
  params: AcceptReturnedParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenRegistryAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas, titleEscrowVersion } = options;

  if (!tokenRegistryAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { tokenId, remarks } = params;

  // Detect version if not explicitly provided checkSupportsInterface
  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      checkSupportsInterface(
        tokenRegistryAddress,
        v4SupportInterfaceIds.TradeTrustTokenBurnable,
        signer.provider,
      ),
      checkSupportsInterface(
        tokenRegistryAddress,
        v5SupportInterfaceIds.TradeTrustTokenBurnable,
        signer.provider,
      ),
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
  }

  const encryptedRemarks = remarks && isV5TT ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Check callStatic (dry run)
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    const args = isV5TT ? [encryptedRemarks] : [];

    if (isV6) {
      await (tradeTrustTokenContract as ContractV6).burn.staticCall(...args);
    } else {
      await (tradeTrustTokenContract as ContractV5).callStatic.burn(...args);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for acceptReturned failed');
  }

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  // Send the actual transaction

  if (isV5TT) {
    return await tradeTrustTokenContract.burn(tokenId, encryptedRemarks, txOptions);
  } else if (isV4TT) {
    return await tradeTrustTokenContract.burn(tokenId, txOptions);
  }
};

export { returnToIssuer, acceptReturned, rejectReturned };
