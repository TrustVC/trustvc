import { ethers as ethersV6, ContractRunner } from 'ethersV6';
import { v5Contracts } from '../../../src/token-registry-v5';
import { v4Contracts } from '../../../src/token-registry-v4';
import { ethers, Signer } from 'ethers';

export function getVersionedContractFactory(
  contractName: 'TradeTrustToken' | 'TitleEscrowFactory',
  ethersVersion: 'v5' | 'v6',
  titleEscrowVersion: 'v4' | 'v5',
  owner: Signer | ContractRunner,
) {
  const contracts = titleEscrowVersion === 'v5' ? v5Contracts : v4Contracts;
  const Factory = ethersVersion === 'v5' ? ethers.ContractFactory : ethersV6.ContractFactory;
  const signer = ethersVersion === 'v5' ? (owner as Signer) : (owner as ContractRunner);

  return new Factory(
    contracts[`${contractName}__factory`].abi,
    contracts[`${contractName}__factory`].bytecode,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
}

export const createContract = (
  address: string,
  contractName: 'TitleEscrow' | 'TradeTrustToken',
  ethersVersion: 'v5' | 'v6',
  contractVersion: 'v4' | 'v5',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: any,
) => {
  const contracts = contractVersion === 'v5' ? v5Contracts : v4Contracts;
  const abi = contracts[`${contractName}__factory`].abi;

  return ethersVersion === 'v5'
    ? new ethers.Contract(address, abi, signer as Signer)
    : new ethersV6.Contract(address, abi, signer as ContractRunner);
};

export const getV4TitleEscrowContractFromTitleEscrowFactory = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  provider: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  titleEscrowFactory: any,
  tradeTrustTokenAddress: string,
  tokenId: string,
) => {
  const iface = titleEscrowFactory.interface;
  const encodedData = iface.encodeFunctionData('getAddress', [tradeTrustTokenAddress, tokenId]);
  const result = await provider.call({
    to: titleEscrowFactory.target ?? titleEscrowFactory.address,
    data: encodedData,
  });
  const decodedAddress = iface.decodeFunctionResult('getAddress', result)[0];
  return decodedAddress;
};
