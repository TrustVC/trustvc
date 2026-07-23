import { DocumentLoader, SignedVerifiableCredential } from '@trustvc/w3c-vc';
import { ethers } from 'ethers';
import {
  DocumentsToVerify,
  obligationW3cVerifiers,
  verificationBuilder,
  VerificationFragment,
} from '../verify-obligation';

type VerificationBuilderOptions = {
  rpcProviderUrl?: string;
  documentLoader?: DocumentLoader;
  provider?: ethers.providers.Provider;
};

/**
 * Verifies a W3C document through the obligation / BoE verifier pipeline.
 *
 * Runs integrity, document-status (including ObligationRecords), and issuer-identity fragments.
 * - Valid BoE obligation record → `ObligationRecords` VALID
 * - Classic ETR (tokenRegistry only) → `ObligationRecords` SKIPPED
 * - Invalid obligation (e.g. not minted) → `ObligationRecords` INVALID
 * @param {DocumentsToVerify | SignedVerifiableCredential} document - Document to verify.
 * @param {VerificationBuilderOptions} [options] - RPC / provider / documentLoader options.
 * @returns {Promise<VerificationFragment[]>} Verification fragments from the obligation pipeline.
 */
export const verifyObligationDocument = (
  document: DocumentsToVerify | SignedVerifiableCredential,
  options?: VerificationBuilderOptions,
): Promise<VerificationFragment[]> => {
  const provider =
    options?.provider || new ethers.providers.JsonRpcProvider(options?.rpcProviderUrl);

  const verify = verificationBuilder(obligationW3cVerifiers, {
    provider,
    documentLoader: options?.documentLoader,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return verify(document as any);
};
