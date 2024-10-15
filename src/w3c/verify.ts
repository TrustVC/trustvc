import { verifyCredential } from '@trustvc/w3c-vc';
import { SignedVerifiableCredential, VerificationResult } from './types';

/**
 * Verifies the signature of a W3C Verifiable Credential.
 *
 * @param {SignedVerifiableCredential} credential - The signed verifiable credential that needs to be verified.
 *
 * @returns {Promise<VerificationResult>} A promise that resolves to the verification result, indicating whether the credential is valid.
 *
 */
export const verifyW3CSignature = async (
  credential: SignedVerifiableCredential,
): Promise<VerificationResult> => {
  // Call the verifyCredential function from the trustvc/w3c-vc package to verify the credential
  return verifyCredential(credential);
};
