import { DocumentLoader, verifyCredential } from '@trustvc/w3c-vc';
import { SignedVerifiableCredential, VerificationResult } from './types';
import { emitTelemetry, extractDidMethod } from '../utils/telemetry';

/**
 * Verifies the signature of a W3C Verifiable Credential.
 * @param {SignedVerifiableCredential} credential - The signed verifiable credential that needs to be verified.
 * @param {object} options - Optional value
 * @param {DocumentLoader} options.documentLoader - The document loader to be used for loading JSON-LD contexts / did.
 * @returns {Promise<VerificationResult>} A promise that resolves to the verification result, indicating whether the credential is valid.
 */
export const verifyW3CSignature = async (
  credential: SignedVerifiableCredential,
  options?: { documentLoader?: DocumentLoader },
): Promise<VerificationResult> => {
  // Call the verifyCredential function from the trustvc/w3c-vc package to verify the credential
  const result = await verifyCredential(credential, options);

  const issuerDid =
    typeof credential.issuer === 'string' ? credential.issuer : (credential.issuer?.id ?? '');
  emitTelemetry({
    action_type: 'verification',
    document_format: 'w3c_vc',
    cryptosuite: credential.proof?.cryptosuite ?? credential.proof?.type ?? 'unknown',
    did_method: extractDidMethod(issuerDid),
  }).catch(() => {});

  return result;
};
