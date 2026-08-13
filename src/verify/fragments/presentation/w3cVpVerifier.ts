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

// Holder binding: the signer's DID (from the proof's verificationMethod) must equal the
// holder and every credentialSubject.id. Returns an error message, or undefined when bound.
const checkVpHolderBinding = (doc: VerifiablePresentation): string | undefined => {
  const signerDid = getDidFromId(doc.proof?.verificationMethod as string | undefined);
  const holder = readId(doc.holder);
  if (!signerDid) return 'the presentation proof has no "verificationMethod" to bind to.';
  if (holder && holder !== signerDid) {
    return `the presentation was signed by "${signerDid}", which does not match the declared holder "${holder}".`;
  }
  const owner = holder ?? signerDid;
  const credentials = getCredentials(doc);
  for (let i = 0; i < credentials.length; i++) {
    const subjects = getSubjects(credentials[i]);
    if (subjects.length === 0) {
      return `credential at index ${i} has no credentialSubject, so it cannot be bound to the holder.`;
    }
    // EVERY subject must be the holder — a credential with a second subject bound to a
    // different DID must not pass.
    for (const subject of subjects) {
      const subjectId = readId(subject);
      if (!subjectId) {
        return `credential at index ${i} has a subject with no "credentialSubject.id", so it cannot be bound to the holder.`;
      }
      if (subjectId !== owner) {
        return `credentialSubject.id ("${subjectId}") of credential at index ${i} does not match the presentation holder/signer ("${owner}").`;
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
    reason: {
      code: 0,
      codeString: 'SKIPPED',
      message: 'Document is not a Verifiable Presentation.',
    },
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
        reason: {
          message: 'Presentation is not signed (no holder "proof"), so ownership cannot be proven.',
        },
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
    const badSignatureIdx = signatureResults.findIndex((r) => !r.verified);
    const credentialsValid = badSignatureIdx === -1;

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
    return {
      type: 'DOCUMENT_INTEGRITY',
      name: 'W3CVpSignatureIntegrity',
      data: {
        holderProofVerified: proofValid,
        holderBound: !bindingError,
        credentialResults: signatureResults,
      },
      reason: {
        message: !proofValid
          ? (result.presentationResult?.error ?? 'Presentation proof is invalid.')
          : (bindingError ??
            (badSignatureIdx !== -1
              ? `Embedded credential at index ${badSignatureIdx} has an invalid signature${
                  signatureResults[badSignatureIdx].error
                    ? `: ${signatureResults[badSignatureIdx].error}`
                    : '.'
                }`
              : 'An embedded credential signature is invalid.')),
      },
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
    reason: {
      code: 0,
      codeString: 'SKIPPED',
      message: 'Document is not a Verifiable Presentation.',
    },
    status: 'SKIPPED',
  }),

  test: (document: unknown) => isVpDocument(document),

  verify: async (document: unknown, verifierOptions: VerifierOptions) => {
    const doc = document as VerifiablePresentation;

    // VP expiry (validUntil / expirationDate).
    const validUntil = (doc.validUntil ?? doc.expirationDate) as string | undefined;
    if (validUntil && new Date() > new Date(validUntil)) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        data: { expired: true, validUntil },
        reason: { message: `Presentation has expired (validUntil ${validUntil}).` },
        status: 'INVALID',
      };
    }

    const credentials = getCredentials(doc);

    // Embedded credentials' temporal validity (expiry / not-yet-valid). This is where the
    // integrity fragment used to implicitly catch expiry via `verifyPresentation`; temporal
    // validity is a STATUS concern, so it lives here next to VP expiry and revocation.
    const now = new Date();
    for (let i = 0; i < credentials.length; i++) {
      const { from, until } = getCredentialWindow(credentials[i]);
      if (until && now > new Date(until)) {
        return {
          type: 'DOCUMENT_STATUS',
          name: 'W3CVpCredentialStatus',
          data: { expired: true, credentialIndex: i, validUntil: until },
          reason: {
            message: `Embedded credential at index ${i} has expired (validUntil ${until}).`,
          },
          status: 'INVALID',
        };
      }
      if (from && now < new Date(from)) {
        return {
          type: 'DOCUMENT_STATUS',
          name: 'W3CVpCredentialStatus',
          data: { notYetValid: true, credentialIndex: i, validFrom: from },
          reason: {
            message: `Embedded credential at index ${i} is not yet valid (validFrom ${from}).`,
          },
          status: 'INVALID',
        };
      }
    }

    // Embedded credentials' revocation status. Each status entry keeps its owning
    // credential index so a revoked/error result can name it (parity with the temporal
    // checks above); VP expiry stays index-less because it is the envelope, not a credential.
    const statusEntries = credentials.flatMap((cred, i) =>
      toArray(cred.credentialStatus as CredentialStatus | CredentialStatus[] | undefined).map(
        (cs) => ({ cs, credentialIndex: i }),
      ),
    );

    // A status entry whose type we cannot evaluate must NOT be silently dropped (that would
    // report VALID while revocation is unenforced). Surface it as ERROR.
    const unsupported = statusEntries.filter(
      ({ cs }) => cs?.type && !SUPPORTED_STATUS_TYPES.has(cs.type),
    );
    if (unsupported.length > 0) {
      const types = [...new Set(unsupported.map(({ cs }) => cs.type))].join(', ');
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        reason: { message: `Unsupported credentialStatus type(s) cannot be verified: ${types}.` },
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
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        data: { revoked: true, credentialIndex },
        reason: {
          message: `Embedded credential at index ${credentialIndex} has been revoked (status purpose "${revoked.purpose ?? 'revocation'}").`,
        },
        status: 'INVALID',
      };
    }
    const errorIdx = statusChecks.findIndex((r) => r.error);
    if (errorIdx !== -1) {
      const credentialIndex = supported[errorIdx].credentialIndex;
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        reason: {
          message: `Could not verify status of embedded credential at index ${credentialIndex}: ${statusChecks[errorIdx].error}`,
        },
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
    reason: {
      code: 0,
      codeString: 'SKIPPED',
      message: 'Document is not a Verifiable Presentation.',
    },
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
    if (credentials.length === 0 || missingIndices.length > 0) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CVpIssuerIdentity',
        reason: {
          message:
            credentials.length === 0
              ? 'Presentation contains no verifiable credentials.'
              : `Embedded credential(s) at index ${missingIndices.join(', ')} have no issuer.`,
        },
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
    const unresolved = issuers.filter((_, i) => !resolved[i]);
    return {
      type: 'ISSUER_IDENTITY',
      name: 'W3CVpIssuerIdentity',
      data: { issuers, unresolved },
      reason: { message: `Could not resolve issuer(s): ${unresolved.join(', ')}.` },
      status: 'INVALID',
    };
  },
};
