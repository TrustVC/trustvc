import { describe, it, expect } from 'vitest';
import { verifyDocument } from '../../core/verify';
import { W3C_TRANSFERABLE_RECORD_POL } from '../fixtures/fixtures';
import { CHAIN_ID, SUPPORTED_CHAINS } from '../../utils/supportedChains';

// Public Polygon mainnet RPC — no API key required for read-only calls.
const POL_RPC_URL = process.env.POL_RPC || 'https://polygon-rpc.com';

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

        // All three verifier types should produce fragments — proves the document
        // is recognised as a W3C VC with POL credentialStatus.
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

        // W3CCredentialStatus fragment must be present — its presence proves the verifier
        // attempted to check the token on Polygon mainnet (chain 137).
        // INVALID = token not minted on-chain (expected for this test fixture).
        // ERROR   = RPC connection failed, meaning POL routing is broken.
        const statusFragment = fragments.find((f) => f.name === 'W3CCredentialStatus');
        expect(statusFragment).toBeDefined();
        expect(statusFragment?.status).not.toBe('ERROR');
      },
    );
  });
});
