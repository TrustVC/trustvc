import { VerificationFragment, Verifier, VerifierOptions } from '@tradetrust-tt/tt-verify';
import { SignedVerifiableCredential, verifyW3CSignature } from '../../..';

export const w3cSignatureIntegrity: Verifier<VerificationFragment> = {
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

  test: (document: unknown) => {
    const doc = document as SignedVerifiableCredential;
    return doc.proof?.type === 'BbsBlsSignature2020';
  },

  verify: async (document: unknown, verifierOptions: VerifierOptions) => {
    const doc = document as SignedVerifiableCredential;
    const verificationResult = await verifyW3CSignature(doc, verifierOptions);
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
