import { describe, it, expect } from 'vitest';
import { verifyDocument } from '../../core/verify';
import { W3C_TRANSFERABLE_RECORD_POL } from '../fixtures/fixtures';
import { CHAIN_ID, SUPPORTED_CHAINS } from '../../utils/supportedChains';

import polW3cTransferableRecordMinted from '../fixtures/pol-w3c-transferable-record-minted.json';
import polOaTokenRegistryMinted from '../fixtures/pol-oa-token-registry-minted.json';
import polW3cVerifiableDocument from '../fixtures/pol-w3c-verifiable-document.json';
import {
  expectTransferableRecordError,
  isMintedFixtureReady,
  oaTokenRegistryMintedTests,
  w3cTransferableRecordMintedTests,
} from './verify.polygon-network.helpers';

const POL_RPC_URL = process.env.POL_RPC || 'https://polygon-bor-rpc.publicnode.com';

describe('Polygon (POL) network support', () => {
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

  describe('W3C_TRANSFERABLE_RECORD_POL fixture structure', () => {
    it('should have chain POL and chainId 137 in credentialStatus', () => {
      // credentialStatus is typed as the CredentialStatus | CredentialStatus[] union;
      // this fixture uses a single TransferableRecords status object.
      const credentialStatus = W3C_TRANSFERABLE_RECORD_POL.credentialStatus as unknown as {
        tokenNetwork: { chain: string; chainId: number };
      };
      expect(credentialStatus.tokenNetwork.chain).toBe('POL');
      expect(credentialStatus.tokenNetwork.chainId).toBe(137);
    });

    it('should have a DataIntegrityProof with ecdsa-sd-2023 cryptosuite', () => {
      expect(W3C_TRANSFERABLE_RECORD_POL.proof.type).toBe('DataIntegrityProof');
      expect(W3C_TRANSFERABLE_RECORD_POL.proof.cryptosuite).toBe('ecdsa-sd-2023');
    });

    it('issuer should be did:web:trustvc.github.io:did:1', () => {
      expect(W3C_TRANSFERABLE_RECORD_POL.issuer).toBe('did:web:trustvc.github.io:did:1');
    });
  });

  describe('W3C_TRANSFERABLE_RECORD_POL — POL network routing', () => {
    it(
      'verifyDocument should return fragments for a POL credential',
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

    it.each([
      {
        label: 'tokenRegistry is missing',
        credentialStatus: {
          ...W3C_TRANSFERABLE_RECORD_POL.credentialStatus,
          tokenRegistry: '',
        },
      },
      {
        label: 'tokenNetwork.chainId is missing',
        credentialStatus: {
          ...W3C_TRANSFERABLE_RECORD_POL.credentialStatus,
          tokenNetwork: { chain: 'POL', chainId: '' },
        },
      },
    ])('should return ERROR when $label', async ({ credentialStatus }) => {
      const tampered: any = {
        ...W3C_TRANSFERABLE_RECORD_POL,
        credentialStatus,
      };
      expectTransferableRecordError(await verifyDocument(tampered));
    });

    it('should return INVALID for DOCUMENT_INTEGRITY when proof is tampered', async () => {
      const tampered: any = {
        ...W3C_TRANSFERABLE_RECORD_POL,
        proof: { ...W3C_TRANSFERABLE_RECORD_POL.proof, proofValue: 'u2V0AhVhAINVALIDPROOF' },
      };
      const fragments = await verifyDocument(tampered);
      expect(fragments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'EcdsaW3CSignatureIntegrity', status: 'INVALID' }),
        ]),
      );
    });
  });

  describe.skipIf(!isMintedFixtureReady(polW3cTransferableRecordMinted))(
    'pol-w3c-transferable-record-minted',
    () => {
      w3cTransferableRecordMintedTests({
        fixture: polW3cTransferableRecordMinted,
        rpcUrl: POL_RPC_URL,
        chainId: 137,
      });
    },
  );

  describe.skipIf(!isMintedFixtureReady(polOaTokenRegistryMinted))(
    'pol-oa-token-registry-minted',
    () => {
      oaTokenRegistryMintedTests({
        fixture: polOaTokenRegistryMinted,
        rpcUrl: POL_RPC_URL,
      });
    },
  );

  describe.skipIf(!isMintedFixtureReady(polW3cVerifiableDocument))(
    'pol-w3c-verifiable-document — structural (offline)',
    () => {
      it('all verifier types should produce fragments', async () => {
        const fragments = await verifyDocument(polW3cVerifiableDocument as any);
        expect(fragments.map((f) => f.name)).toContain('W3CIssuerIdentity');
      });

      it('W3CCredentialStatus should be SKIPPED and W3CEmptyCredentialStatus VALID when no credentialStatus', async () => {
        const doc: any = { ...polW3cVerifiableDocument };
        delete doc.credentialStatus;
        const fragments = await verifyDocument(doc);
        const statusFragments = fragments.filter((f) => f.type === 'DOCUMENT_STATUS');
        expect(statusFragments.find((f) => f.name === 'W3CCredentialStatus')?.status).toBe(
          'SKIPPED',
        );
        expect(statusFragments.find((f) => f.name === 'W3CEmptyCredentialStatus')?.status).toBe(
          'VALID',
        );
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
    },
  );
});
