import { describe, expect, it, vi, beforeEach } from 'vitest';
import { credentialStatusObligationRecordVerifier } from '../../verify-obligation/fragments/document-status/obligationRecords/obligationRecordVerifier';
import { ObligationRecordsStatusCode } from '../../verify-obligation/fragments/document-status/obligationRecords/obligationRecordVerifier.types';
import * as obligationUtils from '../../verify-obligation/fragments/document-status/obligationRecords/utils';

const provider = {} as never;
const obligationRegistry = '0x71D28767662cB233F887aD2Bb65d048d760bA694';

const baseDocument = {
  '@context': ['https://www.w3.org/ns/credentials/v2'],
  type: ['VerifiableCredential'],
  issuer: 'did:web:trustvc.github.io:did:1',
  credentialSubject: { id: 'did:example:123' },
  proof: { type: 'DataIntegrityProof' },
  credentialStatus: {
    type: 'TransferableRecords',
    tokenNetwork: { chain: 'amoy', chainId: 80002 },
    obligationRegistry,
    tokenId: '1234',
  },
} as any;

describe('credentialStatusObligationRecordVerifier', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('tests true for obligation documents and false for classic ETR documents', () => {
    expect(credentialStatusObligationRecordVerifier.test(baseDocument, { provider })).toBe(true);
    expect(
      credentialStatusObligationRecordVerifier.test(
        {
          ...baseDocument,
          credentialStatus: {
            ...baseDocument.credentialStatus,
            obligationRegistry: undefined,
            tokenRegistry: '0x6c2a002A5833a100f38458c50F11E71Aa1A342c6',
          },
        } as any,
        { provider },
      ),
    ).toBe(false);
  });

  it('rejects empty credentialStatus arrays in test and verify', async () => {
    const emptyStatusDocument = { ...baseDocument, credentialStatus: [] } as any;

    expect(credentialStatusObligationRecordVerifier.test(emptyStatusDocument, { provider })).toBe(
      false,
    );

    await expect(
      credentialStatusObligationRecordVerifier.verify(emptyStatusDocument, { provider }),
    ).resolves.toEqual({
      name: 'ObligationRecords',
      type: 'DOCUMENT_STATUS',
      status: 'ERROR',
      reason: {
        code: ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
        codeString: 'UNRECOGNIZED_DOCUMENT',
        message: "Document's credentialStatus is empty",
      },
    });
  });

  it('returns VALID with enrichment for a minted obligation document', async () => {
    vi.spyOn(obligationUtils, 'isTokenMintedOnObligationRegistry').mockResolvedValue({
      minted: true,
      address: obligationRegistry,
    });
    vi.spyOn(obligationUtils, 'getObligationEscrowEnrichment').mockResolvedValue({
      status: 1,
      terminationReason: 0,
    });

    await expect(
      credentialStatusObligationRecordVerifier.verify(baseDocument, { provider }),
    ).resolves.toEqual({
      name: 'ObligationRecords',
      type: 'DOCUMENT_STATUS',
      status: 'VALID',
      data: {
        obligationRegistry,
        status: 1,
        terminationReason: 0,
      },
    });
  });

  it('returns INVALID when token is not minted', async () => {
    vi.spyOn(obligationUtils, 'isTokenMintedOnObligationRegistry').mockResolvedValue({
      minted: false,
      address: obligationRegistry,
      reason: {
        code: ObligationRecordsStatusCode.DOCUMENT_NOT_MINTED,
        codeString: 'DOCUMENT_NOT_MINTED',
        message: 'Document has not been issued under obligation registry',
      },
    });

    await expect(
      credentialStatusObligationRecordVerifier.verify(baseDocument, { provider }),
    ).resolves.toEqual({
      name: 'ObligationRecords',
      type: 'DOCUMENT_STATUS',
      status: 'INVALID',
      data: {
        obligationRegistry,
      },
      reason: {
        code: ObligationRecordsStatusCode.DOCUMENT_NOT_MINTED,
        codeString: 'DOCUMENT_NOT_MINTED',
        message: 'Document has not been issued under obligation registry',
      },
    });
  });

  it('returns ERROR when both tokenRegistry and obligationRegistry are present', async () => {
    await expect(
      credentialStatusObligationRecordVerifier.verify(
        {
          ...baseDocument,
          credentialStatus: {
            ...baseDocument.credentialStatus,
            tokenRegistry: '0x6c2a002A5833a100f38458c50F11E71Aa1A342c6',
          },
        } as any,
        { provider },
      ),
    ).resolves.toEqual({
      name: 'ObligationRecords',
      type: 'DOCUMENT_STATUS',
      status: 'ERROR',
      reason: {
        code: ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
        codeString: 'UNRECOGNIZED_DOCUMENT',
        message:
          "Document's credentialStatus must not include both tokenRegistry and obligationRegistry",
      },
    });
  });

  it('returns ERROR when tokenId is missing', async () => {
    await expect(
      credentialStatusObligationRecordVerifier.verify(
        {
          ...baseDocument,
          credentialStatus: {
            ...baseDocument.credentialStatus,
            tokenId: undefined,
          },
        } as any,
        { provider },
      ),
    ).resolves.toEqual({
      name: 'ObligationRecords',
      type: 'DOCUMENT_STATUS',
      status: 'ERROR',
      reason: {
        code: ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
        codeString: 'UNRECOGNIZED_DOCUMENT',
        message: "Document's credentialStatus does not have tokenId",
      },
    });
  });
});
