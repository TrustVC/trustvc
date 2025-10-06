import { deriveCredential, DerivedResult, SignedVerifiableCredential } from '@trustvc/w3c-vc';

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
  return deriveCredential(credential, revealedAttributes);
};
