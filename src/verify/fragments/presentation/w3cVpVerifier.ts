import { VerificationFragment, Verifier, VerifierOptions } from '@tradetrust-tt/tt-verify';
import { DocumentLoader } from '@trustvc/w3c-context';
import { isDidKey, parseDidKey, queryDidDocument } from '@trustvc/w3c-issuer';
import {
  BitstringStatusListCredentialStatus,
  CredentialStatusType,
} from '@trustvc/w3c-credential-status';
import {
  CredentialStatus,
  SignedVerifiableCredential,
  VerifiablePresentation,
  verifyCredential,
  verifyCredentialStatus,
  verifyPresentation,
} from '@trustvc/w3c-vc';

// StatusList credentialStatus types this pipeline can evaluate for revocation.
const SUPPORTED_STATUS_TYPES = new Set(['BitstringStatusListEntry', 'StatusList2021Entry']);

/**
 * Machine-readable cause of a VP verification failure.
 *
 * `reason.message` is developer-facing prose and is free to be reworded; THIS is the stable
 * contract a consumer keys user-facing copy off. Every INVALID/ERROR fragment below carries
 * one, alongside `data.credentialIndices` naming the embedded credential(s) at fault — so a
 * renderer never has to parse English to find out what went wrong or which credential to blame.
 *
 * Codes are grouped by subject: 1x = the presentation envelope, 2x = an embedded credential.
 */
export enum W3CVpCode {
  SKIPPED = 0,
  UNEXPECTED_ERROR = 1,

  // The presentation envelope itself.
  PRESENTATION_UNSIGNED = 10,
  PRESENTATION_PROOF_INVALID = 11,
  PRESENTATION_PROOF_INCOMPLETE = 12,
  PRESENTATION_HOLDER_MISMATCH = 13,
  PRESENTATION_EXPIRED = 14,
  PRESENTATION_DATE_INVALID = 15,
  PRESENTATION_EMPTY = 16,
  PRESENTATION_NOT_YET_VALID = 17,

  // An embedded credential.
  CREDENTIAL_SIGNATURE_INVALID = 20,
  CREDENTIAL_SUBJECT_MISMATCH = 21,
  CREDENTIAL_SUBJECT_MISSING = 31,
  CREDENTIAL_EXPIRED = 22,
  CREDENTIAL_NOT_YET_VALID = 23,
  CREDENTIAL_DATE_INVALID = 24,
  CREDENTIAL_REVOKED = 25,
  CREDENTIAL_SUSPENDED = 26,
  CREDENTIAL_STATUS_UNSUPPORTED = 27,
  CREDENTIAL_STATUS_ERROR = 28,
  CREDENTIAL_ISSUER_MISSING = 29,
  CREDENTIAL_ISSUER_UNRESOLVABLE = 30,
}

/**
 * `codeString` for a code — the enum key, matching how the OA fragments spell theirs.
 * @param {W3CVpCode} code - The code to name.
 * @returns {string} The enum key for that code.
 */
const codeStringOf = (code: W3CVpCode): string => W3CVpCode[code];

/**
 * Builds a fragment `reason`, keeping code/codeString/message in step.
 * @param {W3CVpCode} code - The machine-readable cause.
 * @param {string} message - Developer-facing prose describing it.
 * @returns {object} The fragment reason, as `{ code, codeString, message }`.
 */
const vpReason = (code: W3CVpCode, message: string) => ({
  code,
  codeString: codeStringOf(code),
  message,
});

// A document is a Verifiable Presentation when its `type` includes
// `VerifiablePresentation` and it carries a `verifiableCredential` field.
const isVpDocument = (document: unknown): boolean => {
  const doc = document as VerifiablePresentation;
  if (!doc || typeof doc !== 'object') return false;
  const types = Array.isArray(doc.type) ? doc.type : [doc.type];
  return types.includes('VerifiablePresentation') && 'verifiableCredential' in doc;
};

// Normalises `verifiableCredential` into an array.
const getCredentials = (doc: VerifiablePresentation): SignedVerifiableCredential[] => {
  const vc = doc?.verifiableCredential;
  if (!vc) return [];
  return Array.isArray(vc) ? vc : [vc];
};

const readId = (value: unknown): string | undefined => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return (value as { id?: string }).id;
};

// Strips the fragment off a verification-method id: `did:...#key` -> `did:...`.
const getDidFromId = (id: string | undefined): string | undefined =>
  id ? id.split('#')[0] : undefined;

// Normalises an object-or-array value into an array (empty when absent).
const toArray = <T>(value: T | T[] | undefined | null): T[] => {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
};

// Returns ALL credentialSubjects (credentialSubject may be an object or an array).
const getSubjects = (cred: SignedVerifiableCredential): unknown[] =>
  toArray(cred?.credentialSubject as unknown);

// The temporal window of a credential, honouring both VC Data Model versions:
// v2.0 uses validFrom/validUntil, v1.1 uses issuanceDate/expirationDate.
const getCredentialWindow = (
  cred: SignedVerifiableCredential,
): { from?: string; until?: string } => {
  const c = cred as {
    validFrom?: string;
    validUntil?: string;
    issuanceDate?: string;
    expirationDate?: string;
  };
  return { from: c.validFrom ?? c.issuanceDate, until: c.validUntil ?? c.expirationDate };
};

// True when `value` parses to a real date. `new Date('garbage')` is an Invalid Date, whose
// comparisons all read false — so an unparseable validFrom/validUntil would otherwise slip
// through the temporal checks as "valid". Callers must reject a present-but-unparseable value.
const isValidDate = (value: string): boolean => !Number.isNaN(new Date(value).getTime());

// Classifies one embedded credential's validity window: unparseable, expired, not-yet-valid,
// or in range (undefined). Split out so the scan below stays a flat loop.
const classifyCredentialWindow = (
  cred: SignedVerifiableCredential,
  now: Date,
): { code: W3CVpCode; message: string; data: Record<string, unknown> } | undefined => {
  const { from, until } = getCredentialWindow(cred);
  // Reject unparseable values before comparing (Invalid Date comparisons all read false).
  if (until !== undefined && !isValidDate(until)) {
    return {
      code: W3CVpCode.CREDENTIAL_DATE_INVALID,
      message: `has an unparseable validUntil ("${until}").`,
      data: { validUntil: until },
    };
  }
  if (from !== undefined && !isValidDate(from)) {
    return {
      code: W3CVpCode.CREDENTIAL_DATE_INVALID,
      message: `has an unparseable validFrom ("${from}").`,
      data: { validFrom: from },
    };
  }
  if (until && now > new Date(until)) {
    return {
      code: W3CVpCode.CREDENTIAL_EXPIRED,
      message: `has expired (validUntil ${until}).`,
      data: { expired: true, validUntil: until },
    };
  }
  if (from && now < new Date(from)) {
    return {
      code: W3CVpCode.CREDENTIAL_NOT_YET_VALID,
      message: `is not yet valid (validFrom ${from}).`,
      data: { notYetValid: true, validFrom: from },
    };
  }
  return undefined;
};

// Finds the embedded credentials outside their validity window — unparseable, expired, or
// not-yet-valid — returning the reason + fragment data, or undefined when all are within range.
//
// The FIRST problem found still decides the code and the message (so the reason prose is
// unchanged from before codes existed), but every other credential failing the SAME way is
// collected into `credentialIndices`: a presentation with three expired credentials should tell
// the holder about all three, not send them back twice more.
const findEmbeddedTemporalError = (
  credentials: SignedVerifiableCredential[],
  now: Date,
): { code: W3CVpCode; message: string; data: Record<string, unknown> } | undefined => {
  const problems = credentials.map((cred) => classifyCredentialWindow(cred, now));
  const firstIdx = problems.findIndex((p) => p !== undefined);
  if (firstIdx === -1) return undefined;

  const first = problems[firstIdx] as NonNullable<(typeof problems)[number]>;
  const credentialIndices = problems
    .map((p, i) => (p?.code === first.code ? i : -1))
    .filter((i) => i !== -1);

  return {
    code: first.code,
    message: `Embedded credential at index ${firstIdx} ${first.message}`,
    data: { ...first.data, credentialIndex: firstIdx, credentialIndices },
  };
};

// Holder binding: the signer's DID (from the proof's verificationMethod) must equal the
// holder and every credentialSubject.id. Returns the failure (code + message, plus the
// credential indices when the fault is a credential's), or undefined when bound.
//
// The codes separate two different stories for the user: the PRESENTATION was signed by the
// wrong party (nothing here is provably the presenter's), versus one CREDENTIAL inside it is
// about somebody else. Same check, opposite remedies.
const checkVpHolderBinding = (
  doc: VerifiablePresentation,
): { code: W3CVpCode; message: string; credentialIndices?: number[] } | undefined => {
  const signerDid = getDidFromId(doc.proof?.verificationMethod as string | undefined);
  const holder = readId(doc.holder);
  if (!signerDid) {
    return {
      code: W3CVpCode.PRESENTATION_PROOF_INCOMPLETE,
      message: 'the presentation proof has no "verificationMethod" to bind to.',
    };
  }
  if (holder && holder !== signerDid) {
    return {
      code: W3CVpCode.PRESENTATION_HOLDER_MISMATCH,
      message: `the presentation was signed by "${signerDid}", which does not match the declared holder "${holder}".`,
    };
  }
  const owner = holder ?? signerDid;
  const credentials = getCredentials(doc);
  for (let i = 0; i < credentials.length; i++) {
    const subjects = getSubjects(credentials[i]);
    if (subjects.length === 0) {
      return {
        code: W3CVpCode.CREDENTIAL_SUBJECT_MISSING,
        message: `credential at index ${i} has no credentialSubject, so it cannot be bound to the holder.`,
        credentialIndices: [i],
      };
    }
    // EVERY subject must be the holder — a credential with a second subject bound to a
    // different DID must not pass.
    for (const subject of subjects) {
      const subjectId = readId(subject);
      if (!subjectId) {
        return {
          code: W3CVpCode.CREDENTIAL_SUBJECT_MISSING,
          message: `credential at index ${i} has a subject with no "credentialSubject.id", so it cannot be bound to the holder.`,
          credentialIndices: [i],
        };
      }
      if (subjectId !== owner) {
        return {
          code: W3CVpCode.CREDENTIAL_SUBJECT_MISMATCH,
          message: `credentialSubject.id ("${subjectId}") of credential at index ${i} does not match the presentation holder/signer ("${owner}").`,
          credentialIndices: [i],
        };
      }
    }
  }
  return undefined;
};

// Resolves a DID (did:key in-memory, did:web via loader/well-known).
const checkDidResolve = async (did: string, documentLoader?: DocumentLoader): Promise<boolean> => {
  try {
    if (isDidKey(did)) {
      parseDidKey(did);
      return true;
    }
    if (documentLoader) {
      return !!(await documentLoader(did)).document;
    }
    const { wellKnownDid } = await queryDidDocument({ did });
    return !!wellKnownDid;
  } catch {
    return false;
  }
};

// ---------------------------------------------------------------------------
// DOCUMENT_INTEGRITY — the holder proof (crypto only) + every embedded credential's SIGNATURE.
// This fragment is strictly cryptographic: it does NOT judge temporal validity (expiry /
// not-yet-valid) or revocation of embedded credentials — those are DOCUMENT_STATUS concerns
// handled by `w3cVpCredentialStatus`. That is why the embedded credentials are checked with
// `verifyCredential` (signature-only) rather than `verifyPresentation`'s `credentialResults`,
// which fold expiry + revocation into each credential's `verified` flag.
// NOTE: challenge/domain are NOT enforced here either — they are interactive (anti-replay /
// audience) concerns that a stateless verification pipeline cannot check.
// ---------------------------------------------------------------------------
export const w3cVpSignatureIntegrity: Verifier<VerificationFragment> = {
  skip: async () => ({
    type: 'DOCUMENT_INTEGRITY',
    name: 'W3CVpSignatureIntegrity',
    reason: vpReason(W3CVpCode.SKIPPED, 'Document is not a Verifiable Presentation.'),
    status: 'SKIPPED',
  }),

  test: (document: unknown) => isVpDocument(document),

  verify: async (document: unknown, verifierOptions: VerifierOptions) => {
    const doc = document as VerifiablePresentation;

    // A VP MUST be signed: without a holder proof the presenter cannot prove ownership
    // of the credentials, so an unsigned presentation fails integrity outright.
    if (!doc.proof) {
      return {
        type: 'DOCUMENT_INTEGRITY',
        name: 'W3CVpSignatureIntegrity',
        reason: vpReason(
          W3CVpCode.PRESENTATION_UNSIGNED,
          'Presentation is not signed (no holder "proof"), so ownership cannot be proven.',
        ),
        status: 'INVALID',
      };
    }

    // Holder proof crypto. Pass the proof's own challenge/domain so an authentication proof
    // verifies its crypto (this checks signature validity, NOT freshness — freshness is out
    // of pipeline scope). We only consume `presentationResult` here; the aggregate `verified`
    // and `credentialResults` also encode expiry/revocation, which are NOT integrity concerns.
    const result = await verifyPresentation(doc, {
      challenge: doc.proof?.challenge as string | undefined,
      domain: doc.proof?.domain as string | undefined,
      documentLoader: verifierOptions?.documentLoader,
    });
    const proofValid = result.presentationResult?.verified === true;

    // Embedded credentials — SIGNATURE only. `verifyCredential` verifies the proof crypto
    // and does not assert expiry or revocation, so an expired-but-authentic credential still
    // passes integrity and is caught downstream by `w3cVpCredentialStatus`.
    const signatureResults = await Promise.all(
      getCredentials(doc).map((cred) =>
        verifyCredential(cred, { documentLoader: verifierOptions?.documentLoader }),
      ),
    );
    const badSignatureIndices = signatureResults
      .map((r, i) => (r.verified ? -1 : i))
      .filter((i) => i !== -1);
    const badSignatureIdx = badSignatureIndices[0] ?? -1;
    const credentialsValid = badSignatureIndices.length === 0;

    // Holder binding: signer DID == holder == every credentialSubject.id.
    const bindingError = checkVpHolderBinding(doc);
    const valid = credentialsValid && proofValid && !bindingError;

    if (valid) {
      return {
        type: 'DOCUMENT_INTEGRITY',
        name: 'W3CVpSignatureIntegrity',
        data: {
          holderProofVerified: true,
          holderBound: true,
          credentialResults: signatureResults,
        },
        status: 'VALID',
      };
    }

    // Compose the failure reason as a flat if-chain (no nested ternaries). The ORDER is the
    // order of ROOT CAUSES, and an embedded credential comes first.
    //
    // The holder's proof covers the credentials it wraps, so altering one breaks BOTH its own
    // signature and the envelope's. Checking the envelope first therefore reports every
    // tampered credential as a tampered presentation — true, but the least useful true thing
    // available: it blames the holder for someone else's edit and names nothing the reader can
    // look at. The credential is the thing that changed, so it is what gets reported.
    //
    // A presentation whose proof alone fails (valid credentials rewrapped by someone else)
    // still lands on PRESENTATION_PROOF_INVALID, because no credential signature failed.
    let code: W3CVpCode;
    let message: string;
    let credentialIndices: number[] = [];
    // A proof carrying no `verificationMethod` is MALFORMED, not wrong. It is reported ahead of
    // the crypto result because the crypto result is a foregone conclusion: verification needs
    // a verification method to resolve a key, so a proof without one always fails, and calling
    // that "the signature does not match" tells the reader the opposite of what happened —
    // nothing was ever checked.
    if (bindingError?.code === W3CVpCode.PRESENTATION_PROOF_INCOMPLETE) {
      code = bindingError.code;
      message = bindingError.message;
    } else if (badSignatureIdx !== -1) {
      const detail = signatureResults[badSignatureIdx].error;
      code = W3CVpCode.CREDENTIAL_SIGNATURE_INVALID;
      credentialIndices = badSignatureIndices;
      message = `Embedded credential at index ${badSignatureIdx} has an invalid signature${
        detail ? `: ${detail}` : '.'
      }`;
    } else if (!proofValid) {
      code = W3CVpCode.PRESENTATION_PROOF_INVALID;
      message = result.presentationResult?.error ?? 'Presentation proof is invalid.';
    } else if (bindingError) {
      code = bindingError.code;
      message = bindingError.message;
      credentialIndices = bindingError.credentialIndices ?? [];
    } else {
      // Nothing named itself: credentials verified, proof verified, binding held, yet the
      // fragment is INVALID. Report it as a credential signature with no index, which renders
      // as "a credential in this presentation" rather than naming the wrong one.
      code = W3CVpCode.CREDENTIAL_SIGNATURE_INVALID;
      message = 'An embedded credential signature is invalid.';
    }
    return {
      type: 'DOCUMENT_INTEGRITY',
      name: 'W3CVpSignatureIntegrity',
      data: {
        holderProofVerified: proofValid,
        holderBound: !bindingError,
        credentialResults: signatureResults,
        credentialIndices,
      },
      reason: vpReason(code, message),
      status: 'INVALID',
    };
  },
};

// ---------------------------------------------------------------------------
// DOCUMENT_STATUS — every embedded credential's revocation/suspension status + VP expiry.
// ---------------------------------------------------------------------------
export const w3cVpCredentialStatus: Verifier<VerificationFragment> = {
  skip: async () => ({
    type: 'DOCUMENT_STATUS',
    name: 'W3CVpCredentialStatus',
    reason: vpReason(W3CVpCode.SKIPPED, 'Document is not a Verifiable Presentation.'),
    status: 'SKIPPED',
  }),

  test: (document: unknown) => isVpDocument(document),

  verify: async (document: unknown, verifierOptions: VerifierOptions) => {
    const doc = document as VerifiablePresentation;

    // VP expiry (validUntil / expirationDate). A present-but-unparseable value is rejected —
    // it must not be silently treated as "not expired".
    const validUntil = (doc.validUntil ?? doc.expirationDate) as string | undefined;
    if (validUntil !== undefined && !isValidDate(validUntil)) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        reason: vpReason(
          W3CVpCode.PRESENTATION_DATE_INVALID,
          `Presentation has an unparseable validUntil ("${validUntil}").`,
        ),
        status: 'INVALID',
      };
    }
    if (validUntil && new Date() > new Date(validUntil)) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        data: { expired: true, validUntil },
        reason: vpReason(
          W3CVpCode.PRESENTATION_EXPIRED,
          `Presentation has expired (validUntil ${validUntil}).`,
        ),
        status: 'INVALID',
      };
    }

    // The presentation's own opening bound. Previously only validUntil was checked, so a
    // presentation post-dated to take effect next year verified as fully valid today — the
    // mirror image of expiry, which has always been enforced. An unreadable validFrom is
    // rejected for the same reason an unreadable validUntil is: comparисons against an Invalid
    // Date all read false, so it would otherwise pass as "already in effect".
    const validFrom = (doc.validFrom ?? doc.issuanceDate) as string | undefined;
    if (validFrom !== undefined && !isValidDate(validFrom)) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        reason: vpReason(
          W3CVpCode.PRESENTATION_DATE_INVALID,
          `Presentation has an unparseable validFrom ("${validFrom}").`,
        ),
        status: 'INVALID',
      };
    }
    if (validFrom && new Date() < new Date(validFrom)) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        data: { notYetValid: true, validFrom },
        reason: vpReason(
          W3CVpCode.PRESENTATION_NOT_YET_VALID,
          `Presentation is not yet valid (validFrom ${validFrom}).`,
        ),
        status: 'INVALID',
      };
    }

    const credentials = getCredentials(doc);

    // Embedded credentials' temporal validity (unparseable / expired / not-yet-valid). This is
    // where the integrity fragment used to implicitly catch expiry via `verifyPresentation`;
    // temporal validity is a STATUS concern, so it lives here next to VP expiry and revocation.
    const temporalError = findEmbeddedTemporalError(credentials, new Date());
    if (temporalError) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        data: temporalError.data,
        reason: vpReason(temporalError.code, temporalError.message),
        status: 'INVALID',
      };
    }

    // Embedded credentials' revocation status. Each status entry keeps its owning
    // credential index so a revoked/error result can name it (parity with the temporal
    // checks above); VP expiry stays index-less because it is the envelope, not a credential.
    const statusEntries = credentials.flatMap((cred, i) =>
      toArray(cred.credentialStatus as CredentialStatus | CredentialStatus[] | undefined).map(
        (cs) => ({ cs, credentialIndex: i }),
      ),
    );

    // A status entry we cannot evaluate must NOT be silently dropped (that would report VALID
    // while revocation is unenforced). A MISSING type counts as unevaluable too — otherwise a
    // `credentialStatus: {}` would fall through both filters and skip revocation. Surface as
    // ERROR, naming each offending credential index.
    const unsupported = statusEntries.filter(({ cs }) => !SUPPORTED_STATUS_TYPES.has(cs?.type));
    if (unsupported.length > 0) {
      const detail = unsupported
        .map(
          ({ cs, credentialIndex }) => `index ${credentialIndex} (${cs?.type ?? 'missing type'})`,
        )
        .join(', ');
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        data: {
          credentialIndices: [
            ...new Set(unsupported.map(({ credentialIndex }) => credentialIndex)),
          ],
        },
        reason: vpReason(
          W3CVpCode.CREDENTIAL_STATUS_UNSUPPORTED,
          `Unsupported or missing credentialStatus type at ${detail}.`,
        ),
        status: 'ERROR',
      };
    }

    const supported = statusEntries.filter(({ cs }) => SUPPORTED_STATUS_TYPES.has(cs?.type));
    const statusChecks = await Promise.all(
      supported.map(({ cs }) =>
        verifyCredentialStatus(
          cs as BitstringStatusListCredentialStatus,
          cs.type as CredentialStatusType,
          verifierOptions,
        ),
      ),
    );

    const revokedIdx = statusChecks.findIndex((r) => r.status === true);
    if (revokedIdx !== -1) {
      const revoked = statusChecks[revokedIdx];
      const credentialIndex = supported[revokedIdx].credentialIndex;
      // Every credential whose status is set, not just the first — one trip back to the issuers
      // beats one per credential. The PURPOSE comes from the first: revocation is permanent and
      // suspension is not, so they are different news and must not be blended into one sentence.
      const credentialIndices = [
        ...new Set(
          statusChecks
            .map((r, i) => (r.status === true ? supported[i].credentialIndex : -1))
            .filter((i) => i !== -1),
        ),
      ];
      const suspended = revoked.purpose === 'suspension';
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        data: { revoked: true, credentialIndex, credentialIndices },
        reason: vpReason(
          suspended ? W3CVpCode.CREDENTIAL_SUSPENDED : W3CVpCode.CREDENTIAL_REVOKED,
          `Embedded credential at index ${credentialIndex} has been revoked (status purpose "${revoked.purpose ?? 'revocation'}").`,
        ),
        status: 'INVALID',
      };
    }
    const errorIdx = statusChecks.findIndex((r) => r.error);
    if (errorIdx !== -1) {
      const credentialIndex = supported[errorIdx].credentialIndex;
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        data: { credentialIndex, credentialIndices: [credentialIndex] },
        reason: vpReason(
          W3CVpCode.CREDENTIAL_STATUS_ERROR,
          `Could not verify status of embedded credential at index ${credentialIndex}: ${statusChecks[errorIdx].error}`,
        ),
        status: 'ERROR',
      };
    }
    return {
      type: 'DOCUMENT_STATUS',
      name: 'W3CVpCredentialStatus',
      data: { revoked: false, checked: statusChecks.length },
      status: 'VALID',
    };
  },
};

// ---------------------------------------------------------------------------
// ISSUER_IDENTITY — every embedded credential's issuer DID resolves.
// ---------------------------------------------------------------------------
export const w3cVpIssuerIdentity: Verifier<VerificationFragment> = {
  skip: async () => ({
    type: 'ISSUER_IDENTITY',
    name: 'W3CVpIssuerIdentity',
    reason: vpReason(W3CVpCode.SKIPPED, 'Document is not a Verifiable Presentation.'),
    status: 'SKIPPED',
  }),

  test: (document: unknown) => isVpDocument(document),

  verify: async (document: unknown, verifierOptions: VerifierOptions) => {
    const doc = document as VerifiablePresentation;
    const credentials = getCredentials(doc);
    const issuerIds = credentials.map((c) => readId(c.issuer));

    // Every embedded credential must declare an issuer — a missing issuer cannot be
    // resolved, so it must fail rather than be silently dropped.
    const missingIndices = issuerIds.map((id, i) => (id ? -1 : i)).filter((i) => i !== -1);
    // An EMPTY presentation and one whose credentials lack an issuer were a single branch with
    // a ternary message; they are separate codes because they are separate stories — nothing to
    // verify at all, versus credentials that name nobody who could have issued them.
    if (credentials.length === 0) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CVpIssuerIdentity',
        data: { credentialIndices: [] },
        reason: vpReason(
          W3CVpCode.PRESENTATION_EMPTY,
          'Presentation contains no verifiable credentials.',
        ),
        status: 'INVALID',
      };
    }
    if (missingIndices.length > 0) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CVpIssuerIdentity',
        data: { credentialIndices: missingIndices },
        reason: vpReason(
          W3CVpCode.CREDENTIAL_ISSUER_MISSING,
          `Embedded credential(s) at index ${missingIndices.join(', ')} have no issuer.`,
        ),
        status: 'INVALID',
      };
    }
    const issuers = issuerIds as string[];

    const resolved = await Promise.all(
      issuers.map((did) => checkDidResolve(did, verifierOptions?.documentLoader)),
    );
    const allResolved = resolved.every(Boolean);
    if (allResolved) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CVpIssuerIdentity',
        data: { issuers },
        status: 'VALID',
      };
    }
    // Report both the credential index and the DID: the index locates the offending
    // credential (parity with the other branches), the DID says what failed to resolve.
    const unresolved = issuers
      .map((did, i) => ({ did, credentialIndex: i }))
      .filter(({ credentialIndex }) => !resolved[credentialIndex]);
    return {
      type: 'ISSUER_IDENTITY',
      name: 'W3CVpIssuerIdentity',
      data: {
        issuers,
        unresolved,
        credentialIndices: unresolved.map(({ credentialIndex }) => credentialIndex),
      },
      reason: vpReason(
        W3CVpCode.CREDENTIAL_ISSUER_UNRESOLVABLE,
        `Could not resolve issuer(s): ${unresolved
          .map(({ did, credentialIndex }) => `index ${credentialIndex} (${did})`)
          .join(', ')}.`,
      ),
      status: 'INVALID',
    };
  },
};
