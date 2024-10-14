import { Verifier } from '@govtechsg/oa-verify';
import { verifyCredentialStatus } from '@trustvc/w3c-vc';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const w3cCredentialStatus: Verifier<any> = {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test: (document: any) => document.credentialStatus?.type === 'StatusList2021Entry',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verify: async (document: any) => {
    const verificationResult = await verifyCredentialStatus(document.credentialStatus);
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
