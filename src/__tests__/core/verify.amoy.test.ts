import { describe, it, expect } from 'vitest';
import { CHAIN_ID, SUPPORTED_CHAINS } from '../../utils/supportedChains';

import amoyOaTokenRegistryMinted from '../fixtures/amoy-oa-token-registry-minted.json';
import amoyW3cTransferableRecordMinted from '../fixtures/amoy-w3c-transferable-record-minted.json';
import {
  isMintedFixtureReady,
  oaTokenRegistryMintedTests,
  w3cTransferableRecordMintedTests,
} from './verify.polygon-network.helpers';

const AMOY_RPC_URL = process.env.AMOY_RPC || 'https://rpc-amoy.polygon.technology/';

describe('Polygon Amoy (testnet) network support', () => {
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

  describe.skipIf(!isMintedFixtureReady(amoyOaTokenRegistryMinted))(
    'amoy-oa-token-registry-minted',
    () => {
      oaTokenRegistryMintedTests({
        fixture: amoyOaTokenRegistryMinted,
        rpcUrl: AMOY_RPC_URL,
        expectedNetworkChainId: '80002',
        includeSignatureTamperTest: true,
      });
    },
  );

  describe.skipIf(!isMintedFixtureReady(amoyW3cTransferableRecordMinted))(
    'amoy-w3c-transferable-record-minted',
    () => {
      w3cTransferableRecordMintedTests({
        fixture: amoyW3cTransferableRecordMinted,
        rpcUrl: AMOY_RPC_URL,
        chainId: 80002,
      });
    },
  );
});
