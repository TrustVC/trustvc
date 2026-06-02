import { describe, expect, it } from 'vitest';
import {
  BBS2023_DIDKEY_W3C_VERIFIABLE_DOCUMENT_V2_0,
  BBS2023_W3C_VERIFIABLE_DOCUMENT_V2_0,
  ECDSA_DIDKEY_W3C_VERIFIABLE_DOCUMENT_V2_0,
  ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0,
  W3C_VERIFIABLE_DOCUMENT,
} from '../fixtures/fixtures';
import { deriveW3C } from 'src/w3c';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';

describe('W3C derive', () => {
  // Test case configuration
  const testCases = [
    {
      name: 'ECDSA-SD-2023',
      document: ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0,
    },
    {
      name: 'BBS-2023',
      document: BBS2023_W3C_VERIFIABLE_DOCUMENT_V2_0,
    },
    {
      name: 'ECDSA-SD-2023 (did:key issuer)',
      document: ECDSA_DIDKEY_W3C_VERIFIABLE_DOCUMENT_V2_0,
    },
    {
      name: 'BBS-2023 (did:key issuer)',
      document: BBS2023_DIDKEY_W3C_VERIFIABLE_DOCUMENT_V2_0,
    },
  ];

  const scenarioTests = [
    {
      scenario: 'without custom selective pointers',
      selectivePointers: [],
      expectations: {
        renderMethodDefined: false,
        qrCodeDefined: false,
      },
    },
    {
      scenario: 'with custom selective pointers',
      selectivePointers: ['/renderMethod', '/qrCode'],
      expectations: {
        renderMethodDefined: true,
        qrCodeDefined: true,
      },
    },
  ];

  // BbsBlsSignature2020 is deprecated for derivation. The library should return
  // an explicit error rather than attempt the operation. Mirrors the BBS2020
  // signing-deprecation test in sign.test.ts.
  it('should return a deprecation error when deriving a BbsBlsSignature2020 credential', async () => {
    const result = await deriveW3C(W3C_VERIFIABLE_DOCUMENT as SignedVerifiableCredential, []);
    expect(result.derived).toBeUndefined();
    expect(result.error).toBe(
      'BbsBlsSignature2020 is no longer supported for derivation. Please use the latest cryptosuite versions instead.',
    );
  });

  // All fixtures (did:web and did:key) were signed without credentialStatus, so we
  // assert structural shape + selective disclosure semantics, not status preservation.
  testCases.forEach(({ name, document }) => {
    scenarioTests.forEach(({ scenario, selectivePointers, expectations }) => {
      it(`should derive a W3C v2.0 document using ${name} ${scenario}`, async () => {
        const result = await deriveW3C(document as SignedVerifiableCredential, selectivePointers);

        expect(result.derived).toBeDefined();
        expect(result.derived.proof).toBeDefined();
        expect(result.derived['@context']).toBeDefined();

        if (expectations.renderMethodDefined) {
          expect(result.derived.renderMethod).toBeDefined();
        } else {
          expect(result.derived.renderMethod).toBeUndefined();
        }

        if (expectations.qrCodeDefined) {
          expect(result.derived.qrCode).toBeDefined();
        } else {
          expect(result.derived.qrCode).toBeUndefined();
        }
      });
    });
  });
});
