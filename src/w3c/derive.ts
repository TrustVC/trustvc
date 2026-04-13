import { deriveCredential, DerivedResult, SignedVerifiableCredential } from '@trustvc/w3c-vc';
import { emitW3CTelemetry, getProofCryptosuite } from './telemetry';

/**
 * Derives a credential with selective disclosure based on revealed attributes.
 * @param {object} credential - The verifiable credential to be selectively disclosed.
 * @param {string[]} revealedAttributes - Array of selective pointers.
 * @returns {Promise<DerivedResult>} A DerivedResult containing the derived proof or an error message.
 */

export const deriveW3C = async (
  credential: SignedVerifiableCredential,
  revealedAttributes: string[],
): Promise<DerivedResult> => {
  const result = await deriveCredential(credential, revealedAttributes);
  emitW3CTelemetry(
    'issuance',
    credential,
    getProofCryptosuite(credential.proof),
    credential.proof?.verificationMethod,
  );

  return result;
};
