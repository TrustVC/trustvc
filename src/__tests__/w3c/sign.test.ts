import { describe, expect, it } from 'vitest';
import { W3C_RAW_CREDENTIAL_V2_0, W3C_VERIFIABLE_DOCUMENT } from '../fixtures/fixtures';
import { signW3C } from '../..';
import { VerificationType } from '@trustvc/w3c-issuer';
import type { CryptoSuiteName } from '@trustvc/w3c-vc';

// -----------------------------
// Note: Dummy/test cryptographic key pairs for local development and CI/CD.
// Used for signing/verifying credentials only. Not for production. Do not control funds.
// The same secret/public material is reused across did:web and did:key tests;
// only the DID method (id/controller) differs.
// -----------------------------

// Legacy BBS2020 (Bls12381G2Key2020) — base58 raw form
const BLS2020_PUB_B58 =
  'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ';
const BLS2020_PRIV_B58 = '4LDU56PUhA9ZEutnR1qCWQnUhtLtpLu2EHSq4h1o7vtF';

// Modern ECDSA-SD-2023 — P-256 Multikey
const ECDSA_PUB_MB = 'zDnaemDNwi4G5eTzGfRooFFu5Kns3be6yfyVNtiaMhWkZbwtc';
const ECDSA_SEC_MB = 'z42tmUXTVn3n9BihE6NhdMpvVBTnFTgmb6fw18o5Ud6puhRW';

// Modern BBS-2023 — BLS12-381 G2 Multikey
const BLS_PUB_MB =
  'zUC7HnpncVAkTjtL6B8prX6bQM2WA5sJ7rXFeCqyrvPnrzoFBjYsVUTNwzhhPUazja73tWwPeEBWCUgq5qBSrtrXiYhVvBCgZPTCiWANj7TSiZJ6SnyC3pkt94GiuChhAvmRRbt';
const BLS_SEC_MB = 'z488ur1KSFDd3Y1L6pXcPrZRjE18PNBhgzwJvMeoSxKPNysj';

interface TestCase {
  name: string;
  proofType: CryptoSuiteName | undefined;
  options: Record<string, unknown> | undefined;
}

describe('W3C sign', () => {
  it('should sign a W3C v1.0 document using BLS12381G2Key2020', async () => {
    // The legacy v1.1 doc is intentionally kept here — BLS12381G2Key2020 doesn't
    // share a payload shape with the v2.0 raw credential.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { proof, id, ...documentWithoutProof } = W3C_VERIFIABLE_DOCUMENT;

    const signingResult = await signW3C(
      documentWithoutProof,
      {
        id: 'did:web:trustvc.github.io:did:1#keys-1',
        controller: 'did:web:trustvc.github.io:did:1',
        type: VerificationType.Bls12381G2Key2020,
        publicKeyBase58: BLS2020_PUB_B58,
        privateKeyBase58: BLS2020_PRIV_B58,
      },
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
        mandatoryPointers: ['/credentialSubject/billOfLadingName'],
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
        mandatoryPointers: ['/credentialSubject/billOfLadingName'],
      },
    },
  ];

  ecdsaSdTestCases.forEach(({ name, proofType, options }) => {
    it(name, async () => {
      const signingResult = await signW3C(
        structuredClone(W3C_RAW_CREDENTIAL_V2_0),
        {
          '@context': 'https://w3id.org/security/multikey/v1',
          id: 'did:web:trustvc.github.io:did:1#multikey-1',
          type: VerificationType.Multikey,
          controller: 'did:web:trustvc.github.io:did:1',
          publicKeyMultibase: ECDSA_PUB_MB,
          secretKeyMultibase: ECDSA_SEC_MB,
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
      const signingResult = await signW3C(
        structuredClone(W3C_RAW_CREDENTIAL_V2_0),
        {
          '@context': 'https://w3id.org/security/multikey/v1',
          id: 'did:web:trustvc.github.io:did:1#multikey-2',
          type: VerificationType.Multikey,
          controller: 'did:web:trustvc.github.io:did:1',
          publicKeyMultibase: BLS_PUB_MB,
          secretKeyMultibase: BLS_SEC_MB,
        },
        proofType,
        options,
      );

      expect(signingResult.signed).toBeDefined();
      expect(signingResult.signed.proof).toBeDefined();
      expect(signingResult.signed.proof.type).toBe('DataIntegrityProof');
    });
  });

  // did:key variants — same key material, but the issuer is a self-certifying did:key DID.
  // The keypair's id/controller use canonical did:key form: `did:key:<multibase>#<multibase>`.
  it('Should sign a W3C v2.0 document using ECDSA-SD-2023 with a did:key issuer', async () => {
    const did = `did:key:${ECDSA_PUB_MB}`;
    const vmId = `${did}#${ECDSA_PUB_MB}`;

    const signingResult = await signW3C(
      { ...structuredClone(W3C_RAW_CREDENTIAL_V2_0), issuer: did },
      {
        '@context': 'https://w3id.org/security/multikey/v1',
        id: vmId,
        type: VerificationType.Multikey,
        controller: did,
        publicKeyMultibase: ECDSA_PUB_MB,
        secretKeyMultibase: ECDSA_SEC_MB,
      },
      'ecdsa-sd-2023',
    );

    expect(signingResult.signed).toBeDefined();
    expect(signingResult.signed.proof.type).toBe('DataIntegrityProof');
    expect(signingResult.signed.proof.verificationMethod).toBe(vmId);
    expect(signingResult.signed.issuer).toBe(did);
  });

  it('Should sign a W3C v2.0 document using BBS-2023 with a did:key issuer', async () => {
    const did = `did:key:${BLS_PUB_MB}`;
    const vmId = `${did}#${BLS_PUB_MB}`;

    const signingResult = await signW3C(
      { ...structuredClone(W3C_RAW_CREDENTIAL_V2_0), issuer: did },
      {
        '@context': 'https://w3id.org/security/multikey/v1',
        id: vmId,
        type: VerificationType.Multikey,
        controller: did,
        publicKeyMultibase: BLS_PUB_MB,
        secretKeyMultibase: BLS_SEC_MB,
      },
      'bbs-2023',
    );

    expect(signingResult.signed).toBeDefined();
    expect(signingResult.signed.proof.type).toBe('DataIntegrityProof');
    expect(signingResult.signed.proof.verificationMethod).toBe(vmId);
    expect(signingResult.signed.issuer).toBe(did);
  });
});
