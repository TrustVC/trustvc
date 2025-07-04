import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { Wallet as WalletV6, Network, ethers as ethersV6 } from 'ethersV6';
import * as coreModule from '../../core';
import { CHAIN_ID } from '@tradetrust-tt/tradetrust-utils';
import { ownerOf } from '../../token-registry-functions';
import { v5Contracts } from '../../token-registry-v5';
import { v4Contracts } from '../../token-registry-v4';
import {
  MOCK_OWNER_ADDRESS,
  MOCK_V4_ADDRESS,
  MOCK_V5_ADDRESS,
  PRIVATE_KEY,
  providerV5,
  providerV6,
} from './fixtures';
import { ProviderInfo } from '../../token-registry-functions/types';

const providers: ProviderInfo[] = [
  {
    Provider: providerV5,
    ethersVersion: 'v5',
    titleEscrowVersion: 'v5',
  },
  {
    Provider: providerV5,
    ethersVersion: 'v5',
    titleEscrowVersion: 'v4',
  },
  {
    Provider: providerV6,
    ethersVersion: 'v6',
    titleEscrowVersion: 'v5',
  },
  {
    Provider: providerV6,
    ethersVersion: 'v6',
    titleEscrowVersion: 'v4',
  },
];

describe.each(providers)('ownerOf', ({ Provider, ethersVersion, titleEscrowVersion }) => {
  const mockTokenId = '0xTokenId';
  const mockChainId = CHAIN_ID.local;
  const isV5TT = titleEscrowVersion === 'v5';
  // let mockContract = isV5TT ? mockV5TradeTrustTokenContract : mockV4TradeTrustTokenContract;

  let wallet: ethersV5.Wallet | ethersV6.Wallet;
  if (ethersVersion === 'v5') {
    wallet = new WalletV5(PRIVATE_KEY, Provider as any) as ethersV5.Wallet;
    vi.spyOn(wallet, 'getChainId').mockResolvedValue(CHAIN_ID.local as unknown as number);
  } else {
    wallet = new WalletV6(PRIVATE_KEY, Provider as any);
    vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
      chainId: CHAIN_ID.local,
    } as unknown as Network);
  }
  const mockTokenRegistryAddress = isV5TT ? MOCK_V5_ADDRESS : MOCK_V4_ADDRESS;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(coreModule, 'checkSupportsInterface').mockImplementation(
      async (address, interfaceId) => {
        return interfaceId === (isV5TT ? '0xSBTIdV5' : '0xSBTIdV4');
      },
    );
  });

  // afterEach(() => {
  //   vi.restoreAllMocks();
  // });

  describe('Successful Calls', () => {
    it('should return owner for V5/v4 contract (auto-detected)', async () => {
      const result = await ownerOf(
        { tokenRegistryAddress: mockTokenRegistryAddress },
        wallet,
        { tokenId: mockTokenId },
        { chainId: mockChainId },
      );

      expect(result).toBe(MOCK_OWNER_ADDRESS);
      expect(
        (isV5TT ? v5Contracts : v4Contracts).TradeTrustToken__factory.connect,
      ).toHaveBeenCalled();
    });

    it('should return owner for V5/v4 contract (explicit version)', async () => {
      const result = await ownerOf(
        { tokenRegistryAddress: mockTokenRegistryAddress },
        wallet,
        { tokenId: mockTokenId },
        { chainId: mockChainId, titleEscrowVersion: titleEscrowVersion },
      );

      expect(result).toBe(MOCK_OWNER_ADDRESS);
      expect(coreModule.checkSupportsInterface).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw when token registry address is missing', async () => {
      await expect(
        ownerOf(
          { tokenRegistryAddress: '' },
          wallet,
          { tokenId: mockTokenId },
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Token registry address is required');
    });

    it('should throw when provider is missing', async () => {
      const signerWithoutProvider = new WalletV5('0x'.padEnd(66, '1'));

      await expect(
        ownerOf(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          signerWithoutProvider,
          { tokenId: mockTokenId },
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Provider is required');
    });

    it('should throw when version is unsupported', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

      await expect(
        ownerOf(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          { tokenId: mockTokenId },
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Only Token Registry V4/V5 is supported');
    });
  });
});
