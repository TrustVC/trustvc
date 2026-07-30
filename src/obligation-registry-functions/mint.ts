import { v5SupportInterfaceIds } from '../token-registry-v5';
import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import { executeRegistryMethod, getEncryptedRemarks } from './utils';
import { MintObligationTokenOptions, MintObligationTokenParams, TransactionOptions } from './types';

const mintObligationRegistry = async (
  contractOptions: MintObligationTokenOptions,
  signer: Signer | SignerV6,
  params: MintObligationTokenParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  return executeRegistryMethod(
    contractOptions.obligationRegistryAddress,
    signer,
    v5SupportInterfaceIds.TradeTrustTokenMintable,
    'mint',
    [params.beneficiaryAddress, params.holderAddress, params.tokenId, encryptedRemarks],
    options,
  );
};

export { mintObligationRegistry };
