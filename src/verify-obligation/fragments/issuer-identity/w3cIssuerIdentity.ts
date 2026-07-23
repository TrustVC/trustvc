import { VerificationFragment, Verifier, VerifierOptions } from '@tradetrust-tt/tt-verify';
import { DocumentLoader } from '@trustvc/w3c-context';
import { isDidKey, parseDidKey, queryDidDocument } from '@trustvc/w3c-issuer';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';

const checkDidResolve = async (did: string, documentLoader?: DocumentLoader): Promise<boolean> => {
  try {
    if (isDidKey(did)) {
      // did:key is self-certifying: the public key is encoded in the identifier.
      parseDidKey(did);
      return true;
    }

    if (documentLoader) {
      return !!(await documentLoader(did)).document;
    }

    const { wellKnownDid } = await queryDidDocument({ did });

    if (!wellKnownDid) {
      throw new Error(`Failed to resolve DID: ${did}`);
    }

    return true;
  } catch {
    return false;
  }
};

export const w3cIssuerIdentity: Verifier<VerificationFragment> = {
  skip: async () => {
    return {
      type: 'ISSUER_IDENTITY',
      name: 'W3CIssuerIdentity',
      reason: {
        code: 0,
        codeString: 'SKIPPED',
        message: `Document has no issuer field.`,
      },
      status: 'SKIPPED',
    };
  },

  test: (document: unknown) => {
    const doc = document as SignedVerifiableCredential;
    return Boolean(doc.issuer);
  },

  verify: async (document: unknown, verifierOptions: VerifierOptions) => {
    const doc = document as SignedVerifiableCredential;
    const issuerId = typeof doc.issuer === 'string' ? doc.issuer : doc.issuer?.id;
    if (doc.proof?.verificationMethod?.split('#')[0] !== issuerId) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CIssuerIdentity',
        data: false,
        reason: {
          message: `Issuer and verification method do not match.`,
        },
        status: 'INVALID',
      };
    }
    const resolutionResult = await checkDidResolve(issuerId, verifierOptions?.documentLoader);

    if (resolutionResult) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CIssuerIdentity',
        data: true,
        status: 'VALID',
      };
    } else {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CIssuerIdentity',
        data: false,
        reason: {
          message: `The DID cannot be resolved.`,
        },
        status: 'INVALID',
      };
    }
  },
};
