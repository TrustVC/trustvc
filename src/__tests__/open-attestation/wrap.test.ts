import { describe, it } from 'vitest';
import {
  wrapOADocument,
  wrapOADocuments,
  wrapOADocumentsV2,
  wrapOADocumentsV3,
  wrapOADocumentV2,
  wrapOADocumentV3,
} from '../..';
import {
  BATCHED_RAW_DOCUMENTS_DID_V2,
  BATCHED_RAW_DOCUMENTS_DID_V3,
  RAW_DOCUMENT_DID_V2,
  RAW_DOCUMENT_DNS_DID_V3,
} from '../fixtures/fixtures';

describe.concurrent('wrap document', () => {
  it('given a valid v2 document, should wrap correctly', async ({ expect }) => {
    const wrapped = await wrapOADocument(RAW_DOCUMENT_DID_V2);
    const { signature } = wrapped;
    expect(signature.merkleRoot.length).toBe(64);
    expect(signature.targetHash.length).toBe(64);
    expect(signature.type).toBe('SHA3MerkleProof');
    expect(signature).not.toHaveProperty('key');
    expect(signature).not.toHaveProperty('signature');
  });

  it('given a valid v3 document, should wrap correctly', async ({ expect }) => {
    const wrapped = await wrapOADocument(RAW_DOCUMENT_DNS_DID_V3);
    const { proof } = wrapped;
    expect(proof.merkleRoot.length).toBe(64);
    expect(proof.privacy.obfuscated).toEqual([]);
    expect(proof.proofPurpose).toBe('assertionMethod');
    expect(proof.proofs).toEqual([]);
    expect(proof.salts.length).toBeGreaterThan(0);
    expect(proof.targetHash.length).toBe(64);
    expect(proof.type).toBe('OpenAttestationMerkleProofSignature2018');
    expect(proof).not.toHaveProperty('key');
    expect(proof).not.toHaveProperty('signature');
  });

  it('given a invalid document, should throw', async ({ expect }) => {
    await expect(wrapOADocument({} as any)).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported document version]`,
    );
  });
});

describe.concurrent('wrap documents', () => {
  it('given an array of valid v2 documents, should wrap correctly', async ({ expect }) => {
    const wrapped = await wrapOADocuments(BATCHED_RAW_DOCUMENTS_DID_V2);
    expect(wrapped.length).toBe(2);
    for (const { signature } of wrapped) {
      expect(signature.merkleRoot.length).toBe(64);
      expect(signature.targetHash.length).toBe(64);
      expect(signature.type).toBe('SHA3MerkleProof');
      expect(signature).not.toHaveProperty('key');
      expect(signature).not.toHaveProperty('signature');
    }
  });

  it('given an array of valid v3 documents, should wrap correctly', async ({ expect }) => {
    const wrapped = await wrapOADocuments(BATCHED_RAW_DOCUMENTS_DID_V3);
    expect(wrapped.length).toBe(2);
    for (const { proof } of wrapped) {
      expect(proof.type).toBe('OpenAttestationMerkleProofSignature2018');
      expect(proof.proofPurpose).toBe('assertionMethod');
      expect(proof.merkleRoot.length).toBe(64);
      expect(proof.targetHash.length).toBe(64);
      expect(proof.salts.length).toBeGreaterThan(0);
      expect(proof.proofs).not.toEqual([]);
      expect(proof.proofs?.[0]?.length).toBeGreaterThan(0);
      expect(proof.privacy.obfuscated).toEqual([]);
      expect(proof).not.toHaveProperty('key');
      expect(proof).not.toHaveProperty('signature');
    }
  });

  it('given an array of documents with different versions, should throw', async ({ expect }) => {
    await expect(
      wrapOADocuments([BATCHED_RAW_DOCUMENTS_DID_V2[0], BATCHED_RAW_DOCUMENTS_DID_V3[0]]),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Unsupported documents version]`);
  });

  it('given an array of invalid documents, should throw', async ({ expect }) => {
    await expect(
      wrapOADocuments([{} as any, {} as any]),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Unsupported documents version]`);
  });
});

describe.concurrent('v3.0 wrap document', () => {
  it('given a valid v3 document, should wrap correctly', async ({ expect }) => {
    const wrapped = await wrapOADocumentV3(RAW_DOCUMENT_DNS_DID_V3);
    const { proof } = wrapped;
    expect(proof.merkleRoot.length).toBe(64);
    expect(proof.privacy.obfuscated).toEqual([]);
    expect(proof.proofPurpose).toBe('assertionMethod');
    expect(proof.proofs).toEqual([]);
    expect(proof.salts.length).toBeGreaterThan(0);
    expect(proof.targetHash.length).toBe(64);
    expect(proof.type).toBe('OpenAttestationMerkleProofSignature2018');
    expect(proof).not.toHaveProperty('key');
    expect(proof).not.toHaveProperty('signature');
  });

  it('given a document with explicit v3 contexts, but does not conform to the v3 document schema, should throw', async ({
    expect,
  }) => {
    await expect(
      wrapOADocumentV3({
        version: 'https://schema.openattestation.com/3.0/schema.json',
        '@context': [
          'https://www.w3.org/2018/credentials/v1',
          'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
        ],
      } as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Invalid document]`);
  });

  it('given a valid v3 document but has an extra field, should throw', async ({ expect }) => {
    await expect(
      wrapOADocumentV3({
        ...RAW_DOCUMENT_DNS_DID_V3,
        UNKNOWN: 'any',
      }),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: "The property UNKNOWN in the input was not defined in the context"]`,
    );
  });
});

describe.concurrent('v3.0 wrap documents', () => {
  it('given an array of valid v3 documents, should wrap correctly', async ({ expect }) => {
    const wrapped = await wrapOADocumentsV3(BATCHED_RAW_DOCUMENTS_DID_V3);
    expect(wrapped.length).toBe(2);
    for (const { proof } of wrapped) {
      expect(proof.type).toBe('OpenAttestationMerkleProofSignature2018');
      expect(proof.proofPurpose).toBe('assertionMethod');
      expect(proof.merkleRoot.length).toBe(64);
      expect(proof.targetHash.length).toBe(64);
      expect(proof.salts.length).toBeGreaterThan(0);
      expect(proof.proofs).not.toEqual([]);
      expect(proof.proofs?.[0]?.length).toBeGreaterThan(0);
      expect(proof.privacy.obfuscated).toEqual([]);
      expect(proof).not.toHaveProperty('key');
      expect(proof).not.toHaveProperty('signature');
    }
  });

  it('given an array of documents with explicit v3 contexts, but one of them does not conform to the v3 document schema, should throw', async ({
    expect,
  }) => {
    await expect(
      wrapOADocumentsV3([
        {
          version: 'https://schema.openattestation.com/3.0/schema.json',
          '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
          ],
        },
        BATCHED_RAW_DOCUMENTS_DID_V3[1],
      ] as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Invalid document]`);
  });

  it('given an array of valid v3 documents but one of them has an extra field, should throw', async ({
    expect,
  }) => {
    await expect(
      wrapOADocumentV3([
        BATCHED_RAW_DOCUMENTS_DID_V3[0],
        {
          ...BATCHED_RAW_DOCUMENTS_DID_V3[1],
          UNKNOWN: 'any',
        },
      ] as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Invalid document]`);
  });
});

describe.concurrent('v2.0 wrap document', () => {
  it('given a valid v2 document, should wrap correctly', async ({ expect }) => {
    const wrapped = await wrapOADocumentV2(RAW_DOCUMENT_DID_V2);
    const { signature } = wrapped;
    expect(signature.merkleRoot.length).toBe(64);
    expect(signature.targetHash.length).toBe(64);
    expect(signature.type).toBe('SHA3MerkleProof');
    expect(signature).not.toHaveProperty('key');
    expect(signature).not.toHaveProperty('signature');
  });

  it('given a valid v2 document but has an extra field, should throw', async ({ expect }) => {
    await expect(
      wrapOADocumentV2({
        ...RAW_DOCUMENT_DID_V2,
        issuers: [
          {
            ...RAW_DOCUMENT_DID_V2.issuers[0],
            identityProof: 'any' as any,
          },
        ],
      } as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Invalid document]`);
  });
});

describe.concurrent('v2.0 wrap documents', () => {
  it('given an array of valid v2 documents, should wrap correctly', async ({ expect }) => {
    const wrapped = await wrapOADocumentsV2(BATCHED_RAW_DOCUMENTS_DID_V2);
    expect(wrapped.length).toBe(2);
    for (const { signature } of wrapped) {
      expect(signature.merkleRoot.length).toBe(64);
      expect(signature.targetHash.length).toBe(64);
      expect(signature.type).toBe('SHA3MerkleProof');
      expect(signature).not.toHaveProperty('key');
      expect(signature).not.toHaveProperty('signature');
    }
  });

  it('given an array of valid v2 documents but one of them has an extra field, should throw', async ({
    expect,
  }) => {
    await expect(
      wrapOADocumentsV2([
        BATCHED_RAW_DOCUMENTS_DID_V2[0],
        {
          ...BATCHED_RAW_DOCUMENTS_DID_V2[1],
          issuers: [
            {
              ...BATCHED_RAW_DOCUMENTS_DID_V2[1].issuers[0],
              identityProof: 'any' as any,
            },
          ],
        },
      ] as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Invalid document]`);
  });
});
