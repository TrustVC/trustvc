import { v5Contracts } from '../token-registry-v5';
import { getChainIdSafe, getTxOptions } from '../token-registry-functions/utils';
import { CHAIN_ID } from '../utils';
import { getEthersContractFactoryFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  ContractFactory as ContractFactoryV6,
  ContractTransactionReceipt as ContractReceiptV6,
  Signer as SignerV6,
} from 'ethersV6';
import {
  ContractFactory as ContractFactoryV5,
  ContractReceipt as ContractReceiptV5,
  Signer as SignerV5,
} from 'ethers';

export type ObligationDeployOptions = {
  chainId?: CHAIN_ID;
  maxFeePerGas?: Parameters<typeof getTxOptions>[2];
  maxPriorityFeePerGas?: Parameters<typeof getTxOptions>[3];
};

export type DeployObligationEscrowFactoryResult = {
  obligationEscrowFactoryAddress: string;
  receipt: ContractReceiptV5 | ContractReceiptV6;
};

export type DeployObligationRegistryOptions = ObligationDeployOptions & {
  escrowFactoryAddress?: string;
};

export type DeployObligationRegistryResult = {
  obligationRegistry: string;
  obligationEscrowFactoryAddress: string;
  receipt: ContractReceiptV5 | ContractReceiptV6;
};

const getDeployedAddress = (
  receipt: ContractReceiptV5 | ContractReceiptV6,
  fallbackAddress?: string,
): string => {
  if (fallbackAddress) {
    return fallbackAddress;
  }

  const contractAddress =
    'contractAddress' in receipt ? receipt.contractAddress || undefined : undefined;

  if (!contractAddress) {
    throw new Error('Unable to resolve deployed contract address from receipt');
  }

  return contractAddress;
};

export const deployObligationEscrowFactory = async (
  signer: SignerV5 | SignerV6,
  options: ObligationDeployOptions = {},
): Promise<DeployObligationEscrowFactoryResult> => {
  if (!signer.provider) {
    throw new Error('Provider is required');
  }

  const chainId = options.chainId ?? ((await getChainIdSafe(signer)) as unknown as CHAIN_ID);
  const txOptions = await getTxOptions(
    signer,
    chainId,
    options.maxFeePerGas,
    options.maxPriorityFeePerGas,
  );

  const ContractFactory = getEthersContractFactoryFromProvider(signer.provider);
  const factory = new ContractFactory(
    v5Contracts.ObligationEscrowFactory__factory.abi,
    v5Contracts.ObligationEscrowFactory__factory.bytecode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );

  if (isV6EthersProvider(signer.provider)) {
    const contract = await (factory as ContractFactoryV6).deploy(txOptions);
    const receipt = await contract.deploymentTransaction()?.wait();
    if (!receipt) {
      throw new Error('Failed to deploy ObligationEscrowFactory');
    }

    return {
      obligationEscrowFactoryAddress: await contract.getAddress(),
      receipt,
    };
  }

  const contract = await (factory as ContractFactoryV5).deploy(txOptions);
  const receipt = await contract.deployTransaction.wait();
  if (!receipt) {
    throw new Error('Failed to deploy ObligationEscrowFactory');
  }

  return {
    obligationEscrowFactoryAddress: contract.address,
    receipt,
  };
};

export const deployObligationRegistry = async (
  registryName: string,
  registrySymbol: string,
  signer: SignerV5 | SignerV6,
  options: DeployObligationRegistryOptions = {},
): Promise<DeployObligationRegistryResult> => {
  if (!signer.provider) {
    throw new Error('Provider is required');
  }

  let obligationEscrowFactoryAddress = options.escrowFactoryAddress;
  if (!obligationEscrowFactoryAddress) {
    const deployedFactory = await deployObligationEscrowFactory(signer, options);
    obligationEscrowFactoryAddress = deployedFactory.obligationEscrowFactoryAddress;
  }

  const chainId = options.chainId ?? ((await getChainIdSafe(signer)) as unknown as CHAIN_ID);
  const txOptions = await getTxOptions(
    signer,
    chainId,
    options.maxFeePerGas,
    options.maxPriorityFeePerGas,
  );

  const ContractFactory = getEthersContractFactoryFromProvider(signer.provider);
  const factory = new ContractFactory(
    v5Contracts.TrustVCToken__factory.abi,
    v5Contracts.TrustVCToken__factory.bytecode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );

  if (isV6EthersProvider(signer.provider)) {
    const contract = await (factory as ContractFactoryV6).deploy(
      registryName,
      registrySymbol,
      obligationEscrowFactoryAddress,
      txOptions,
    );
    const receipt = await contract.deploymentTransaction()?.wait();
    if (!receipt) {
      throw new Error('Failed to deploy TrustVCToken obligation registry');
    }

    return {
      obligationRegistry: await contract.getAddress(),
      obligationEscrowFactoryAddress,
      receipt,
    };
  }

  const contract = await (factory as ContractFactoryV5).deploy(
    registryName,
    registrySymbol,
    obligationEscrowFactoryAddress,
    txOptions,
  );
  const receipt = await contract.deployTransaction.wait();
  if (!receipt) {
    throw new Error('Failed to deploy TrustVCToken obligation registry');
  }

  return {
    obligationRegistry: getDeployedAddress(receipt, contract.address),
    obligationEscrowFactoryAddress,
    receipt,
  };
};
