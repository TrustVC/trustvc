import { deriveCredential, DerivedResult, SignedVerifiableCredential } from '@trustvc/w3c-vc';
import { emitTelemetry, extractDidMethod } from '../utils/telemetry';

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

  emitTelemetry({
    action_type: 'issuance',
    document_format: 'w3c_vc',
    cryptosuite: credential.proof?.cryptosuite ?? credential.proof?.type ?? 'unknown',
    did_method: extractDidMethod(
      credential.proof?.verificationMethod ??
        (typeof credential.issuer === 'string' ? credential.issuer : '') ??
        '',
    ),
  }).catch(() => {});

  return result;
};
