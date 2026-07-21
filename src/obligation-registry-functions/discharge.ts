import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import { encrypt } from '../core';
import { obligationRegistryContracts } from '../obligation-registry';
import { getEthersContractFromProvider, isV6EthersProvider } from '../utils/ethers';
import {
  DischargeObligationRegistryParams,
  ObligationRegistryContractOptions,
  ObligationRegistryTransactionOptions,
} from './types';
import { getObligationEscrowAddress, getTxOptions } from './utils';

export const dischargeObligationRegistry = async (
  contractOptions: ObligationRegistryContractOptions,
  signer: Signer | SignerV6,
  params: DischargeObligationRegistryParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { obligationRegistry } = contractOptions;
  const { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { tokenId, remarks } = params;
  const escrowAddress = await getObligationEscrowAddress(
    obligationRegistry,
    tokenId,
    signer.provider,
  );
  const Contract = getEthersContractFromProvider(signer.provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const obligationEscrowContract: any = new Contract(
    escrowAddress,
    obligationRegistryContracts.ObligationEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id ?? '')}` : '0x';
  try {
    const isV6 = isV6EthersProvider(signer.provider);
    if (isV6) {
      await obligationEscrowContract.discharge.staticCall(encryptedRemarks);
    } else {
      await obligationEscrowContract.callStatic.discharge(encryptedRemarks);
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for discharge failed');
  }
  const txOptions = await getTxOptions(signer, chainId, maxFeePerGas, maxPriorityFeePerGas);
  return await obligationEscrowContract.discharge(encryptedRemarks, txOptions);
};
