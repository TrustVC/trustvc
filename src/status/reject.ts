import {
  encrypt,
  getTitleEscrowAddress,
  isTitleEscrowVersion,
  TitleEscrowInterface,
} from '../core';
import { v5Contracts } from '../token-registry-v5';
import { Signer as SignerV6, Contract as ContractV6 } from 'ethersV6';
import { Contract as ContractV5, ContractTransaction, Signer } from 'ethers';
import { getTxOptions } from '../token-registry-functions/utils';
import { ContractOptions, TransactionOptions } from '../token-registry-functions/types';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import { StatusActionParams } from './types';

/**
 * Beta. Holder rejects (dishonours) a TitleEscrow, moving its status from Issued to Rejected —
 * terminal. Status-only: it does not revert the holder role, use the existing
 * `rejectTransferHolder` for that. Not gated on document type.
 * Calls the on-chain `reject(bytes)` method. Role and status preconditions are enforced by the
 * contract (surfaced via callStatic).
 * @param {ContractOptions} contractOptions - Contract-related options including the token registry address, and optionally, token ID and the title escrow address.
 * @param {Signer | SignerV6} signer - Ethers signer (V5 or V6) used to sign and send the transaction. Must be the current holder.
 * @param {StatusActionParams} params - Contains the optional `remarks` field, encrypted and sent with the transaction.
 * @param {TransactionOptions} options - Includes optional `chainId`, `titleEscrowVersion`, `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws if the title escrow address or signer provider is missing.
 * @throws if the version is not V5 compatible.
 * @throws if the dry-run (`callStatic`) fails.
 * @returns {Promise<ContractTransaction>} The transaction response of the reject call.
 */
const reject = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: StatusActionParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { tokenRegistryAddress, tokenId } = contractOptions;
  let { titleEscrowAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas, titleEscrowVersion } = options;

  if (!titleEscrowAddress) {
    if (!tokenRegistryAddress) throw new Error('Token registry address is required');
    if (!tokenId) throw new Error('Token ID is required');
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      {},
    );
  }

  if (!titleEscrowAddress) throw new Error('Title escrow address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { remarks } = params;

  const Contract = getEthersContractFromProvider(signer.provider);
  const titleEscrowContract: ContractV5 | ContractV6 = new Contract(
    titleEscrowAddress,
    v5Contracts.TitleEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

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

  try {
    if (isV6EthersProvider(signer.provider)) {
      await (titleEscrowContract as ContractV6).reject.staticCall(encryptedRemarks);
    } else {
      await (titleEscrowContract as ContractV5).callStatic.reject(encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for reject failed');
  }

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);

  return await titleEscrowContract.reject(encryptedRemarks, txOptions);
};

export { reject };
