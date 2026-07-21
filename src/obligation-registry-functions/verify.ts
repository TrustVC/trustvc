import { verifyDocument } from '../core';
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
 * Verifies a signed BoE document end-to-end: signature integrity, on-chain document status
 * (mint + ObligationEscrow lifecycle via `credentialStatusObligationRecordVerifier`), and issuer
 * identity. Thin wrapper around `verifyDocument` — same underlying pipeline used for classic
 * TransferableRecords, just surfaced here so obligation-registry consumers don't need to reach
 * into `verify/fragments` directly.
 * @param {unknown} document - The signed BoE document to verify.
 * @param {VerifyObligationDocumentOptions} options - `rpcProviderUrl` or `provider` for on-chain checks.
 * @returns {Promise<VerifyObligationDocumentResult>} Overall validity plus every verification fragment.
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
 * Extracts the enriched ObligationRecords status (mint + escrow lifecycle) from a
 * `verifyObligationDocument` result. Returns `null` if the document isn't a valid, recognized
 * obligation record (e.g. it's a classic TransferableRecords document, or verification failed).
 * @param {VerificationFragment[]} fragments - Fragments returned by `verifyObligationDocument`.
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
