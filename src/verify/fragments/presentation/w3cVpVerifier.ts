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
// DOCUMENT_INTEGRITY — the holder proof (crypto only) + every embedded credential's signature.
// NOTE: challenge/domain are NOT enforced here — they are interactive (anti-replay / audience)
// concerns that a stateless verification pipeline cannot check. Only cryptographic validity
// of the holder proof is verified.
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

    // Pass the proof's own challenge/domain so an authentication proof verifies its crypto
    // (this checks signature validity, NOT freshness — freshness is out of pipeline scope).
    const result = await verifyPresentation(doc, {
      challenge: doc.proof?.challenge as string | undefined,
      domain: doc.proof?.domain as string | undefined,
      documentLoader: verifierOptions?.documentLoader,
    });

    const credentialsValid = (result.credentialResults ?? []).every((r) => r.verified);
    const proofValid = result.presentationResult?.verified === true;
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
          credentialResults: result.credentialResults,
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
        credentialResults: result.credentialResults,
      },
      reason: {
        message: !proofValid
          ? (result.presentationResult?.error ?? 'Presentation proof is invalid.')
          : (bindingError ??
            result.credentialResults?.find((r) => !r.verified)?.error ??
            'An embedded credential is invalid.'),
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

    // Embedded credentials' revocation status.
    const credentials = getCredentials(doc);
    const allStatuses = credentials.flatMap((cred) =>
      toArray(cred.credentialStatus as CredentialStatus | CredentialStatus[] | undefined),
    );

    // A status entry whose type we cannot evaluate must NOT be silently dropped (that would
    // report VALID while revocation is unenforced). Surface it as ERROR.
    const unsupported = allStatuses.filter(
      (cs) => cs?.type && !SUPPORTED_STATUS_TYPES.has(cs.type),
    );
    if (unsupported.length > 0) {
      const types = [...new Set(unsupported.map((cs) => cs.type))].join(', ');
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        reason: { message: `Unsupported credentialStatus type(s) cannot be verified: ${types}.` },
        status: 'ERROR',
      };
    }

    const statusChecks = await Promise.all(
      allStatuses
        .filter((cs) => SUPPORTED_STATUS_TYPES.has(cs?.type))
        .map((cs) =>
          verifyCredentialStatus(
            cs as BitstringStatusListCredentialStatus,
            cs.type as CredentialStatusType,
            verifierOptions,
          ),
        ),
    );

    const revoked = statusChecks.find((r) => r.status === true);
    if (revoked) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        data: { revoked: true },
        reason: {
          message: `An embedded credential has been revoked (status purpose "${revoked.purpose ?? 'revocation'}").`,
        },
        status: 'INVALID',
      };
    }
    const statusError = statusChecks.find((r) => r.error);
    if (statusError) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CVpCredentialStatus',
        reason: { message: `Could not verify an embedded credential status: ${statusError.error}` },
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
    const missing = issuerIds.filter((id) => !id).length;
    if (credentials.length === 0 || missing > 0) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CVpIssuerIdentity',
        reason: {
          message:
            credentials.length === 0
              ? 'Presentation contains no verifiable credentials.'
              : `${missing} embedded credential(s) have no issuer.`,
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
