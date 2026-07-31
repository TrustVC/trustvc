import { encrypt, getObligationEscrowAddress, checkSupportsInterface } from '../core';
import { v5Contracts } from '../token-registry-v5';
import { getTxOptions } from '../token-registry-functions/utils';
import { Signer as SignerV6, Contract as ContractV6 } from 'ethersV6';
import { Contract as ContractV5, Signer } from 'ethers';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  ObligationContractOptions,
  ObligationTransactionResponse,
  TransactionOptions,
} from './types';

export const getObligationRegistryContract = (
  obligationRegistryAddress: string,
  signerOrProvider: Signer | SignerV6,
): ContractV5 | ContractV6 => {
  const provider = signerOrProvider.provider;
  if (!provider) {
    throw new Error('Provider is required');
  }

  const Contract = getEthersContractFromProvider(provider);
  return new Contract(
    obligationRegistryAddress,
    v5Contracts.TrustVCToken__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signerOrProvider as any,
  );
};

export const resolveObligationEscrowAddress = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
): Promise<string> => {
  let { obligationEscrowAddress } = contractOptions;

  if (!obligationEscrowAddress) {
    const { obligationRegistryAddress, tokenId } = contractOptions;
    if (!obligationRegistryAddress) {
      throw new Error('Obligation registry address is required');
    }
    if (tokenId === undefined || tokenId === '') {
      throw new Error('Token ID is required');
    }
    if (!signer.provider) {
      throw new Error('Provider is required');
    }

    obligationEscrowAddress = await getObligationEscrowAddress(
      obligationRegistryAddress,
      tokenId as string,
      signer.provider,
      { titleEscrowVersion: 'v5' },
    );
  }

  if (!obligationEscrowAddress) {
    throw new Error('Obligation escrow address is required');
  }

  return obligationEscrowAddress;
};

export const getObligationEscrowContract = (
  obligationEscrowAddress: string,
  signer: Signer | SignerV6,
): ContractV5 | ContractV6 => {
  const Contract = getEthersContractFromProvider(signer.provider!);
  return new Contract(
    obligationEscrowAddress,
    v5Contracts.ObligationEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
};

export const getEncryptedRemarks = (
  remarks: string | undefined,
  id: string | undefined,
): string => {
  if (remarks && !id) {
    throw new Error('An `id` is required to encrypt remarks');
  }
  return remarks && id ? `0x${encrypt(remarks, id)}` : '0x';
};

export const runStaticCall = async (
  contract: ContractV5 | ContractV6,
  method: string,
  args: unknown[],
  provider: Signer['provider'] | SignerV6['provider'],
): Promise<void> => {
  try {
    if (isV6EthersProvider(provider)) {
      await (contract as ContractV6)[method].staticCall(...args);
    } else {
      await (contract as ContractV5).callStatic[method](...args);
    }
  } catch (error) {
    console.error('callStatic failed:', error);
    throw new Error(`Pre-check (callStatic) for ${method} failed`);
  }
};

export const sendTransaction = async (
  contract: ContractV5 | ContractV6,
  method: string,
  args: unknown[],
  signer: Signer | SignerV6,
  options: {
    chainId?: Parameters<typeof getTxOptions>[1];
    maxFeePerGas?: Parameters<typeof getTxOptions>[2];
    maxPriorityFeePerGas?: Parameters<typeof getTxOptions>[3];
  },
): Promise<ObligationTransactionResponse> => {
  const txOptions = await getTxOptions(
    signer,
    options.chainId,
    options.maxFeePerGas,
    options.maxPriorityFeePerGas,
  );
  if (isV6EthersProvider(signer.provider)) {
    return (contract as ContractV6)[method](...args, txOptions);
  }
  return (contract as ContractV5)[method](...args, txOptions);
};

export const getEscrowContract = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
): Promise<ContractV5 | ContractV6> => {
  if (!signer.provider) throw new Error('Provider is required');
  const address = await resolveObligationEscrowAddress(contractOptions, signer);
  return getObligationEscrowContract(address, signer);
};

export const executeEscrowMethod = async (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  method: string,
  args: unknown[],
  options: TransactionOptions,
): Promise<ObligationTransactionResponse> => {
  const obligationEscrowContract = await getEscrowContract(contractOptions, signer);
  await runStaticCall(obligationEscrowContract, method, args, signer.provider);
  return sendTransaction(obligationEscrowContract, method, args, signer, options);
};

export const createRemarkEscrowMethod =
  (method: string) =>
  (
    contractOptions: ObligationContractOptions,
    signer: Signer | SignerV6,
    params: { remarks?: string },
    options: TransactionOptions,
  ): Promise<ObligationTransactionResponse> =>
    executeEscrowMethod(
      contractOptions,
      signer,
      method,
      [getEncryptedRemarks(params.remarks, options.id)],
      options,
    );

export const executeRegistryMethod = async (
  obligationRegistryAddress: string,
  signer: Signer | SignerV6,
  interfaceId: string,
  method: string,
  args: unknown[],
  options: TransactionOptions,
): Promise<ObligationTransactionResponse> => {
  if (!obligationRegistryAddress) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');

  const isSupported = await checkSupportsInterface(
    obligationRegistryAddress,
    interfaceId,
    signer.provider,
  );
  if (!isSupported) {
    throw new Error('Only TrustVCToken obligation registry is supported');
  }

  const obligationRegistryContract = getObligationRegistryContract(
    obligationRegistryAddress,
    signer,
  );
  await runStaticCall(obligationRegistryContract, method, args, signer.provider);
  return sendTransaction(obligationRegistryContract, method, args, signer, options);
};

export { getTxOptions };
