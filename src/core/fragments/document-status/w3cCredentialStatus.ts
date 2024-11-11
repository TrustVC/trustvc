import { VerificationFragment, Verifier } from '@tradetrust-tt/tt-verify';
import { verifyCredentialStatus } from '@trustvc/w3c-vc';
import { SignedVerifiableCredential } from '../../..';

export const w3cCredentialStatus: Verifier<VerificationFragment> = {
  skip: async () => {
    return {
      type: 'DOCUMENT_STATUS',
      name: 'W3CCredentialStatus',
      reason: {
        code: 0,
        codeString: 'SKIPPED',
        message: `Document does not have a valid credentialStatus or type.`,
      },
      status: 'SKIPPED',
    };
  },

  test: (document: unknown) => {
    const doc = document as SignedVerifiableCredential;
    return doc.credentialStatus?.type === 'StatusList2021Entry';
  },

  verify: async (document: unknown) => {
    const doc = document as SignedVerifiableCredential;
    const verificationResult = await verifyCredentialStatus(doc.credentialStatus);
    if (verificationResult.error) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CCredentialStatus',
        reason: {
          message: verificationResult.error,
        },
        status: 'ERROR',
      };
    } else if (verificationResult.status === true) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CCredentialStatus',
        data: false,
        status: 'INVALID',
      };
    } else {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CCredentialStatus',
        data: true,
        status: 'VALID',
      };
    }
  },
};
