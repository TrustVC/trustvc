import { encodeFunctionData } from 'viem';
import { encrypt } from '../../core';
import { v5Contracts } from '../../token-registry-v5';
import {
  ContractOptions,
  RejectTransferParams,
  TransactionOptions,
} from '../../token-registry-functions/types';

interface GaslessSmartAccountClient {
  sendTransaction(args: { to: `0x${string}`; value: bigint; data: `0x${string}` }): Promise<string>;
}

/**
 * Rejects the transfer of holder for a title escrow contract gaslessly via EIP-7702 + Pimlico.
 * @param {ContractOptions} contractOptions - Contract-related options including the token registry address, and optionally, token ID and the title escrow address.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = current holder). Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {RejectTransferParams} params - Contains the `remarks` field which is an optional string that will be encrypted and sent with the transaction.
 * @param {TransactionOptions} options - Transfer options including optional `chainId`, `titleEscrowVersion`, `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws error if the title escrow address is missing.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const rejectTransferHolderGasless = async (
  contractOptions: ContractOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: RejectTransferParams,
  options: TransactionOptions,
): Promise<string> => {
  const { titleEscrowAddress } = contractOptions as { titleEscrowAddress: string };
  const { remarks } = params;

  if (!titleEscrowAddress) throw new Error('titleEscrowAddress is required');

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  return smartAccountClient.sendTransaction({
    to: titleEscrowAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: v5Contracts.TitleEscrow__factory.abi,
      functionName: 'rejectTransferHolder',
      args: [encryptedRemarks as `0x${string}`],
    }),
  });
};

/**
 * Rejects the transfer of beneficiary for a title escrow contract gaslessly via EIP-7702 + Pimlico.
 * @param {ContractOptions} contractOptions - Contract-related options including the token registry address, and optionally, token ID and the title escrow address.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = current beneficiary). Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {RejectTransferParams} params - Contains the `remarks` field which is an optional string that will be encrypted and sent with the transaction.
 * @param {TransactionOptions} options - Transfer options including optional `chainId`, `titleEscrowVersion`, `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws error if the title escrow address is missing.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const rejectTransferBeneficiaryGasless = async (
  contractOptions: ContractOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: RejectTransferParams,
  options: TransactionOptions,
): Promise<string> => {
  const { titleEscrowAddress } = contractOptions as { titleEscrowAddress: string };
  const { remarks } = params;

  if (!titleEscrowAddress) throw new Error('titleEscrowAddress is required');

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  return smartAccountClient.sendTransaction({
    to: titleEscrowAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: v5Contracts.TitleEscrow__factory.abi,
      functionName: 'rejectTransferBeneficiary',
      args: [encryptedRemarks as `0x${string}`],
    }),
  });
};

/**
 * Rejects the transfer of ownership for a title escrow contract gaslessly via EIP-7702 + Pimlico.
 * @param {ContractOptions} contractOptions - Contract-related options including the token registry address, and optionally, token ID and the title escrow address.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = current holder and beneficiary). Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {RejectTransferParams} params - Contains the `remarks` field which is an optional string that will be encrypted and sent with the transaction.
 * @param {TransactionOptions} options - Transfer options including optional `chainId`, `titleEscrowVersion`, `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws error if the title escrow address is missing.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const rejectTransferOwnersGasless = async (
  contractOptions: ContractOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: RejectTransferParams,
  options: TransactionOptions,
): Promise<string> => {
  const { titleEscrowAddress } = contractOptions as { titleEscrowAddress: string };
  const { remarks } = params;

  if (!titleEscrowAddress) throw new Error('titleEscrowAddress is required');

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  return smartAccountClient.sendTransaction({
    to: titleEscrowAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: v5Contracts.TitleEscrow__factory.abi,
      functionName: 'rejectTransferOwners',
      args: [encryptedRemarks as `0x${string}`],
    }),
  });
};
