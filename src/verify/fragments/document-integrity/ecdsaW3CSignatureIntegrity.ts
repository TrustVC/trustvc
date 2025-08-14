import { VerificationFragment, Verifier, VerifierOptions } from '@tradetrust-tt/tt-verify';
import { SignedVerifiableCredential, verifyW3CSignature } from '../../..';
import { deriveCredential } from '@trustvc/w3c-vc';

const PROOF_TYPE = 'DataIntegrityProof' as const;
const CRYPTOSUITE = 'ecdsa-sd-2023' as const;
const DERIVE_CREDENTIAL_ERROR = 'Use deriveCredential() first' as const;

function isSignedVerifiableCredential(document: unknown): document is SignedVerifiableCredential {
  return typeof document === 'object' && document !== null && 'proof' in document;
}

export const ecdsaW3CSignatureIntegrity: Verifier<VerificationFragment> = {
  skip: async () => {
    return {
      type: 'DOCUMENT_INTEGRITY',
      name: 'EcdsaW3CSignatureIntegrity',
      reason: {
        code: 0,
        codeString: 'SKIPPED',
        message: `Document either has no proof or proof type is not '${PROOF_TYPE}' or proof cryptosuite is not '${CRYPTOSUITE}'.`,
      },
      status: 'SKIPPED',
    };
  },

  test: (document: unknown) => {
    const doc = document as SignedVerifiableCredential;
    return doc.proof?.type === 'DataIntegrityProof' && doc.proof?.cryptosuite === 'ecdsa-sd-2023';
  },

  verify: async (document: unknown, verifierOptions: VerifierOptions) => {
    if (!isSignedVerifiableCredential(document)) {
      return {
        type: 'DOCUMENT_INTEGRITY',
        name: 'EcdsaW3CSignatureIntegrity',
        data: false,
        reason: {
          message: 'Document is not a valid SignedVerifiableCredential',
        },
        status: 'INVALID',
      };
    }

    try {
      let verificationResult = await verifyW3CSignature(document, verifierOptions);
      let isDerived = true;
      // Handle derivation if needed
      if (
        !verificationResult.verified &&
        verificationResult.error?.includes(DERIVE_CREDENTIAL_ERROR)
      ) {
        const derivedCredential = await deriveCredential(document, []);
        verificationResult = await verifyW3CSignature(derivedCredential.derived, verifierOptions);
        isDerived = false;
      }

      if (verificationResult.verified) {
        return {
          type: 'DOCUMENT_INTEGRITY',
          name: 'EcdsaW3CSignatureIntegrity',
          data: true,
          reason: {
            message: isDerived
              ? 'Document verified successfully'
              : 'Document verified after derivation',
          },
          status: 'VALID',
        };
      } else {
        return {
          type: 'DOCUMENT_INTEGRITY',
          name: 'EcdsaW3CSignatureIntegrity',
          data: false,
          reason: {
            message: verificationResult.error || 'Verification failed',
          },
          status: 'INVALID',
        };
      }
    } catch (error) {
      return {
        type: 'DOCUMENT_INTEGRITY',
        name: 'EcdsaW3CSignatureIntegrity',
        data: false,
        reason: {
          message: error instanceof Error ? error.message : 'Unknown verification error',
        },
        status: 'INVALID',
      };
    }
  },
};
