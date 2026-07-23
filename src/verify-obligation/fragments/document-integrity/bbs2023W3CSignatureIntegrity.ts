import { VerificationFragment, Verifier } from '@tradetrust-tt/tt-verify';
import { createW3CSignatureIntegrityVerifier } from './w3cModernSignatureIntegrityFactory';

export const bbs2023W3CSignatureIntegrity: Verifier<VerificationFragment> =
  createW3CSignatureIntegrityVerifier({
    cryptosuite: 'bbs-2023',
    name: 'Bbs2023W3CSignatureIntegrity',
    derivationPaths: [],
  });
