import { VerificationFragment, Verifier } from '@tradetrust-tt/tt-verify';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';

const type = 'DOCUMENT_STATUS';
const name = 'W3CEmptyCredentialStatus';

function isSignedVerifiableCredential(document: unknown): document is SignedVerifiableCredential {
  return typeof document === 'object' && document !== null && 'proof' in document;
}

export const w3cEmptyCredentialStatus: Verifier<VerificationFragment> = {
  skip: async () => {
    return {
      type,
      name,
      reason: {
        code: 0,
        codeString: 'SKIPPED',
        message: `Document contains a credentialStatus.`,
      },
      status: 'SKIPPED',
    };
  },

  test: (document: unknown) => {
    const doc = document as SignedVerifiableCredential;
    return (
      !!doc.credentialStatus === false ||
      (Array.isArray(doc.credentialStatus) && doc.credentialStatus.length === 0) ||
      Object.keys(doc.credentialStatus)?.length === 0
    );
  },

  verify: async (document: unknown) => {
    const doc = document as SignedVerifiableCredential;
    const verificationResult = isSignedVerifiableCredential(doc);
    if (verificationResult) {
      return {
        type,
        name,
        data: true,
        status: 'VALID',
      };
    } else {
      return {
        type,
        name,
        data: false,
        reason: {
          message: 'Document is not a valid SignedVerifiableCredential',
        },
        status: 'INVALID',
      };
    }
  },
};
