import { it, expect } from 'vitest';
import { verifyDocument } from '../../core/verify';

const ZERO_HASH = '0000000000000000000000000000000000000000000000000000000000000000';
const ZERO_TOKEN_ID = ZERO_HASH;

export function isMintedFixtureReady(fixture: object): boolean {
  return Object.keys(fixture).length > 0;
}

type W3cTransferableRecordMintedOptions = {
  fixture: unknown;
  rpcUrl: string;
  chainId: number;
};

export function w3cTransferableRecordMintedTests({
  fixture,
  rpcUrl,
  chainId,
}: W3cTransferableRecordMintedOptions): void {
  it(`should have chain POL and chainId ${chainId}`, () => {
    const doc = fixture as {
      credentialStatus: { tokenNetwork: { chain: string; chainId: number } };
    };
    expect(doc.credentialStatus.tokenNetwork.chain).toBe('POL');
    expect(doc.credentialStatus.tokenNetwork.chainId).toBe(chainId);
  });

  it('should return SKIPPED for W3CCredentialStatus (not a status-list credential)', async () => {
    const fragments = await verifyDocument(fixture as Parameters<typeof verifyDocument>[0]);
    expect(fragments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'W3CCredentialStatus', status: 'SKIPPED' }),
      ]),
    );
  });

  it(
    'should return VALID for all fragments (signature + minted token + issuer)',
    { timeout: 300000 },
    async () => {
      const fragments = await verifyDocument(fixture as Parameters<typeof verifyDocument>[0], {
        rpcProviderUrl: rpcUrl,
      });
      const integrity = fragments.find(
        (f) => f.type === 'DOCUMENT_INTEGRITY' && f.status === 'VALID',
      );
      const status = fragments.find((f) => f.name === 'TransferableRecords');
      const identity = fragments.find((f) => f.name === 'W3CIssuerIdentity');
      expect(integrity).toBeDefined();
      expect(status?.status).toBe('VALID');
      expect(identity?.status).toBe('VALID');
    },
  );

  it(
    'should return INVALID for TransferableRecords when tokenId is tampered',
    { timeout: 300000 },
    async () => {
      const doc = fixture as {
        credentialStatus: Record<string, unknown>;
      };
      const tampered = {
        ...(fixture as Record<string, unknown>),
        credentialStatus: {
          ...doc.credentialStatus,
          tokenId: ZERO_TOKEN_ID,
        },
      };
      const fragments = await verifyDocument(
        tampered as unknown as Parameters<typeof verifyDocument>[0],
        { rpcProviderUrl: rpcUrl },
      );
      expect(fragments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'TransferableRecords', status: 'INVALID' }),
        ]),
      );
    },
  );
}

type OaTokenRegistryMintedOptions = {
  fixture: unknown;
  rpcUrl: string;
  /** When set, asserts OA `network.chainId` decodes to this value (e.g. Amoy `80002`). */
  expectedNetworkChainId?: string;
  /** When true, includes DOCUMENT_STATUS invalidation when signature hashes are tampered. */
  includeSignatureTamperTest?: boolean;
};

export function oaTokenRegistryMintedTests({
  fixture,
  rpcUrl,
  expectedNetworkChainId,
  includeSignatureTamperTest = false,
}: OaTokenRegistryMintedOptions): void {
  if (expectedNetworkChainId) {
    it(`network.chainId should decode to ${expectedNetworkChainId}`, () => {
      const doc = fixture as { data?: { network?: { chainId?: string } } };
      const chainId = (doc.data?.network?.chainId ?? '').split(':').pop();
      expect(chainId).toBe(expectedNetworkChainId);
    });
  }

  it('should return VALID for OpenAttestationHash (pure hash check)', async () => {
    const fragments = await verifyDocument(fixture as Parameters<typeof verifyDocument>[0], {
      rpcProviderUrl: rpcUrl,
    });
    expect(fragments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'OpenAttestationHash', status: 'VALID' }),
      ]),
    );
  });

  it('should return INVALID for OpenAttestationHash when document data is tampered', async () => {
    const doc = fixture as { data: Record<string, unknown> };
    const tampered = {
      ...(fixture as Record<string, unknown>),
      data: { ...doc.data, TAMPERED: true },
    };
    const fragments = await verifyDocument(
      tampered as unknown as Parameters<typeof verifyDocument>[0],
      { rpcProviderUrl: rpcUrl },
    );
    expect(fragments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'OpenAttestationHash', status: 'INVALID' }),
      ]),
    );
  });

  it('OpenAttestationEthereumTokenRegistryStatus verifier should be selected (not skipped)', async () => {
    const fragments = await verifyDocument(fixture as Parameters<typeof verifyDocument>[0], {
      rpcProviderUrl: rpcUrl,
    });
    const statusFragment = fragments.find(
      (f) => f.name === 'OpenAttestationEthereumTokenRegistryStatus',
    );
    expect(statusFragment?.status).not.toBe('SKIPPED');
  });

  it(
    'should return VALID for DOCUMENT_INTEGRITY and DOCUMENT_STATUS',
    { timeout: 300000 },
    async () => {
      const fragments = await verifyDocument(fixture as Parameters<typeof verifyDocument>[0], {
        rpcProviderUrl: rpcUrl,
      });
      expect(fragments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'OpenAttestationHash', status: 'VALID' }),
          expect.objectContaining({
            name: 'OpenAttestationEthereumTokenRegistryStatus',
            status: 'VALID',
          }),
        ]),
      );
    },
  );

  if (includeSignatureTamperTest) {
    it(
      'should return INVALID for DOCUMENT_STATUS when tokenId is tampered',
      { timeout: 300000 },
      async () => {
        const doc = fixture as { signature: Record<string, unknown> };
        const tampered = {
          ...(fixture as Record<string, unknown>),
          signature: {
            ...doc.signature,
            targetHash: ZERO_HASH,
            merkleRoot: ZERO_HASH,
          },
        };
        const fragments = await verifyDocument(tampered as Parameters<typeof verifyDocument>[0], {
          rpcProviderUrl: rpcUrl,
        });
        expect(fragments).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'OpenAttestationEthereumTokenRegistryStatus',
              status: 'INVALID',
            }),
          ]),
        );
      },
    );
  }
}

export function expectTransferableRecordError(
  fragments: Awaited<ReturnType<typeof verifyDocument>>,
): void {
  expect(fragments).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: 'TransferableRecords',
        status: 'ERROR',
        reason: expect.objectContaining({ codeString: 'UNRECOGNIZED_DOCUMENT' }),
      }),
    ]),
  );
}
