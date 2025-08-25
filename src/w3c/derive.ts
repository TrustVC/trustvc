import {
  ContextDocument,
  deriveCredential,
  DerivedResult,
  SignedVerifiableCredential,
} from '@trustvc/w3c-vc';

/**
 * Derives a credential with selective disclosure based on revealed attributes.
 * @param {object} credential - The verifiable credential to be selectively disclosed.
 * @param {object|string[]} revealedAttributes - For BBS+: The attributes from the credential that should be revealed. For ECDSA-SD-2023: Array of selective pointers.
 * @returns {Promise<DerivedResult>} A DerivedResult containing the derived proof or an error message.
 */

export const deriveW3C = async (
  credential: SignedVerifiableCredential,
  revealedAttributes: ContextDocument | string[],
): Promise<DerivedResult> => {
  return deriveCredential(credential, revealedAttributes);
};
