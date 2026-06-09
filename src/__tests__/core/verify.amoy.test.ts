import { describe, it, expect } from 'vitest';
import { verifyDocument } from '../../core/verify';
import { CHAIN_ID, SUPPORTED_CHAINS } from '../../utils/supportedChains';

import amoyOaTokenRegistryMinted from '../fixtures/amoy-oa-token-registry-minted.json';
import amoyW3cTransferableRecordMinted from '../fixtures/amoy-w3c-transferable-record-minted.json';

const AMOY_RPC_URL = process.env.AMOY_RPC || 'https://rpc-amoy.polygon.technology/';

const OA_AMOY_MINTED_READY = Object.keys(amoyOaTokenRegistryMinted).length > 0;
const W3C_AMOY_TR_MINTED_READY = Object.keys(amoyW3cTransferableRecordMinted).length > 0;

describe('Polygon Amoy (testnet) network support', () => {
  // ─── Chain constants ────────────────────────────────────────────────────────

  describe('CHAIN_ID and SUPPORTED_CHAINS', () => {
    it('CHAIN_ID.amoy should equal chain ID 80002', () => {
      expect(CHAIN_ID.amoy).toBe('80002');
    });

    it('SUPPORTED_CHAINS[CHAIN_ID.amoy] should have currency POL', () => {
      expect(SUPPORTED_CHAINS[CHAIN_ID.amoy].currency).toBe('POL');
    });

    it('SUPPORTED_CHAINS[CHAIN_ID.amoy] should have name amoy', () => {
      expect(SUPPORTED_CHAINS[CHAIN_ID.amoy].name).toBe('amoy');
    });
  });

  // ─── OA Token Registry — minted on Amoy testnet ───────────────────────────

  describe.skipIf(!OA_AMOY_MINTED_READY)(
    'amoy-oa-token-registry-minted — live Amoy testnet',
    () => {
      it(
        'should return VALID for DOCUMENT_INTEGRITY and DOCUMENT_STATUS',
        { timeout: 300000 },
        async () => {
          const fragments = await verifyDocument(amoyOaTokenRegistryMinted as any, {
            rpcProviderUrl: AMOY_RPC_URL,
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

      it(
        'should return INVALID for DOCUMENT_STATUS when tokenId is tampered',
        { timeout: 300000 },
        async () => {
          const doc = amoyOaTokenRegistryMinted as any;
          const tampered: any = {
            ...doc,
            signature: {
              ...doc.signature,
              targetHash: '0000000000000000000000000000000000000000000000000000000000000000',
              merkleRoot: '0000000000000000000000000000000000000000000000000000000000000000',
            },
          };
          const fragments = await verifyDocument(tampered, { rpcProviderUrl: AMOY_RPC_URL });
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
    },
  );

  // OA verifiers run concurrently — even a hash-only test triggers the token registry verifier
  // which needs a provider. Pass rpcProviderUrl to avoid falling back to the Infura URL that
  // has no API key set in the test environment.
  describe.skipIf(!OA_AMOY_MINTED_READY)(
    'amoy-oa-token-registry-minted — structural (hash + verifier selection)',
    () => {
      it('should return VALID for OpenAttestationHash (pure hash check)', async () => {
        const fragments = await verifyDocument(amoyOaTokenRegistryMinted as any, {
          rpcProviderUrl: AMOY_RPC_URL,
        });
        expect(fragments).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'OpenAttestationHash', status: 'VALID' }),
          ]),
        );
      });

      it('should return INVALID for OpenAttestationHash when document data is tampered', async () => {
        const doc = amoyOaTokenRegistryMinted as any;
        const tampered: any = { ...doc, data: { ...doc.data, TAMPERED: true } };
        const fragments = await verifyDocument(tampered, { rpcProviderUrl: AMOY_RPC_URL });
        expect(fragments).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'OpenAttestationHash', status: 'INVALID' }),
          ]),
        );
      });

      it('OpenAttestationEthereumTokenRegistryStatus verifier should be selected (not skipped)', async () => {
        const fragments = await verifyDocument(amoyOaTokenRegistryMinted as any, {
          rpcProviderUrl: AMOY_RPC_URL,
        });
        const statusFragment = fragments.find(
          (f) => f.name === 'OpenAttestationEthereumTokenRegistryStatus',
        );
        expect(statusFragment?.status).not.toBe('SKIPPED');
      });

      it('network.chainId should decode to 80002 (Amoy)', () => {
        const doc = amoyOaTokenRegistryMinted as any;
        const chainIdRaw: string = doc.data?.network?.chainId ?? '';
        const chainId = chainIdRaw.split(':').pop();
        expect(chainId).toBe('80002');
      });
    },
  );

  // ─── W3C Transferable Record — minted on Amoy testnet ─────────────────────

  describe.skipIf(!W3C_AMOY_TR_MINTED_READY)(
    'amoy-w3c-transferable-record-minted — live Amoy testnet',
    () => {
      it(
        'should return VALID for all fragments (signature + minted token + issuer)',
        { timeout: 300000 },
        async () => {
          const fragments = await verifyDocument(amoyW3cTransferableRecordMinted as any, {
            rpcProviderUrl: AMOY_RPC_URL,
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
          const tampered: any = {
            ...amoyW3cTransferableRecordMinted,
            credentialStatus: {
              ...(amoyW3cTransferableRecordMinted as any).credentialStatus,
              tokenId: '0000000000000000000000000000000000000000000000000000000000000000',
            },
          };
          const fragments = await verifyDocument(tampered, { rpcProviderUrl: AMOY_RPC_URL });
          expect(fragments).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                name: 'TransferableRecords',
                status: 'INVALID',
                reason: expect.objectContaining({ codeString: 'DOCUMENT_NOT_MINTED' }),
              }),
            ]),
          );
        },
      );
    },
  );

  describe.skipIf(!W3C_AMOY_TR_MINTED_READY)(
    'amoy-w3c-transferable-record-minted — structural (offline)',
    () => {
      it('should have chain POL and chainId 80002', () => {
        const doc = amoyW3cTransferableRecordMinted as any;
        expect(doc.credentialStatus.tokenNetwork.chain).toBe('POL');
        expect(doc.credentialStatus.tokenNetwork.chainId).toBe(80002);
      });

      it('all verifier types should produce fragments', async () => {
        const fragments = await verifyDocument(amoyW3cTransferableRecordMinted as any);
        const names = fragments.map((f) => f.name);
        expect(names).toContain('EcdsaW3CSignatureIntegrity');
        expect(names).toContain('TransferableRecords');
        expect(names).toContain('W3CIssuerIdentity');
      });

      it('should return SKIPPED for W3CCredentialStatus (not a status-list credential)', async () => {
        const fragments = await verifyDocument(amoyW3cTransferableRecordMinted as any);
        expect(fragments).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              name: 'W3CCredentialStatus',
              status: 'SKIPPED',
              reason: expect.objectContaining({ codeString: 'SKIPPED' }),
            }),
          ]),
        );
      });
    },
  );
});
