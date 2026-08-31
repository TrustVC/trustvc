import { encodeFunctionData } from 'viem';
import { encrypt } from '../../core';
import { abis } from '@trustvc/eip7702';
import { MintTokenParams, TransactionOptions } from '../../token-registry-functions/types';

interface GaslessSmartAccountClient {
  sendTransaction(args: { to: `0x${string}`; value: bigint; data: `0x${string}` }): Promise<string>;
}

export interface MintGaslessOptions {
  // The platform's deployed PlatformPaymaster — registry must be in authorizedRegistries
  paymasterAddress: string;
  // The TradeTrustToken registry to mint on
  tokenRegistryAddress: string;
}

/**
 * Mints a new TradeTrust document gaslessly via EIP-7702 + Pimlico.
 * Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 *
 * Calls `mintDocument(registry, beneficiary, holder, tokenId, remark)` on the PlatformPaymaster,
 * which verifies the registry is authorized, mints the token, and auto-adds beneficiary, holder,
 * and the new TitleEscrow to the paymaster's authorized lists.
 * @param {MintGaslessOptions} contractOptions - Requires `paymasterAddress` and `tokenRegistryAddress`.
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client.
 * @param {MintTokenParams} params - `beneficiaryAddress`, `holderAddress`, `tokenId`, and optional `remarks`.
 * @param {TransactionOptions} options - Transaction options; `options.id` is used to encrypt remarks.
 * @throws {Error} If `paymasterAddress` or `tokenRegistryAddress` is missing.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const mintGasless = async (
  contractOptions: MintGaslessOptions,
  smartAccountClient: GaslessSmartAccountClient,
  params: MintTokenParams,
  options: TransactionOptions,
): Promise<string> => {
  const { paymasterAddress, tokenRegistryAddress } = contractOptions;
  const { beneficiaryAddress, holderAddress, tokenId, remarks } = params;

  if (!paymasterAddress) throw new Error('paymasterAddress is required');
  if (!tokenRegistryAddress) throw new Error('tokenRegistryAddress is required');

  const encryptedRemarks = remarks ? (`0x${encrypt(remarks, options.id!)}` as `0x${string}`) : '0x';

  return smartAccountClient.sendTransaction({
    to: paymasterAddress as `0x${string}`,
    value: 0n,
    data: encodeFunctionData({
      abi: abis.platformPaymasterAbi,
      functionName: 'mintDocument',
      args: [
        tokenRegistryAddress as `0x${string}`,
        beneficiaryAddress as `0x${string}`,
        holderAddress as `0x${string}`,
        BigInt(tokenId),
        encryptedRemarks,
      ],
    }),
  });
};
