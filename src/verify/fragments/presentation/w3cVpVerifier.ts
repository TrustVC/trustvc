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

// Returns the first credentialSubject (credentialSubject may be an object or an array).
const getFirstSubject = (cred: SignedVerifiableCredential): unknown =>
  Array.isArray(cred?.credentialSubject) ? cred.credentialSubject[0] : cred?.credentialSubject;

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
    const subjectId = readId(getFirstSubject(credentials[i]));
    if (!subjectId) {
      return `credential at index ${i} has no "credentialSubject.id", so it cannot be bound to the holder.`;
    }
    if (subjectId !== owner) {
      return `credentialSubject.id ("${subjectId}") of credential at index ${i} does not match the presentation holder/signer ("${owner}").`;
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
    const statusChecks = await Promise.all(
      credentials.flatMap((cred) => {
        const raw = cred.credentialStatus;
        const statuses = (Array.isArray(raw) ? raw : raw ? [raw] : []) as CredentialStatus[];
        return statuses
          .filter((cs) => ['BitstringStatusListEntry', 'StatusList2021Entry'].includes(cs?.type))
          .map((cs) =>
            verifyCredentialStatus(
              cs as BitstringStatusListCredentialStatus,
              cs.type as CredentialStatusType,
              verifierOptions,
            ),
          );
      }),
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
    const issuers = credentials.map((c) => readId(c.issuer)).filter(Boolean) as string[];

    if (issuers.length === 0) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CVpIssuerIdentity',
        reason: { message: 'No embedded credential has an issuer.' },
        status: 'INVALID',
      };
    }

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
