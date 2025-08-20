import { describe, expect, it } from 'vitest';
import { ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0, W3C_VERIFIABLE_DOCUMENT } from '../fixtures/fixtures';
import { signW3C } from '../..';
import { VerificationType } from '@trustvc/w3c-issuer';
import type { CryptoSuiteName } from '@trustvc/w3c-vc';

interface TestCase {
  name: string;
  proofType: CryptoSuiteName | undefined;
  options: Record<string, unknown> | undefined;
}

describe('W3C sign', () => {
  it('should sign a W3C v1.0 document using BLS12381G2Key2020', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { proof, id, ...documentWithoutProof } = W3C_VERIFIABLE_DOCUMENT;

    const signingResult = await signW3C(
      documentWithoutProof,
      {
        id: 'did:web:trustvc.github.io:did:1#keys-1',
        controller: 'did:web:trustvc.github.io:did:1',
        type: VerificationType.Bls12381G2Key2020,
        publicKeyBase58:
          'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ',
        privateKeyBase58: '4LDU56PUhA9ZEutnR1qCWQnUhtLtpLu2EHSq4h1o7vtF',
      },
      'BbsBlsSignature2020',
    );
    expect(signingResult.signed).toBeDefined();
    expect(signingResult.signed.proof).toBeDefined();
    expect(signingResult.signed.proof.type).toBe('BbsBlsSignature2020');
  });

  const ecdsaSdTestCases: TestCase[] = [
    {
      name: 'Should sign a W3C v2.0 document using ECDSA-SD-2023',
      proofType: undefined,
      options: undefined,
    },
    {
      name: 'Should sign a W3C v2.0 document using ECDSA-SD-2023 with mandatory pointers',
      proofType: 'ecdsa-sd-2023',
      options: {
        mandatoryPointers: ['/credentialStatus'],
      },
    },
  ];

  ecdsaSdTestCases.forEach(({ name, proofType, options }) => {
    it(name, async () => {
      const {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        proof,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        id,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        credentialStatus: { tokenId, ...restCredentialStatus },
        ...documentWithoutProof
      } = ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0;

      const signingResult = await signW3C(
        { ...documentWithoutProof, credentialStatus: restCredentialStatus },
        {
          '@context': 'https://w3id.org/security/multikey/v1',
          id: 'did:web:trustvc.github.io:did:1#multikey-1',
          type: VerificationType.Multikey,
          controller: 'did:web:trustvc.github.io:did:1',
          publicKeyMultibase: 'zDnaemDNwi4G5eTzGfRooFFu5Kns3be6yfyVNtiaMhWkZbwtc',
          secretKeyMultibase: 'z42tmUXTVn3n9BihE6NhdMpvVBTnFTgmb6fw18o5Ud6puhRW',
        },
        proofType,
        options,
      );

      expect(signingResult.signed).toBeDefined();
      expect(signingResult.signed.proof).toBeDefined();
      expect(signingResult.signed.proof.type).toBe('DataIntegrityProof');
    });
  });
});
