import { DocumentLoader, verifyCredential } from '@trustvc/w3c-vc';
import { SignedVerifiableCredential, VerificationResult } from './types';

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
  return verifyCredential(credential, options);
};
