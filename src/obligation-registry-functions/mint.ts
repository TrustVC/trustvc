import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import { encrypt } from '../core';
import { obligationRegistryContracts } from '../obligation-registry';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  MintObligationRegistryParams,
  ObligationRegistryContractOptions,
  ObligationRegistryTransactionOptions,
} from './types';
import { getTxOptions } from './utils';

export const mintObligationRegistry = async (
  contractOptions: ObligationRegistryContractOptions,
  signer: Signer | SignerV6,
  params: MintObligationRegistryParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { obligationRegistry } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { beneficiaryAddress, holderAddress, tokenId, remarks } = params;
  const Contract = getEthersContractFromProvider(signer.provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obligationTokenContract: any = new Contract(
    obligationRegistry,
    obligationRegistryContracts.TrustVCToken__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    const args = [beneficiaryAddress, holderAddress, tokenId, encryptedRemarks];
    if (isV6) {
      await obligationTokenContract.mint.staticCall(...args);
    } else {
      await obligationTokenContract.callStatic.mint(...args);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for mint failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationTokenContract.mint(
    beneficiaryAddress,
    holderAddress,
    tokenId,
    encryptedRemarks,
    txOptions,
  );
};
