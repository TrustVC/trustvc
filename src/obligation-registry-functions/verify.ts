import { verifyObligationDocument as runObligationVerification } from '../core/verifyObligation';
import { isValid, VerificationFragment } from '../verify-obligation';
import { OBLIGATION_RECORDS_NAME } from '../verify-obligation/fragments';
import { ObligationRecordsResultFragment } from '../verify-obligation/fragments/document-status/obligationRecords/obligationRecordVerifier.types';
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
 * Verifies a signed BoE document end-to-end via the dedicated obligation verify pipeline
 * (`src/verify-obligation`): signature integrity, ObligationRecords document status, and issuer
 * identity.
 *
 * Classic ETR documents yield `ObligationRecords` SKIPPED; invalid obligation records yield
 * INVALID; valid BoE yields VALID (plus overall `valid` from all fragments).
 * @param {unknown} document - The signed BoE document to verify.
 * @param {VerifyObligationDocumentOptions} options - `rpcProviderUrl` or `provider` for on-chain checks.
 * @returns {Promise<VerifyObligationDocumentResult>} Overall validity plus every verification fragment.
 */
export const verifyObligationDocument = async (
  document: unknown,
  options: VerifyObligationDocumentOptions = {},
): Promise<VerifyObligationDocumentResult> => {
  const fragments = await runObligationVerification(document as never, options);
  return { valid: isValid(fragments), fragments };
};

export interface ObligationDocumentStatus {
  obligationRegistry: string;
  status: DocumentStatus;
  terminationReason: ObligationEscrowTerminationReason;
}

/**
 * Extracts the enriched ObligationRecords status (mint + escrow lifecycle) from an
 * obligation verify result. Returns `null` if the document isn't a valid obligation record
 * (e.g. classic ETR → SKIPPED, or verification failed).
 * @param {VerificationFragment[]} fragments - Fragments from the obligation verify pipeline.
 * @returns {ObligationDocumentStatus | null} The enriched status, or `null` if not applicable.
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
