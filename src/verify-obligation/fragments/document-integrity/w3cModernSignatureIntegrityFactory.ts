import { VerificationFragment, Verifier, VerifierOptions } from '@tradetrust-tt/tt-verify';
import { SignedVerifiableCredential, deriveCredential } from '@trustvc/w3c-vc';
import { verifyW3CSignature } from '../../../w3c/verify';

const PROOF_TYPE = 'DataIntegrityProof' as const;
const DERIVE_CREDENTIAL_ERROR = 'Use deriveCredential() first' as const;

export interface CryptosuiteConfig {
  /** The cryptosuite identifier (e.g., 'bbs-2023', 'ecdsa-sd-2023') */
  cryptosuite: string;
  /** Display name for the verifier (e.g., 'Bbs2023W3CSignatureIntegrity') */
  name: string;
  /** Optional array of JSON paths to derive from the credential */
  derivationPaths?: string[];
}

function isSignedVerifiableCredential(document: unknown): document is SignedVerifiableCredential {
  return typeof document === 'object' && document !== null && 'proof' in document;
}

export function createW3CSignatureIntegrityVerifier(
  config: CryptosuiteConfig,
): Verifier<VerificationFragment> {
  const { cryptosuite, name, derivationPaths = [] } = config;

  return {
    skip: async () => {
      return {
        type: 'DOCUMENT_INTEGRITY',
        name,
        reason: {
          code: 0,
          codeString: 'SKIPPED',
          message: `Document either has no proof or proof type is not '${PROOF_TYPE}' or proof cryptosuite is not '${cryptosuite}'.`,
        },
        status: 'SKIPPED',
      };
    },

    test: (document: unknown) => {
      const doc = document as SignedVerifiableCredential;
      return doc.proof?.type === PROOF_TYPE && doc.proof?.cryptosuite === cryptosuite;
    },

    verify: async (document: unknown, verifierOptions: VerifierOptions) => {
      if (!isSignedVerifiableCredential(document)) {
        return {
          type: 'DOCUMENT_INTEGRITY',
          name,
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
          const derivedCredential = await deriveCredential(document, derivationPaths);
          verificationResult = await verifyW3CSignature(derivedCredential.derived, verifierOptions);
          isDerived = false;
        }

        if (verificationResult.verified) {
          return {
            type: 'DOCUMENT_INTEGRITY',
            name,
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
            name,
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
          name,
          data: false,
          reason: {
            message: error instanceof Error ? error.message : 'Unknown verification error',
          },
          status: 'INVALID',
        };
      }
    },
  };
}
