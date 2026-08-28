import { Hex, LocalAccount } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AwsKmsViemAccountConfig, kmsToAccount } from './viem-kms-account';

export type GaslessAccountConfig =
  | { type: 'privateKey'; privateKey: Hex }
  | ({ type: 'kms' } & AwsKmsViemAccountConfig);

/**
 * Creates the viem `LocalAccount` used to sign EIP-7702 authorizations and
 * transactions in the gasless flow (src/eip7702-functions), from either a
 * raw private key or an AWS KMS key — same signature-consuming code either way.
 * @param {GaslessAccountConfig} config - `{ type: 'privateKey', privateKey }` or `{ type: 'kms', keyId, ...KMSClientConfig }`.
 * @returns {Promise<LocalAccount>} A viem account usable with createWalletClient({ account }).
 */
export async function createGaslessAccount(config: GaslessAccountConfig): Promise<LocalAccount> {
  if (config.type === 'privateKey') return privateKeyToAccount(config.privateKey);
  const { type, ...kmsConfig } = config;
  void type;
  return kmsToAccount(kmsConfig);
}
