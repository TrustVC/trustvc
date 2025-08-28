import { VerificationFragment, Verifier, VerifierOptions } from '@tradetrust-tt/tt-verify';
import { isSignedDocument, SignedVerifiableCredential } from '@trustvc/w3c-vc';

const type = 'DOCUMENT_STATUS';
const name = 'W3CEmptyCredentialStatus';

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verify: async (document: unknown, verifierOptions: VerifierOptions) => {
    const doc = document as SignedVerifiableCredential;
    const verificationResult = isSignedDocument(doc);
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
