import {
  createPresentation,
  DocumentLoader,
  PresentationSigningResult,
  PresentationVerificationResult,
  RawVerifiablePresentation,
  signPresentation,
  SignedVerifiableCredential,
  verifyPresentation,
} from '@trustvc/w3c-vc';
import { PrivateKeyPair } from './types';

// Combined create + sign options (createPresentation options + signPresentation options).
type CreatePresentationOptions = NonNullable<Parameters<typeof createPresentation>[1]>;
type SignPresentationOptions = NonNullable<Parameters<typeof signPresentation>[2]>;
type SignW3CPresentationOptions = CreatePresentationOptions & SignPresentationOptions;

// The trustvc layer ENFORCES these policies rather than trusting the caller to pass them:
//  - fullDisclosure     → accept underived credentials (auto full-disclosure); already-derived
//                         credentials keep their selective disclosure.
//  - checkHolderBinding → the signing key's DID must equal the holder and every
//                         credentialSubject.id (enforced at sign AND verify).
//  - version 'v2'       → the presentation ENVELOPE is always VC Data Model v2.0
//                         (validFrom/validUntil). Embedded credentials keep their own version.
//  - expiry             → createPresentation always stamps validFrom/validUntil (mandatory).
// So callers cannot omit or disable them; they only supply the per-request values below.
const ENFORCED_SIGN = {
  fullDisclosure: true,
  checkHolderBinding: true,
  version: 'v2',
} as const;
const ENFORCED_VERIFY = { checkHolderBinding: true } as const;

// Callers may set everything EXCEPT the enforced flags, AND must specify the VP lifetime
// (either `expiresInSeconds` or an explicit `validUntil`) so an expiry is never left to a
// silent default.
type BaseSignerOptions = Omit<
  SignW3CPresentationOptions,
  keyof typeof ENFORCED_SIGN | 'expiresInSeconds' | 'validUntil'
>;
type SignerOptions = BaseSignerOptions & ({ expiresInSeconds: number } | { validUntil: string });

/**
 * Creates AND signs a Verifiable Presentation in a single call, with trustvc's
 * policies ENFORCED: underived credentials are auto full-disclosed, holder binding
 * is required (signing key DID == holder == every credentialSubject.id), and a
 * mandatory expiry is stamped. With a `challenge` an authentication proof is produced;
 * without one, an assertionMethod proof.
 * @param {SignedVerifiableCredential | SignedVerifiableCredential[]} verifiableCredential - Credential(s) to present.
 * @param {PrivateKeyPair} keyPair - The holder's ECDSA (P-256) Multikey key pair.
 * @param {object} options - Per-request options (holder, challenge, domain, ...). The VP
 *   lifetime is REQUIRED: pass `expiresInSeconds` OR an explicit `validUntil`.
 *   `fullDisclosure` and `checkHolderBinding` are enforced and cannot be set here.
 * @returns {Promise<PresentationSigningResult>} The signed presentation or an error.
 */
export const signW3CPresentation = async (
  verifiableCredential: SignedVerifiableCredential | SignedVerifiableCredential[],
  keyPair: PrivateKeyPair,
  options: SignerOptions,
): Promise<PresentationSigningResult> => {
  // Runtime guards (in case the types are bypassed).
  if (!keyPair) {
    return { error: 'a signing key (keyPair) is required to sign a presentation.' };
  }
  const opts = options as { expiresInSeconds?: number; validUntil?: string };
  if (opts?.expiresInSeconds == null && !opts?.validUntil) {
    return {
      error: 'a VP lifetime is required: pass "expiresInSeconds" or "validUntil".',
    };
  }
  const enforced = { ...options, ...ENFORCED_SIGN };
  let presentation: RawVerifiablePresentation;
  try {
    presentation = await createPresentation(verifiableCredential, enforced);
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Failed to create the presentation.' };
  }
  return signPresentation(presentation, keyPair, enforced);
};

// Per-request verify options. `checkHolderBinding` is enforced by the wrapper and so is
// deliberately NOT settable here.
type VerifierOptions = {
  challenge?: string;
  domain?: string;
  requireProof?: boolean;
  maxLifetimeSeconds?: number;
  documentLoader?: DocumentLoader;
};

/**
 * Verifies a Verifiable Presentation with trustvc's policies ENFORCED: holder binding
 * is required (a valid holder proof whose key DID == holder == every credentialSubject.id)
 * and the VP expiry is checked. Every embedded credential is verified too.
 * @param {RawVerifiablePresentation} presentation - The presentation to verify.
 * @param {VerifierOptions} [options] - Per-request options (challenge, domain,
 *   maxLifetimeSeconds, ...). `checkHolderBinding` is enforced and cannot be disabled.
 * @returns {Promise<PresentationVerificationResult>} The aggregated verification result.
 */
export const verifyW3CPresentation = async (
  presentation: RawVerifiablePresentation,
  options?: VerifierOptions,
): Promise<PresentationVerificationResult> => {
  return verifyPresentation(presentation, { ...options, ...ENFORCED_VERIFY });
};
