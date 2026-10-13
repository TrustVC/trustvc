import { encodeFunctionData } from 'viem';
import { encrypt } from '../../core';
import { v5Contracts } from '../../token-registry-v5';
import {
  AcceptReturnedOptions,
  AcceptReturnedParams,
  ContractOptions,
  RejectReturnedOptions,
  RejectReturnedParams,
  ReturnToIssuerParams,
  TransactionOptions,
} from '../../token-registry-functions/types';

interface GaslessSmartAccountClient {
  sendTransaction(args: { to: `0x${string}`; value: bigint; data: `0x${string}` }): Promise<string>;
}

/**
 * Returns a token to the original issuer from the Title Escrow contract gaslessly via EIP-7702 + Pimlico.
 * Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {ContractOptions} contractOptions - Contract-related options including the token registry address, and optionally, token ID and the title escrow address.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = current holder and beneficiary).
 * @param {ReturnToIssuerParams} params - Contains the `remarks` field which is an optional string that will be encrypted and sent with the transaction.
 * @param {TransactionOptions} options - Transaction options including optional `chainId`, `titleEscrowVersion`, `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws {Error} If the title escrow address is missing.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const returnToIssuerGasless = async (
  contractOptions: ContractOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: ReturnToIssuerParams,
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
      functionName: 'returnToIssuer',
      args: [encryptedRemarks as `0x${string}`],
    }),
  });
};

/**
 * Rejects a returned token by restoring it back to the token registry gaslessly via EIP-7702 + Pimlico.
 * Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {AcceptReturnedOptions} contractOptions - Contains the `tokenRegistryAddress` used to locate the TradeTrustToken contract.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = registry admin).
 * @param {RejectReturnedParams} params - Includes the `tokenId` to restore and optional `remarks` to encrypt.
 * @param {TransactionOptions} options - Transaction options including optional `chainId`, `titleEscrowVersion`, `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws {Error} If the token registry address is missing.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const rejectReturnedGasless = async (
  contractOptions: AcceptReturnedOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: RejectReturnedParams,
  options: TransactionOptions,
): Promise<string> => {
  const { tokenRegistryAddress } = contractOptions;
  const { tokenId, remarks } = params;

  if (!tokenRegistryAddress) throw new Error('tokenRegistryAddress is required');

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  return smartAccountClient.sendTransaction({
    to: tokenRegistryAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: v5Contracts.TradeTrustToken__factory.abi,
      functionName: 'restore',
      args: [BigInt(tokenId), encryptedRemarks as `0x${string}`],
    }),
  });
};

/**
 * Accepts a returned token by burning it from the TradeTrustToken contract gaslessly via EIP-7702 + Pimlico.
 * Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 * @param {RejectReturnedOptions} contractOptions - Contains the `tokenRegistryAddress` from which the token will be burned.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (owner = registry admin).
 * @param {AcceptReturnedParams} params - Includes the `tokenId` to burn and optional `remarks` for audit trail.
 * @param {TransactionOptions} options - Transaction options including optional `chainId`, `titleEscrowVersion`, `maxFeePerGas`, `maxPriorityFeePerGas`, and an `id` used for encryption.
 * @throws {Error} If the token registry address is missing.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const acceptReturnedGasless = async (
  contractOptions: RejectReturnedOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: AcceptReturnedParams,
  options: TransactionOptions,
): Promise<string> => {
  const { tokenRegistryAddress } = contractOptions;
  const { tokenId, remarks } = params;

  if (!tokenRegistryAddress) throw new Error('tokenRegistryAddress is required');

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  return smartAccountClient.sendTransaction({
    to: tokenRegistryAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: v5Contracts.TradeTrustToken__factory.abi,
      functionName: 'burn',
      args: [BigInt(tokenId), encryptedRemarks as `0x${string}`],
    }),
  });
};
