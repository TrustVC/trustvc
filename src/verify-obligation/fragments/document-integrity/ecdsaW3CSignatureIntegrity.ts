import { VerificationFragment, Verifier } from '@tradetrust-tt/tt-verify';
import { createW3CSignatureIntegrityVerifier } from './w3cModernSignatureIntegrityFactory';

export const ecdsaW3CSignatureIntegrity: Verifier<VerificationFragment> =
  createW3CSignatureIntegrityVerifier({
    cryptosuite: 'ecdsa-sd-2023',
    name: 'EcdsaW3CSignatureIntegrity',
    derivationPaths: [],
  });
