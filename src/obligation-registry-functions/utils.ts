import { Provider } from '@ethersproject/abstract-provider';
import { ContractTransaction, Signer } from 'ethers';
import { Provider as ProviderV6, Signer as SignerV6 } from 'ethersV6';
import { encrypt, getTitleEscrowAddress } from '../core';
import { obligationRegistryContracts } from '../obligation-registry';
import {
  getChainIdSafe,
  getSignerAddressSafe,
  getTxOptions,
} from '../token-registry-functions/utils';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import { ObligationEscrowContractOptions, ObligationRegistryTransactionOptions } from './types';

export { getChainIdSafe, getSignerAddressSafe, getTxOptions };

/**
 * Resolves the ObligationEscrow address for a given (obligationRegistry, tokenId) pair.
 * Delegates to the generic, contract-family-agnostic `getTitleEscrowAddress` core primitive with
 * `titleEscrowVersion` fixed to 'v5', since ObligationRegistry is a v5-only feature.
 * @param {string} obligationRegistry - Obligation registry contract address.
 * @param {string | number} tokenId - Token ID whose escrow address to resolve.
 * @param {Provider | ProviderV6} provider - Ethereum JSON-RPC provider.
 * @returns {Promise<string>} Obligation escrow contract address.
 */
export const getObligationEscrowAddress = async (
  obligationRegistry: string,
  tokenId: string | number,
  provider: Provider | ProviderV6,
): Promise<string> => {
  return getTitleEscrowAddress(obligationRegistry, String(tokenId), provider, {
    titleEscrowVersion: 'v5',
  });
};

export const encryptRemarks = (remarks?: string, id?: string): string =>
  remarks ? `0x${encrypt(remarks, id ?? '')}` : '0x';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const connectObligationEscrow = (escrowAddress: string, signer: Signer | SignerV6): any => {
  if (!signer.provider) throw new Error('Provider is required');
  const Contract = getEthersContractFromProvider(signer.provider);
  return new Contract(
    escrowAddress,
    obligationRegistryContracts.ObligationEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const connectTrustVCToken = (registryAddress: string, signer: Signer | SignerV6): any => {
  if (!signer.provider) throw new Error('Provider is required');
  const Contract = getEthersContractFromProvider(signer.provider);
  return new Contract(
    registryAddress,
    obligationRegistryContracts.TrustVCToken__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
};

export const resolveObligationEscrowAddress = async (
  contractOptions: ObligationEscrowContractOptions,
  signer: Signer | SignerV6,
): Promise<string> => {
  if (contractOptions.titleEscrowAddress) return contractOptions.titleEscrowAddress;
  const { obligationRegistry, tokenId } = contractOptions;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (tokenId === undefined || tokenId === null || tokenId === '') {
    throw new Error('Token ID is required');
  }
  if (!signer.provider) throw new Error('Provider is required');
  return getObligationEscrowAddress(obligationRegistry, tokenId, signer.provider);
};

/**
 * Runs callStatic (v5/v6) then the live write with gas options.
 * @param {any} contract - Connected ethers contract.
 * @param {string} method - Contract method name.
 * @param {unknown[]} args - Method args excluding overrides.
 * @param {Signer | SignerV6} signer - Transaction signer.
 * @param {ObligationRegistryTransactionOptions} options - Gas / encryption options.
 * @param {string} [precheckName] - Name used in the pre-check error message.
 * @returns {Promise<ContractTransaction>} Submitted transaction.
 */
export const callStaticThenSend = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contract: any,
  method: string,
  args: unknown[],
  signer: Signer | SignerV6,
  options: ObligationRegistryTransactionOptions = {},
  precheckName: string = method,
): Promise<ContractTransaction> => {
  if (!signer.provider) throw new Error('Provider is required');
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await contract[method].staticCall(...args);
    } else {
      await contract.callStatic[method](...args);
    }
  } catch (e: unknown) {
    console.error('callStatic failed:', e);
    const err = e as { reason?: string; message?: string };
    const reason = err?.reason || err?.message || String(e);
    throw new Error(`Pre-check (callStatic) for ${precheckName} failed: ${reason}`);
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await contract[method](...args, txOptions);
};
