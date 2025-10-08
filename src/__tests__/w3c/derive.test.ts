import { describe, expect, it } from 'vitest';
import {
  ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0,
  BBS2023_W3C_VERIFIABLE_DOCUMENT_V2_0,
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

  // Note: CredentialStatus is defined since the document has been signed with credentialStatus as mandatory parameter
  testCases.forEach(({ name, document }) => {
    scenarioTests.forEach(({ scenario, selectivePointers, expectations }) => {
      it(`should derive a W3C v2.0 document using ${name} ${scenario}`, async () => {
        const result = await deriveW3C(document as SignedVerifiableCredential, selectivePointers);

        expect(result.derived).toBeDefined();
        expect(result.derived.proof).toBeDefined();
        expect(result.derived['@context']).toBeDefined();
        expect(result.derived.credentialStatus).toBeDefined();

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
