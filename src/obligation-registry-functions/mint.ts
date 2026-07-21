import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  MintObligationRegistryParams,
  ObligationRegistryContractOptions,
  ObligationRegistryTransactionOptions,
} from './types';
import { callStaticThenSend, connectTrustVCToken, encryptRemarks } from './utils';

export const mintObligationRegistry = async (
  contractOptions: ObligationRegistryContractOptions,
  signer: Signer | SignerV6,
  params: MintObligationRegistryParams,
  options: ObligationRegistryTransactionOptions = {},
): Promise<ContractTransaction> => {
  const { obligationRegistry } = contractOptions;
  if (!obligationRegistry) throw new Error('Obligation registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { beneficiaryAddress, holderAddress, tokenId, remarks } = params;
  return callStaticThenSend(
    connectTrustVCToken(obligationRegistry, signer),
    'mint',
    [beneficiaryAddress, holderAddress, tokenId, encryptRemarks(remarks, options.id)],
    signer,
    options,
  );
};
