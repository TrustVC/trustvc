import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import { ContractOptions, TransactionOptions } from '../token-registry-functions/types';
import { StatusActionParams } from './types';
import { runStatusAction } from './runStatusAction';

/**
 * Beta. Holder accepts a TitleEscrow, moving its status from Issued to Accepted. Callable on any
 * TitleEscrow — not gated on document type — but only makes sense once beneficiary != holder.
 * Calls the on-chain `accept(bytes)` method. Role and status preconditions are enforced by the
 * contract (surfaced via callStatic).
 * @param {ContractOptions} contractOptions - Contract-related options including the token registry address, and optionally, token ID and the title escrow address.
 * @param {Signer | SignerV6} signer - Ethers signer (V5 or V6) used to sign and send the transaction. Must be the current holder.
 * @param {StatusActionParams} params - Contains the optional `remarks` field, encrypted and sent with the transaction.
 * @param {TransactionOptions} options - Includes optional `chainId`, `titleEscrowVersion`, `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws if the title escrow address or signer provider is missing.
 * @throws if the version is not V5 compatible.
 * @throws if the dry-run (`callStatic`) fails.
 * @returns {Promise<ContractTransaction>} The transaction response of the accept call.
 */
const accept = (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: StatusActionParams,
  options: TransactionOptions,
): Promise<ContractTransaction> =>
  runStatusAction('accept', contractOptions, signer, params, options);

export { accept };
