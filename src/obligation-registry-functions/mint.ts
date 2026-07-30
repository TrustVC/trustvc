import { checkSupportsInterface, encrypt } from '../core';
import { v5Contracts, v5SupportInterfaceIds } from '../token-registry-v5';
import { Signer as SignerV6, Contract as ContractV6 } from 'ethersV6';
import { Contract as ContractV5, ContractTransaction, Signer } from 'ethers';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import { getTxOptions } from './utils';
import { MintObligationTokenOptions, MintObligationTokenParams, TransactionOptions } from './types';

const mintObligationRegistry = async (
  contractOptions: MintObligationTokenOptions,
  signer: Signer | SignerV6,
  params: MintObligationTokenParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const { obligationRegistryAddress } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  if (!obligationRegistryAddress) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');

  const isSupported = await checkSupportsInterface(
    obligationRegistryAddress,
    v5SupportInterfaceIds.TradeTrustTokenMintable,
    signer.provider,
  );
  if (!isSupported) {
    throw new Error('Only TrustVCToken obligation registry is supported');
  }

  const { beneficiaryAddress, holderAddress, tokenId, remarks } = params;
  const Contract = getEthersContractFromProvider(signer.provider);
  const obligationRegistryContract = new Contract(
    obligationRegistryAddress,
    v5Contracts.TrustVCToken__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  ) as ContractV5 | ContractV6;

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';

  try {
    const isV6 = isV6EthersProvider(signer.provider);
    const args = [beneficiaryAddress, holderAddress, tokenId, encryptedRemarks];
    if (isV6) {
      await (obligationRegistryContract as ContractV6).mint.staticCall(...args);
    } else {
      await (obligationRegistryContract as ContractV5).callStatic.mint(...args);
    }
  } catch (error) {
    console.error('callStatic failed:', error);
    throw new Error('Pre-check (callStatic) for mint failed');
  }

  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return obligationRegistryContract.mint(
    beneficiaryAddress,
    holderAddress,
    tokenId,
    encryptedRemarks,
    txOptions,
  );
};

export { mintObligationRegistry };
