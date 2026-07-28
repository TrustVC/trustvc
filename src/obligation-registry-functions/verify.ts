import { verifyDocument } from '../core/verify';
import { isValid, VerificationFragment } from '../verify';
import { OBLIGATION_RECORDS_NAME } from '../verify/fragments';
import { ObligationRecordsResultFragment } from '../verify/fragments/document-status/obligationRecords/obligationRecordVerifier.types';
import { DocumentStatus, ObligationEscrowTerminationReason } from './types';
import { ethers } from 'ethers';

export interface VerifyObligationDocumentOptions {
  rpcProviderUrl?: string;
  provider?: ethers.providers.Provider;
}

export interface VerifyObligationDocumentResult {
  valid: boolean;
  fragments: VerificationFragment[];
}

/**
 * Verifies a signed BoE document via the unified `verifyDocument` pipeline.
 * @param {unknown} document - Signed W3C VC with `credentialStatus.obligationRegistry`.
 * @param {VerifyObligationDocumentOptions} [options] - RPC provider URL or ethers provider for on-chain checks.
 * @returns {Promise<VerifyObligationDocumentResult>} Overall validity and verification fragments.
 */
export const verifyObligationDocument = async (
  document: unknown,
  options: VerifyObligationDocumentOptions = {},
): Promise<VerifyObligationDocumentResult> => {
  const fragments = await verifyDocument(document as never, options);
  return { valid: isValid(fragments), fragments };
};

export interface ObligationDocumentStatus {
  obligationRegistry: string;
  status: DocumentStatus;
  terminationReason: ObligationEscrowTerminationReason;
}

/**
 * Extracts the enriched ObligationRecords status from a `verifyDocument` result.
 * @param {VerificationFragment[]} fragments - Fragments returned by `verifyDocument`.
 * @returns {ObligationDocumentStatus | null} On-chain obligation status when ObligationRecords is VALID; otherwise null.
 */
export const getObligationDocumentStatus = (
  fragments: VerificationFragment[],
): ObligationDocumentStatus | null => {
  const fragment = fragments.find((f) => f.name === OBLIGATION_RECORDS_NAME) as
    | ObligationRecordsResultFragment
    | undefined;

  if (!fragment || fragment.status !== 'VALID') return null;

  const { obligationRegistry, status, terminationReason } = fragment.data;
  if (status === undefined || terminationReason === undefined) return null;

  return {
    obligationRegistry,
    status: status as DocumentStatus,
    terminationReason: terminationReason as ObligationEscrowTerminationReason,
  };
};
