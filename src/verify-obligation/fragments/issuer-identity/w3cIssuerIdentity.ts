import { VerificationFragment, Verifier, VerifierOptions } from '@tradetrust-tt/tt-verify';
import { DocumentLoader } from '@trustvc/w3c-context';
import { isDidKey, parseDidKey, queryDidDocument } from '@trustvc/w3c-issuer';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';

const isInvalidDidKeyError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }
  const { message } = error;
  return (
    message.startsWith('Not a did:key:') ||
    message.startsWith('did:key must use base58btc') ||
    message.startsWith('Unsupported did:key multicodec:') ||
    message.startsWith('Invalid ')
  );
};

const checkDidResolve = async (did: string, documentLoader?: DocumentLoader): Promise<boolean> => {
  try {
    if (isDidKey(did)) {
      parseDidKey(did);
      return true;
    }

    if (documentLoader) {
      const { document } = await documentLoader(did);
      return Boolean(document);
    }

    const { wellKnownDid } = await queryDidDocument({ did });
    return Boolean(wellKnownDid);
  } catch (error) {
    if (isInvalidDidKeyError(error)) {
      return false;
    }
    throw error;
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
    try {
      const resolutionResult = await checkDidResolve(issuerId, verifierOptions?.documentLoader);

      if (resolutionResult) {
        return {
          type: 'ISSUER_IDENTITY',
          name: 'W3CIssuerIdentity',
          data: true,
          status: 'VALID',
        };
      }

      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CIssuerIdentity',
        data: false,
        reason: {
          message: `The DID cannot be resolved.`,
        },
        status: 'INVALID',
      };
    } catch (error) {
      return {
        type: 'ISSUER_IDENTITY',
        name: 'W3CIssuerIdentity',
        status: 'ERROR',
        reason: {
          message: error instanceof Error ? error.message : 'Failed to resolve issuer DID.',
        },
      };
    }
  },
};
