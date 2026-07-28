import { describe, it, expect, vi } from 'vitest';
import { OBLIGATION_RECORDS_NAME } from '../../verify/fragments';

const verifyDocumentMock = vi.fn();

vi.mock('../../core/verify', () => ({
  verifyDocument: (...args: unknown[]) => verifyDocumentMock(...args),
}));

import {
  verifyObligationDocument,
  getObligationDocumentStatus,
} from '../../obligation-registry-functions/verify';

const OBLIGATION_REGISTRY = '0xObligationRegistryAddress';

describe('verifyObligationDocument', () => {
  it('runs the unified verify pipeline and reports valid when every fragment is VALID', async () => {
    const fragments = [
      { name: 'W3CSignatureIntegrity', type: 'DOCUMENT_INTEGRITY', status: 'VALID' },
      {
        name: OBLIGATION_RECORDS_NAME,
        type: 'DOCUMENT_STATUS',
        status: 'VALID',
        data: { obligationRegistry: OBLIGATION_REGISTRY, status: 1, terminationReason: 0 },
      },
      { name: 'W3CIssuerIdentity', type: 'ISSUER_IDENTITY', status: 'VALID' },
    ];
    verifyDocumentMock.mockResolvedValue(fragments);

    const document = { credentialStatus: { obligationRegistry: OBLIGATION_REGISTRY } };
    const result = await verifyObligationDocument(document, {
      rpcProviderUrl: 'http://localhost:8545',
    });

    expect(verifyDocumentMock).toHaveBeenCalledWith(document, {
      rpcProviderUrl: 'http://localhost:8545',
    });
    expect(result.valid).toBe(true);
    expect(result.fragments).toBe(fragments);
  });

  it('reports invalid when any fragment is not VALID', async () => {
    const fragments = [
      { name: 'W3CSignatureIntegrity', type: 'DOCUMENT_INTEGRITY', status: 'VALID' },
      { name: OBLIGATION_RECORDS_NAME, type: 'DOCUMENT_STATUS', status: 'INVALID', data: {} },
    ];
    verifyDocumentMock.mockResolvedValue(fragments);

    const result = await verifyObligationDocument({});

    expect(result.valid).toBe(false);
  });
});

describe('getObligationDocumentStatus', () => {
  it('extracts status and terminationReason from a VALID ObligationRecords fragment', () => {
    const fragments = [
      {
        name: OBLIGATION_RECORDS_NAME,
        type: 'DOCUMENT_STATUS',
        status: 'VALID',
        data: { obligationRegistry: OBLIGATION_REGISTRY, status: 1, terminationReason: 0 },
      },
    ];

    expect(getObligationDocumentStatus(fragments as never)).toEqual({
      obligationRegistry: OBLIGATION_REGISTRY,
      status: 1,
      terminationReason: 0,
    });
  });

  it('returns null when the ObligationRecords fragment is not VALID', () => {
    const fragments = [
      { name: OBLIGATION_RECORDS_NAME, type: 'DOCUMENT_STATUS', status: 'INVALID', data: {} },
    ];

    expect(getObligationDocumentStatus(fragments as never)).toBeNull();
  });

  it('returns null when ObligationRecords was SKIPPED (e.g. classic ETR document)', () => {
    const fragments = [
      {
        name: OBLIGATION_RECORDS_NAME,
        type: 'DOCUMENT_STATUS',
        status: 'SKIPPED',
        reason: { code: 0, codeString: 'SKIPPED', message: 'skipped' },
      },
    ];

    expect(getObligationDocumentStatus(fragments as never)).toBeNull();
  });
});
