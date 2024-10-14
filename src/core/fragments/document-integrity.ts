import { Verifier } from '@govtechsg/oa-verify';
import { verifyW3CSignature } from '../..';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const w3cSignatureIntegrity: Verifier<any> = {
  skip: async () => {
    return {
      type: 'DOCUMENT_INTEGRITY',
      name: 'W3CSignatureIntegrity',
      reason: {
        code: 0,
        codeString: 'SKIPPED',
        message: `Document either has no proof or proof.type is not 'BbsBlsSignature2020'.`,
      },
      status: 'SKIPPED',
    };
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test: (document: any) => document.proof?.type === 'BbsBlsSignature2020',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  verify: async (document: any) => {
    const verificationResult = await verifyW3CSignature(document);
    if (verificationResult.verified) {
      return {
        type: 'DOCUMENT_INTEGRITY',
        name: 'W3CSignatureIntegrity',
        data: true,
        status: 'VALID',
      };
    } else {
      return {
        type: 'DOCUMENT_INTEGRITY',
        name: 'W3CSignatureIntegrity',
        data: false,
        reason: {
          message: verificationResult.error,
        },
        status: 'INVALID',
      };
    }
  },
};
