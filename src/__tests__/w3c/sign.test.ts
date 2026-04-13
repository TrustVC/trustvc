import { describe, expect, it } from 'vitest';
import {
  ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0,
  BBS2023_W3C_VERIFIABLE_DOCUMENT_V2_0,
  W3C_VERIFIABLE_DOCUMENT,
} from '../fixtures/fixtures';
import { TEST_BBS2020_KEY_PAIR } from '../fixtures/keys';
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
      TEST_BBS2020_KEY_PAIR,
      'BbsBlsSignature2020',
    );
    expect(signingResult).toEqual({
      error:
        'BbsBlsSignature2020 is no longer supported. Please use the latest cryptosuite versions instead.',
    });
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

  const bbs2023TestCases: TestCase[] = [
    {
      name: 'Should sign a W3C v2.0 document using BBS-2023',
      proofType: 'bbs-2023',
      options: undefined,
    },
    {
      name: 'Should sign a W3C v2.0 document using BBS-2023 with mandatory pointers',
      proofType: 'bbs-2023',
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

      // Note: Dummy/test cryptographic ECDSA key pairs for local development and CI/CD.
      // Used for signing/verifying credentials only. Not for production. Do not control funds.
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

  bbs2023TestCases.forEach(({ name, proofType, options }) => {
    it(name, async () => {
      const {
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        proof,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        id,
        //eslint-disable-next-line @typescript-eslint/no-unused-vars
        credentialStatus: { tokenId, ...restCredentialStatus },
        ...documentWithoutProof
      } = BBS2023_W3C_VERIFIABLE_DOCUMENT_V2_0;

      // Note: Dummy/test cryptographic BBS 2023 key pairs for local development and CI/CD.
      // Used for signing/verifying credentials only. Not for production. Do not control funds.
      const signingResult = await signW3C(
        { ...documentWithoutProof, credentialStatus: restCredentialStatus },
        {
          '@context': 'https://w3id.org/security/multikey/v1',
          id: 'did:web:trustvc.github.io:did:1#multikey-2',
          type: VerificationType.Multikey,
          controller: 'did:web:trustvc.github.io:did:1',
          publicKeyMultibase:
            'zUC7HnpncVAkTjtL6B8prX6bQM2WA5sJ7rXFeCqyrvPnrzoFBjYsVUTNwzhhPUazja73tWwPeEBWCUgq5qBSrtrXiYhVvBCgZPTCiWANj7TSiZJ6SnyC3pkt94GiuChhAvmRRbt',
          secretKeyMultibase: 'z488ur1KSFDd3Y1L6pXcPrZRjE18PNBhgzwJvMeoSxKPNysj',
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
