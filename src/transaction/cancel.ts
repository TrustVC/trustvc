/**
 * Transaction Cancel Module
 *
 * Cancels a pending transaction by replacing it with a 0-value transaction to self
 * using the same nonce and a higher gas price (e.g. 2x when using --transaction-hash).
 * @see https://info.etherscan.com/how-to-cancel-ethereum-pending-transactions/
 */

import { BigNumber } from 'ethers';

const GAS_PRICE_SCALE_WHEN_FROM_HASH = 2;

export interface CancelTransactionOptions {
  /** Pending transaction nonce (use with gasPrice, or use transactionHash instead) */
  nonce?: string;
  /** Gas price higher than the pending transaction (use with nonce) */
  gasPrice?: string;
  /** Pending transaction hash; nonce and gas price will be fetched and gas price increased by 100% */
  transactionHash?: string;
}

/** Signer with provider, compatible with ethers v5 and v6. */
export interface CancelTransactionSigner {
  getAddress(): Promise<string>;
  provider: { getTransaction?(hash: string): Promise<unknown> } | null;
  sendTransaction(tx: Record<string, unknown>): Promise<{ hash: string }>;
}

/**
 * Cancels a pending transaction by sending a 0-value transaction to self with the same nonce
 * and a higher gas price. Supports both ethers v5 and v6 signers via a unified transaction object.
 * @param {CancelTransactionSigner} signer - Signer with provider (ethers v5 or v6)
 * @param {CancelTransactionOptions} options - Either (nonce + gasPrice) or transactionHash
 * @returns {Promise<string>} The replacement transaction hash
 * @throws If neither (nonce and gasPrice) nor transactionHash is provided
 * @throws If provider is not available on signer
 */
export const cancelTransaction = async (
  signer: CancelTransactionSigner,
  options: CancelTransactionOptions,
): Promise<string> => {
  if (!signer.provider) {
    throw new Error('Provider is required on signer');
  }

  const { nonce, gasPrice, transactionHash } = options;
  let transactionNonce: string | undefined = nonce;
  let transactionGasPrice: string | undefined = gasPrice;

  if (transactionHash) {
    if (typeof signer.provider.getTransaction !== 'function') {
      throw new Error('Provider does not support getTransaction');
    }
    const tx = await signer.provider.getTransaction(transactionHash);
    if (!tx) {
      throw new Error(`Transaction not found: ${transactionHash}`);
    }
    const txNonce = (tx as { nonce: number }).nonce;
    const txGasPrice = (tx as { gasPrice?: bigint | BigNumber | null }).gasPrice;
    if (txGasPrice == null) {
      throw new Error(
        'Transaction uses EIP-1559 (no gasPrice). Cancel by providing --nonce and --gas-price explicitly.',
      );
    }
    transactionNonce = String(txNonce);
    const scaled =
      typeof txGasPrice === 'bigint'
        ? txGasPrice * BigInt(GAS_PRICE_SCALE_WHEN_FROM_HASH)
        : BigNumber.from(txGasPrice).mul(GAS_PRICE_SCALE_WHEN_FROM_HASH);
    transactionGasPrice = String(scaled);
  }

  if (!transactionNonce || !transactionGasPrice) {
    throw new Error(
      'Provide either (--nonce and --gas-price) or --transaction-hash to cancel the pending transaction',
    );
  }

  const address = await signer.getAddress();
  if (!/^\d+$/.test(transactionNonce)) {
    throw new Error('Invalid nonce: expected a non-negative integer');
  }
  if (!/^\d+$/.test(transactionGasPrice) || transactionGasPrice === '0') {
    throw new Error('Invalid gasPrice: expected a positive integer string in wei');
  }
  const nonceNum = Number(transactionNonce);

  const txResponse = await signer.sendTransaction({
    to: address,
    value: 0,
    nonce: nonceNum,
    gasPrice: transactionGasPrice,
    gasLimit: 21000,
  });
  return txResponse.hash;
};
