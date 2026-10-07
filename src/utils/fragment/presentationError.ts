import { VerificationFragment } from '@tradetrust-tt/tt-verify';
import { W3CVpCode } from '../../verify/fragments/presentation/w3cVpVerifier';
import { TYPES } from '../errorMessages/VerificationErrorMessages';

/**
 * The names of the three presentation fragments. A consumer should not have to know these —
 * `getPresentationFailure` is the supported way in.
 */
const VP_FRAGMENT_NAMES = [
  'W3CVpSignatureIntegrity',
  'W3CVpCredentialStatus',
  'W3CVpIssuerIdentity',
];

/**
 * `W3CVpCode` -> the error TYPE whose copy describes it.
 *
 * This is the whole point of the codes: a stable, exhaustive mapping from cause to message,
 * replacing the previous arrangement where each consumer regex-matched the verifier's English
 * prose and every reworded reason silently broke somebody's UI.
 */
const CODE_TO_TYPE: Record<number, string> = {
  [W3CVpCode.PRESENTATION_UNSIGNED]: TYPES.PRESENTATION_UNSIGNED,
  [W3CVpCode.PRESENTATION_PROOF_INVALID]: TYPES.PRESENTATION_TAMPERED,
  [W3CVpCode.PRESENTATION_PROOF_INCOMPLETE]: TYPES.PRESENTATION_PROOF_INCOMPLETE,
  [W3CVpCode.PRESENTATION_HOLDER_MISMATCH]: TYPES.PRESENTATION_HOLDER_MISMATCH,
  [W3CVpCode.PRESENTATION_EXPIRED]: TYPES.PRESENTATION_EXPIRED,
  [W3CVpCode.PRESENTATION_DATE_INVALID]: TYPES.PRESENTATION_DATE_INVALID,
  [W3CVpCode.PRESENTATION_EMPTY]: TYPES.PRESENTATION_EMPTY,
  [W3CVpCode.PRESENTATION_NOT_YET_VALID]: TYPES.PRESENTATION_NOT_YET_VALID,
  [W3CVpCode.CREDENTIAL_SIGNATURE_INVALID]: TYPES.CREDENTIAL_TAMPERED,
  // A credential whose subject is somebody else shares the holder-mismatch row: either way
  // the presenter cannot show these credentials are theirs, and the remedy is the same.
  [W3CVpCode.CREDENTIAL_SUBJECT_MISMATCH]: TYPES.PRESENTATION_HOLDER_MISMATCH,
  [W3CVpCode.CREDENTIAL_SUBJECT_MISSING]: TYPES.CREDENTIAL_NO_HOLDER,
  [W3CVpCode.CREDENTIAL_EXPIRED]: TYPES.CREDENTIAL_EXPIRED,
  [W3CVpCode.CREDENTIAL_NOT_YET_VALID]: TYPES.CREDENTIAL_NOT_YET_VALID,
  [W3CVpCode.CREDENTIAL_DATE_INVALID]: TYPES.CREDENTIAL_DATE_INVALID,
  [W3CVpCode.CREDENTIAL_REVOKED]: TYPES.CREDENTIAL_REVOKED,
  [W3CVpCode.CREDENTIAL_SUSPENDED]: TYPES.CREDENTIAL_SUSPENDED,
  [W3CVpCode.CREDENTIAL_STATUS_UNSUPPORTED]: TYPES.CREDENTIAL_STATUS_UNSUPPORTED,
  [W3CVpCode.CREDENTIAL_STATUS_ERROR]: TYPES.CREDENTIAL_STATUS_UNREACHABLE,
  // Merged with the unresolvable case: "we could not identify who issued it" is true of a
  // credential that names nobody just as much as one naming a DID that will not resolve.
  [W3CVpCode.CREDENTIAL_ISSUER_MISSING]: TYPES.CREDENTIAL_ISSUER_UNRESOLVABLE,
  [W3CVpCode.CREDENTIAL_ISSUER_UNRESOLVABLE]: TYPES.CREDENTIAL_ISSUER_UNRESOLVABLE,
};

/**
 * Which failure to report when several fragments fail at once — MOST SPECIFIC first, and root
 * cause ahead of symptom. Two orderings here are load-bearing rather than cosmetic:
 *
 * - **Issuer resolution before signature.** Checking an embedded credential's signature needs
 *   its issuer's public key, so an unpublished did:web ALSO fails integrity — with a raw
 *   TypeError from the failed lookup. Ordered the other way, an intact document is reported to
 *   its holder as tampered with.
 * - **Revocation before signature**, for the same reason: it is the more actionable answer, and
 *   the realistic case (revoked upstream after the presentation was signed) leaves the proof
 *   intact anyway.
 *
 * Anything unlisted falls to the end in code order, so a new code is reported rather than
 * silently dropped.
 *
 * **CREDENTIAL_STATUS_UNSUPPORTED sits above CREDENTIAL_SIGNATURE_INVALID deliberately, and it
 * has a known cost.** A credential whose status method has been swapped for an unevaluable one
 * — the shape of deliberately evading a revocation check — fails its signature too, yet is
 * reported as "we cannot check the status" rather than as an altered document. That is the
 * softer of the two true statements.
 *
 * It is ranked this way so a presentation from ANOTHER implementation, carrying a status method
 * this pipeline does not implement but an otherwise intact signature, is told what is actually
 * wrong instead of being accused of forgery. That case is the common one; evasion is not.
 *
 * Either ordering loses something, so this is a decision rather than an oversight. If you want
 * evasion reported as tampering without giving up the foreign-document case, the narrower rule
 * is: let the signature failure win only when it names the SAME credential index as the status
 * failure. `reportsStatusRatherThanTampering` in verificationError.test.ts pins today's choice
 * and will fail if the order changes, which is the point.
 */
const CODE_PRIORITY: W3CVpCode[] = [
  W3CVpCode.PRESENTATION_EMPTY,
  W3CVpCode.CREDENTIAL_ISSUER_MISSING,
  W3CVpCode.CREDENTIAL_ISSUER_UNRESOLVABLE,
  W3CVpCode.CREDENTIAL_REVOKED,
  W3CVpCode.CREDENTIAL_SUSPENDED,
  W3CVpCode.CREDENTIAL_DATE_INVALID,
  W3CVpCode.CREDENTIAL_EXPIRED,
  W3CVpCode.CREDENTIAL_NOT_YET_VALID,
  W3CVpCode.CREDENTIAL_STATUS_UNSUPPORTED,
  W3CVpCode.CREDENTIAL_STATUS_ERROR,
  W3CVpCode.PRESENTATION_UNSIGNED,
  W3CVpCode.PRESENTATION_HOLDER_MISMATCH,
  W3CVpCode.CREDENTIAL_SUBJECT_MISMATCH,
  W3CVpCode.CREDENTIAL_SUBJECT_MISSING,
  W3CVpCode.PRESENTATION_DATE_INVALID,
  W3CVpCode.PRESENTATION_EXPIRED,
  W3CVpCode.PRESENTATION_NOT_YET_VALID,
  W3CVpCode.CREDENTIAL_SIGNATURE_INVALID,
  W3CVpCode.PRESENTATION_PROOF_INVALID,

  W3CVpCode.PRESENTATION_PROOF_INCOMPLETE,
];

export interface PresentationFailure {
  code: W3CVpCode;
  codeString: string;
  /** The verifier's own prose. Diagnostic — do NOT show it to a user. */
  reason: string;
  type: string;
  credentialIndices: number[];
}

/**
 * The presentation failure a set of fragments reports, or undefined when none of them is a
 * failing presentation fragment (an OA document, a bare credential, or a valid presentation).
 * @param {VerificationFragment[]} fragments - The fragments returned by verification.
 * @returns {PresentationFailure | undefined} The highest-priority failure, if any.
 */
export const getPresentationFailure = (
  fragments: VerificationFragment[],
): PresentationFailure | undefined => {
  const failing = fragments.filter(
    (f) => VP_FRAGMENT_NAMES.includes(f.name) && (f.status === 'INVALID' || f.status === 'ERROR'),
  ) as (VerificationFragment & {
    reason?: { code?: number; codeString?: string; message?: string };
    data?: { credentialIndices?: number[] };
  })[];

  const withCodes = failing.filter(
    (f) => typeof f.reason?.code === 'number' && CODE_TO_TYPE[f.reason.code] !== undefined,
  );
  if (withCodes.length === 0) {
    // A failing presentation fragment whose code we do not recognise is STILL a presentation
    // failure, and must be answered as one. Returning undefined here hands it to
    // `errorMessageHandling`, whose OpenAttestation-shaped switch can only say HASH.
    if (failing.length === 0) return undefined;
    const first = failing[0];
    return {
      code: (first.reason?.code as W3CVpCode) ?? W3CVpCode.UNEXPECTED_ERROR,
      codeString: first.reason?.codeString ?? 'UNEXPECTED_ERROR',
      reason: first.reason?.message ?? '',
      type: TYPES.PRESENTATION_UNVERIFIABLE,
      credentialIndices: first.data?.credentialIndices ?? [],
    };
  }

  const rank = (code: number): number => {
    const i = CODE_PRIORITY.indexOf(code);
    return i === -1 ? CODE_PRIORITY.length + code : i;
  };
  const winner = withCodes.reduce((best, f) =>
    rank(f.reason?.code as number) < rank(best.reason?.code as number) ? f : best,
  );

  const code = winner.reason?.code as W3CVpCode;
  return {
    code,
    codeString: winner.reason?.codeString ?? W3CVpCode[code],
    reason: winner.reason?.message ?? '',
    type: CODE_TO_TYPE[code],
    credentialIndices: winner.data?.credentialIndices ?? [],
  };
};
