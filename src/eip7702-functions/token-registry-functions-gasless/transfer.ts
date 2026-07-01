import { encodeFunctionData } from 'viem';
import { encrypt } from '../../core';
import { v5Contracts } from '../../token-registry-v5';
import {
  ContractOptions,
  NominateParams,
  TransactionOptions,
  TransferBeneficiaryParams,
  TransferHolderParams,
  TransferOwnersParams,
} from '../../token-registry-functions/types';

interface GaslessSmartAccountClient {
  sendTransaction(args: { to: `0x${string}`; value: bigint; data: `0x${string}` }): Promise<string>;
}

/**
 * Transfers the holder role of a Title Escrow gaslessly via EIP-7702 + Pimlico.
 * Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {ContractOptions} contractOptions - `titleEscrowAddress` of the Title Escrow to act on.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = current holder).
 * @param {TransferHolderParams} params - `holderAddress` to transfer to, and optional `remarks`.
 * @param {TransactionOptions} options - Transaction options; `options.id` is used to encrypt remarks.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const transferHolderGasless = async (
  contractOptions: ContractOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: TransferHolderParams,
  options: TransactionOptions,
): Promise<string> => {
  const { titleEscrowAddress } = contractOptions as { titleEscrowAddress: string };
  const { holderAddress, remarks } = params;

  if (!titleEscrowAddress) throw new Error('titleEscrowAddress is required');

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  return smartAccountClient.sendTransaction({
    to: titleEscrowAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: v5Contracts.TitleEscrow__factory.abi,
      functionName: 'transferHolder',
      args: [holderAddress as `0x${string}`, encryptedRemarks as `0x${string}`],
    }),
  });
};

/**
 * Transfers the beneficiary role of a Title Escrow gaslessly via EIP-7702 + Pimlico.
 * Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {ContractOptions} contractOptions - `titleEscrowAddress` of the Title Escrow to act on.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = current holder).
 * @param {TransferBeneficiaryParams} params - `newBeneficiaryAddress` to transfer to, and optional `remarks`.
 * @param {TransactionOptions} options - Transaction options; `options.id` is used to encrypt remarks.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const transferBeneficiaryGasless = async (
  contractOptions: ContractOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: TransferBeneficiaryParams,
  options: TransactionOptions,
): Promise<string> => {
  const { titleEscrowAddress } = contractOptions as { titleEscrowAddress: string };
  const { newBeneficiaryAddress, remarks } = params;

  if (!titleEscrowAddress) throw new Error('titleEscrowAddress is required');

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  return smartAccountClient.sendTransaction({
    to: titleEscrowAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: v5Contracts.TitleEscrow__factory.abi,
      functionName: 'transferBeneficiary',
      args: [newBeneficiaryAddress as `0x${string}`, encryptedRemarks as `0x${string}`],
    }),
  });
};

/**
 * Transfers both the holder and beneficiary roles of a Title Escrow gaslessly via EIP-7702 + Pimlico.
 * Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {ContractOptions} contractOptions - `titleEscrowAddress` of the Title Escrow to act on.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = current holder and beneficiary).
 * @param {TransferOwnersParams} params - `newBeneficiaryAddress`, `newHolderAddress`, and optional `remarks`.
 * @param {TransactionOptions} options - Transaction options; `options.id` is used to encrypt remarks.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const transferOwnersGasless = async (
  contractOptions: ContractOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: TransferOwnersParams,
  options: TransactionOptions,
): Promise<string> => {
  const { titleEscrowAddress } = contractOptions as { titleEscrowAddress: string };
  const { newBeneficiaryAddress, newHolderAddress, remarks } = params;

  if (!titleEscrowAddress) throw new Error('titleEscrowAddress is required');

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  return smartAccountClient.sendTransaction({
    to: titleEscrowAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: v5Contracts.TitleEscrow__factory.abi,
      functionName: 'transferOwners',
      args: [
        newBeneficiaryAddress as `0x${string}`,
        newHolderAddress as `0x${string}`,
        encryptedRemarks as `0x${string}`,
      ],
    }),
  });
};

/**
 * Nominates a new beneficiary on a Title Escrow gaslessly via EIP-7702 + Pimlico.
 * Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {ContractOptions} contractOptions - `titleEscrowAddress` of the Title Escrow to act on.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = current beneficiary).
 * @param {NominateParams} params - `newBeneficiaryAddress` to nominate, and optional `remarks`.
 * @param {TransactionOptions} options - Transaction options; `options.id` is used to encrypt remarks.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const nominateGasless = async (
  contractOptions: ContractOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: NominateParams,
  options: TransactionOptions,
): Promise<string> => {
  const { titleEscrowAddress } = contractOptions as { titleEscrowAddress: string };
  const { newBeneficiaryAddress, remarks } = params;

  if (!titleEscrowAddress) throw new Error('titleEscrowAddress is required');

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  return smartAccountClient.sendTransaction({
    to: titleEscrowAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: v5Contracts.TitleEscrow__factory.abi,
      functionName: 'nominate',
      args: [newBeneficiaryAddress as `0x${string}`, encryptedRemarks as `0x${string}`],
    }),
  });
};
