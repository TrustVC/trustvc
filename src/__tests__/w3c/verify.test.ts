import { describe, it } from 'vitest';
import { verifyW3CSignature } from '../..';
import {
  BBS2023_DIDKEY_W3C_DERIVED_DOCUMENT_V2_0,
  BBS2023_DIDKEY_W3C_VERIFIABLE_DOCUMENT_V2_0,
  BBS2023_W3C_DERIVED_DOCUMENT_V2_0,
  BBS2023_W3C_VERIFIABLE_DOCUMENT_V2_0,
  ECDSA_DIDKEY_W3C_DERIVED_DOCUMENT_V2_0,
  ECDSA_DIDKEY_W3C_VERIFIABLE_DOCUMENT_V2_0,
  ECDSA_W3C_DERIVED_DOCUMENT_V1_1,
  ECDSA_W3C_DERIVED_DOCUMENT_V2_0,
  ECDSA_W3C_VERIFIABLE_DOCUMENT_V1_1,
  ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0,
  W3C_TRANSFERABLE_RECORD,
  W3C_VERIFIABLE_DOCUMENT,
} from '../fixtures/fixtures';

// Fixtures grouped by what verifyW3CSignature should do with them.
//
//  - "verifiable"  → directly verifiable (legacy BBS2020 base, or modern derived)
//  - "non-derived" → ecdsa-sd-2023 / bbs-2023 base credentials that must be derived first
//
// Each entry exercises a distinct combination of:
//   - W3C VC data model version (v1.1 / v2.0)
//   - cryptosuite (BbsBlsSignature2020 / ecdsa-sd-2023 / bbs-2023)
//   - DID method (did:web / did:key)
//   - state (base / derived)

const verifiableCases = [
  { name: 'legacy BBS2020 v1.1 (did:web)', doc: W3C_VERIFIABLE_DOCUMENT },
  { name: 'legacy BBS2020 v1.1 transferable record (did:web)', doc: W3C_TRANSFERABLE_RECORD },
  { name: 'ECDSA-SD-2023 v1.1 derived (did:web)', doc: ECDSA_W3C_DERIVED_DOCUMENT_V1_1 },
  { name: 'ECDSA-SD-2023 v2.0 derived (did:web)', doc: ECDSA_W3C_DERIVED_DOCUMENT_V2_0 },
  { name: 'BBS-2023 v2.0 derived (did:web)', doc: BBS2023_W3C_DERIVED_DOCUMENT_V2_0 },
  { name: 'ECDSA-SD-2023 v2.0 derived (did:key)', doc: ECDSA_DIDKEY_W3C_DERIVED_DOCUMENT_V2_0 },
  { name: 'BBS-2023 v2.0 derived (did:key)', doc: BBS2023_DIDKEY_W3C_DERIVED_DOCUMENT_V2_0 },
];

const nonDerivedCases = [
  {
    name: 'ECDSA-SD-2023 v1.1 base (did:web)',
    doc: ECDSA_W3C_VERIFIABLE_DOCUMENT_V1_1,
    suite: 'ecdsa-sd-2023',
  },
  {
    name: 'ECDSA-SD-2023 v2.0 base (did:web)',
    doc: ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0,
    suite: 'ecdsa-sd-2023',
  },
  {
    name: 'BBS-2023 v2.0 base (did:web)',
    doc: BBS2023_W3C_VERIFIABLE_DOCUMENT_V2_0,
    suite: 'bbs-2023',
  },
  {
    name: 'ECDSA-SD-2023 v2.0 base (did:key)',
    doc: ECDSA_DIDKEY_W3C_VERIFIABLE_DOCUMENT_V2_0,
    suite: 'ecdsa-sd-2023',
  },
  {
    name: 'BBS-2023 v2.0 base (did:key)',
    doc: BBS2023_DIDKEY_W3C_VERIFIABLE_DOCUMENT_V2_0,
    suite: 'bbs-2023',
  },
];

describe.concurrent('W3C verify', () => {
  describe.concurrent('valid credentials verify', () => {
    verifiableCases.forEach(({ name, doc }) => {
      it(`verifies a valid credential: ${name}`, async ({ expect }) => {
        const result = await verifyW3CSignature(doc);
        if (!result.verified) {
          console.error(`unexpected verify failure for ${name}:`, result.error);
        }
        expect(result.verified).toBe(true);
      });
    });
  });

  describe.concurrent('tampered credentials are rejected', () => {
    it('rejects a tampered legacy BBS2020 document (did:web)', async ({ expect }) => {
      const tampered = { ...W3C_VERIFIABLE_DOCUMENT, expirationDate: '2029-12-03T12:19:53Z' };
      const result = await verifyW3CSignature(tampered);
      expect(result.verified).toBe(false);
    });

    it('rejects a tampered ECDSA-SD-2023 derived credential (did:key)', async ({ expect }) => {
      const tampered = {
        ...ECDSA_DIDKEY_W3C_DERIVED_DOCUMENT_V2_0,
        validFrom: '2025-01-01T00:00:00Z',
      };
      const result = await verifyW3CSignature(tampered);
      expect(result.verified).toBe(false);
    });

    it('rejects a tampered BBS-2023 derived credential (did:key)', async ({ expect }) => {
      const tampered = {
        ...BBS2023_DIDKEY_W3C_DERIVED_DOCUMENT_V2_0,
        validFrom: '2025-01-01T00:00:00Z',
      };
      const result = await verifyW3CSignature(tampered);
      expect(result.verified).toBe(false);
    });
  });

  // ECDSA-SD-2023 and BBS-2023 are selective-disclosure schemes: a "base" credential
  // (the direct output of signW3C) is NOT verifiable on its own — it must be passed
  // through deriveW3C first to produce a derived credential, which is then verifiable.
  describe.concurrent('non-derived base credentials are rejected with a clear error', () => {
    nonDerivedCases.forEach(({ name, doc, suite }) => {
      it(`rejects a non-derived base credential: ${name}`, async ({ expect }) => {
        const result = await verifyW3CSignature(doc);
        expect(result.verified).toBe(false);
        expect(result.error).toBe(
          `${suite} base credentials must be derived before verification. Use deriveCredential() first.`,
        );
      });
    });
  });
});
