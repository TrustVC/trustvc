import { describe, it, expect } from 'vitest';
import { verifyDocument } from '../../core/verify';
import { W3C_TRANSFERABLE_RECORD_POL } from '../fixtures/fixtures';
import { CHAIN_ID, SUPPORTED_CHAINS } from '../../utils/supportedChains';

import polW3cTransferableRecordMinted from '../fixtures/pol-w3c-transferable-record-minted.json';
import polOaTokenRegistryMinted from '../fixtures/pol-oa-token-registry-minted.json';
import polW3cVerifiableDocument from '../fixtures/pol-w3c-verifiable-document.json';

const POL_RPC_URL = process.env.POL_RPC || 'https://polygon-bor-rpc.publicnode.com';

// Placeholder fixtures are empty until the user fills them in.
const W3C_TR_POL_MINTED_READY = Object.keys(polW3cTransferableRecordMinted).length > 0;
const OA_POL_MINTED_READY = Object.keys(polOaTokenRegistryMinted).length > 0;
const W3C_VD_POL_READY = Object.keys(polW3cVerifiableDocument).length > 0;

describe('Polygon (POL) network support', () => {
  // ─── Chain constants ────────────────────────────────────────────────────────

  describe('CHAIN_ID and SUPPORTED_CHAINS', () => {
    it('CHAIN_ID.pol should equal chain ID 137', () => {
      expect(CHAIN_ID.pol).toBe('137');
    });

    it('CHAIN_ID.matic (backward-compat alias) should also equal 137', () => {
      expect(CHAIN_ID.matic).toBe('137');
    });

    it('SUPPORTED_CHAINS[CHAIN_ID.pol] should have currency POL', () => {
      expect(SUPPORTED_CHAINS[CHAIN_ID.pol].currency).toBe('POL');
    });

    it('SUPPORTED_CHAINS[CHAIN_ID.pol] and SUPPORTED_CHAINS[CHAIN_ID.matic] should be the same object', () => {
      expect(SUPPORTED_CHAINS[CHAIN_ID.pol]).toBe(SUPPORTED_CHAINS[CHAIN_ID.matic]);
    });
  });

  // ─── Unminted fixture (structural + offline) ────────────────────────────────

  describe('W3C_TRANSFERABLE_RECORD_POL fixture structure', () => {
    it('should have chain POL and chainId 137 in credentialStatus', () => {
      expect(W3C_TRANSFERABLE_RECORD_POL.credentialStatus.tokenNetwork.chain).toBe('POL');
      expect(W3C_TRANSFERABLE_RECORD_POL.credentialStatus.tokenNetwork.chainId).toBe(137);
    });

    it('should have a DataIntegrityProof with ecdsa-sd-2023 cryptosuite', () => {
      expect(W3C_TRANSFERABLE_RECORD_POL.proof.type).toBe('DataIntegrityProof');
      expect(W3C_TRANSFERABLE_RECORD_POL.proof.cryptosuite).toBe('ecdsa-sd-2023');
    });

    it('issuer should be did:web:didhost.vercel.app', () => {
      expect(W3C_TRANSFERABLE_RECORD_POL.issuer).toBe('did:web:didhost.vercel.app');
    });
  });

  describe('W3C_TRANSFERABLE_RECORD_POL — POL network routing', () => {
    it(
      'verifyDocument should return fragments for a POL credential (all verifiers run)',
      { timeout: 30000 },
      async () => {
        const fragments = await verifyDocument(W3C_TRANSFERABLE_RECORD_POL as any);
        const names = fragments.map((f) => f.name);
        expect(names).toContain('EcdsaW3CSignatureIntegrity');
        expect(names).toContain('W3CCredentialStatus');
        expect(names).toContain('W3CIssuerIdentity');
      },
    );

    it(
      'should reach Polygon mainnet (chain 137) for DOCUMENT_STATUS check',
      { timeout: 300000 },
      async () => {
        const fragments = await verifyDocument(W3C_TRANSFERABLE_RECORD_POL as any, {
          rpcProviderUrl: POL_RPC_URL,
        });
        const statusFragment = fragments.find((f) => f.name === 'W3CCredentialStatus');
        expect(statusFragment).toBeDefined();
        expect(statusFragment?.status).not.toBe('ERROR');
      },
    );

    it('should return ERROR when tokenRegistry is missing', async () => {
      const tampered: any = {
        ...W3C_TRANSFERABLE_RECORD_POL,
        credentialStatus: {
          ...W3C_TRANSFERABLE_RECORD_POL.credentialStatus,
          tokenRegistry: '',
        },
      };
      const fragments = await verifyDocument(tampered);
      expect(fragments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'TransferableRecords',
            status: 'ERROR',
            reason: expect.objectContaining({
              codeString: 'UNRECOGNIZED_DOCUMENT',
              message: "Document's credentialStatus does not have tokenRegistry",
            }),
          }),
        ]),
      );
    });

    it('should return ERROR when tokenNetwork.chainId is missing', async () => {
      const tampered: any = {
        ...W3C_TRANSFERABLE_RECORD_POL,
        credentialStatus: {
          ...W3C_TRANSFERABLE_RECORD_POL.credentialStatus,
          tokenNetwork: { chain: 'POL', chainId: '' },
        },
      };
      const fragments = await verifyDocument(tampered);
      expect(fragments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'TransferableRecords',
            status: 'ERROR',
            reason: expect.objectContaining({
              codeString: 'UNRECOGNIZED_DOCUMENT',
              message: "Document's credentialStatus does not have tokenNetwork.chainId",
            }),
          }),
        ]),
      );
    });

    it('should return INVALID for DOCUMENT_INTEGRITY when proof is tampered', async () => {
      const tampered: any = {
        ...W3C_TRANSFERABLE_RECORD_POL,
        proof: {
          ...W3C_TRANSFERABLE_RECORD_POL.proof,
          proofValue: 'u2V0AhVhAINVALIDPROOF',
        },
      };
      const fragments = await verifyDocument(tampered);
      expect(fragments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'EcdsaW3CSignatureIntegrity',
            status: 'INVALID',
          }),
        ]),
      );
    });
  });

  // ─── W3C Transferable Record — minted on POL mainnet ───────────────────────

  describe.skipIf(!W3C_TR_POL_MINTED_READY)(
    'pol-w3c-transferable-record-minted — live POL mainnet',
    () => {
      it(
        'should return VALID for all fragments (signature + minted token + issuer)',
        { timeout: 300000 },
        async () => {
          const fragments = await verifyDocument(polW3cTransferableRecordMinted as any, {
            rpcProviderUrl: POL_RPC_URL,
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
            ...polW3cTransferableRecordMinted,
            credentialStatus: {
              ...(polW3cTransferableRecordMinted as any).credentialStatus,
              tokenId: '0000000000000000000000000000000000000000000000000000000000000000',
            },
          };
          const fragments = await verifyDocument(tampered, { rpcProviderUrl: POL_RPC_URL });
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

      it(
        'should return INVALID for DOCUMENT_INTEGRITY when credential subject is tampered',
        { timeout: 300000 },
        async () => {
          const tampered: any = {
            ...polW3cTransferableRecordMinted,
            credentialSubject: {
              ...(polW3cTransferableRecordMinted as any).credentialSubject,
              name: 'TAMPERED',
            },
          };
          const fragments = await verifyDocument(tampered, { rpcProviderUrl: POL_RPC_URL });
          const integrityFragment = fragments.find(
            (f) => f.type === 'DOCUMENT_INTEGRITY' && f.status !== 'SKIPPED',
          );
          expect(integrityFragment?.status).toBe('INVALID');
        },
      );
    },
  );

  // ─── W3C Transferable Record — minted (structure tests, no RPC) ────────────

  describe.skipIf(!W3C_TR_POL_MINTED_READY)(
    'pol-w3c-transferable-record-minted — structural (offline)',
    () => {
      it('should have chain POL and chainId 137', () => {
        const doc = polW3cTransferableRecordMinted as any;
        expect(doc.credentialStatus.tokenNetwork.chain).toBe('POL');
        expect(doc.credentialStatus.tokenNetwork.chainId).toBe(137);
      });

      it('all verifier types should produce fragments', async () => {
        const fragments = await verifyDocument(polW3cTransferableRecordMinted as any);
        const names = fragments.map((f) => f.name);
        expect(names).toContain('EcdsaW3CSignatureIntegrity');
        expect(names).toContain('TransferableRecords');
        expect(names).toContain('W3CIssuerIdentity');
      });

      it('should return SKIPPED for W3CCredentialStatus (not a status-list credential)', async () => {
        const fragments = await verifyDocument(polW3cTransferableRecordMinted as any);
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

  // ─── OA Token Registry — minted on POL mainnet ────────────────────────────

  describe.skipIf(!OA_POL_MINTED_READY)('pol-oa-token-registry-minted — live POL mainnet', () => {
    it(
      'should return VALID for DOCUMENT_INTEGRITY and DOCUMENT_STATUS',
      { timeout: 300000 },
      async () => {
        const fragments = await verifyDocument(polOaTokenRegistryMinted as any, {
          rpcProviderUrl: POL_RPC_URL,
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
        const doc = polOaTokenRegistryMinted as any;
        const tampered: any = {
          ...doc,
          signature: {
            ...doc.signature,
            targetHash: '0000000000000000000000000000000000000000000000000000000000000000',
            merkleRoot: '0000000000000000000000000000000000000000000000000000000000000000',
          },
        };
        const fragments = await verifyDocument(tampered, { rpcProviderUrl: POL_RPC_URL });
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
  });

  // OA verifiers run concurrently — even a hash-only test triggers the token registry verifier
  // which needs a provider. Pass rpcProviderUrl to avoid falling back to the Infura URL that
  // has no API key set in the test environment.
  describe.skipIf(!OA_POL_MINTED_READY)(
    'pol-oa-token-registry-minted — structural (hash + verifier selection)',
    () => {
      it('should return VALID for OpenAttestationHash (pure hash check)', async () => {
        const fragments = await verifyDocument(polOaTokenRegistryMinted as any, {
          rpcProviderUrl: POL_RPC_URL,
        });
        expect(fragments).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'OpenAttestationHash', status: 'VALID' }),
          ]),
        );
      });

      it('should return INVALID for OpenAttestationHash when document data is tampered', async () => {
        const doc = polOaTokenRegistryMinted as any;
        const tampered: any = { ...doc, data: { ...doc.data, TAMPERED: true } };
        const fragments = await verifyDocument(tampered, { rpcProviderUrl: POL_RPC_URL });
        expect(fragments).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ name: 'OpenAttestationHash', status: 'INVALID' }),
          ]),
        );
      });

      it('OpenAttestationEthereumTokenRegistryStatus verifier should be selected (not skipped)', async () => {
        const fragments = await verifyDocument(polOaTokenRegistryMinted as any, {
          rpcProviderUrl: POL_RPC_URL,
        });
        const statusFragment = fragments.find(
          (f) => f.name === 'OpenAttestationEthereumTokenRegistryStatus',
        );
        expect(statusFragment?.status).not.toBe('SKIPPED');
      });
    },
  );

  // ─── W3C Verifiable Document (non-transferable) — structural (offline) ──────

  describe.skipIf(!W3C_VD_POL_READY)('pol-w3c-verifiable-document — structural (offline)', () => {
    it('all verifier types should produce fragments', async () => {
      const fragments = await verifyDocument(polW3cVerifiableDocument as any);
      const names = fragments.map((f) => f.name);
      expect(names).toContain('W3CIssuerIdentity');
    });

    it('W3CCredentialStatus should be SKIPPED and W3CEmptyCredentialStatus VALID when no credentialStatus', async () => {
      const doc: any = { ...polW3cVerifiableDocument };
      delete doc.credentialStatus;
      const fragments = await verifyDocument(doc);
      const statusFragments = fragments.filter((f) => f.type === 'DOCUMENT_STATUS');
      const credentialStatusFrag = statusFragments.find((f) => f.name === 'W3CCredentialStatus');
      const emptyStatusFrag = statusFragments.find((f) => f.name === 'W3CEmptyCredentialStatus');
      expect(credentialStatusFrag?.status).toBe('SKIPPED');
      expect(emptyStatusFrag?.status).toBe('VALID');
      expect(statusFragments.every((f) => f.status !== 'INVALID')).toBe(true);
    });

    it('should return INVALID for DOCUMENT_INTEGRITY when proof is tampered', async () => {
      const doc = polW3cVerifiableDocument as any;
      if (!doc.proof) return;
      const tampered: any = { ...doc, proof: { ...doc.proof, proofValue: 'uINVALID' } };
      const fragments = await verifyDocument(tampered);
      const integrityFragment = fragments.find(
        (f) => f.type === 'DOCUMENT_INTEGRITY' && f.status !== 'SKIPPED',
      );
      expect(integrityFragment?.status).toBe('INVALID');
    });
  });
});
