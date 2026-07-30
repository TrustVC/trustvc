import { v5SupportInterfaceIds } from '../token-registry-v5';
import { Signer as SignerV6 } from 'ethersV6';
import { ContractTransaction, Signer } from 'ethers';
import {
  AcceptReturnedObligationOptions,
  AcceptReturnedObligationParams,
  RejectReturnedObligationOptions,
  RejectReturnedObligationParams,
  TransactionOptions,
} from './types';
import { createRemarkEscrowMethod, executeRegistryMethod, getEncryptedRemarks } from './utils';

const returnToIssuerObligationRegistry = createRemarkEscrowMethod('returnToIssuer');

const acceptReturnedObligationRegistry = async (
  contractOptions: AcceptReturnedObligationOptions,
  signer: Signer | SignerV6,
  params: AcceptReturnedObligationParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  return executeRegistryMethod(
    contractOptions.obligationRegistryAddress,
    signer,
    v5SupportInterfaceIds.TradeTrustTokenBurnable,
    'burn',
    [params.tokenId, encryptedRemarks],
    options,
  );
};

const rejectReturnedObligationRegistry = async (
  contractOptions: RejectReturnedObligationOptions,
  signer: Signer | SignerV6,
  params: RejectReturnedObligationParams,
  options: TransactionOptions,
): Promise<ContractTransaction> => {
  const encryptedRemarks = getEncryptedRemarks(params.remarks, options.id);
  return executeRegistryMethod(
    contractOptions.obligationRegistryAddress,
    signer,
    v5SupportInterfaceIds.TradeTrustTokenRestorable,
    'restore',
    [params.tokenId, encryptedRemarks],
    options,
  );
};

export {
  returnToIssuerObligationRegistry,
  acceptReturnedObligationRegistry,
  rejectReturnedObligationRegistry,
};
