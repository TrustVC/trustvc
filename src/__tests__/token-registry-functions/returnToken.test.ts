import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { Wallet as WalletV6, Network, ethers as ethersV6 } from 'ethersV6';
import * as coreModule from '../../core';

import { CHAIN_ID } from '@tradetrust-tt/tradetrust-utils';
import { v5Contracts } from '../../token-registry-v5';
import { v4Contracts } from '../../token-registry-v4';
import {
  acceptReturned,
  rejectReturned,
  returnToIssuer,
} from '../../token-registry-functions/returnToken';
import {
  MOCK_V4_ADDRESS,
  MOCK_V5_ADDRESS,
  mockV4TitleEscrowContract,
  mockV4TradeTrustTokenContract,
  mockV5TitleEscrowContract,
  mockV5TradeTrustTokenContract,
  PRIVATE_KEY,
  providerV5,
  providerV6,
} from './fixtures.js';
import { ProviderInfo } from '../../token-registry-functions/types.js';

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
describe('Return Token', () => {
  const mockTokenId = '0xTokenId';
  const mockRemarks = 'Return remarks';
  const mockChainId = CHAIN_ID.local;
  const mockEncryptedRemarks = '0xencryptedRemarks';
  describe.each(providers)(
    'Return Token with TR version $titleEscrowVersion and ethers version $ethersVersion',
    async ({ Provider, ethersVersion, titleEscrowVersion }) => {
      const mockTokenRegistryAddress = '0xTokenRegistry';
      const mockTxResponse =
        titleEscrowVersion === 'v5' ? 'v5_return_to_issuer_tx_hash' : 'v4_surrender_tx_hash';

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
      const isV5TT = titleEscrowVersion === 'v5';
      const titleEscrowAddress = isV5TT ? '0xv5contract' : '0xv4contract';

      beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(coreModule, 'getTitleEscrowAddress').mockResolvedValue(titleEscrowAddress);
        vi.spyOn(coreModule, 'encrypt').mockReturnValue(mockEncryptedRemarks.slice(2));
        vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
          async ({ versionInterface }) => {
            return versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4');
          },
        );
        mockV5TitleEscrowContract.callStatic.returnToIssuer.mockResolvedValue(true);
        mockV4TitleEscrowContract.callStatic.surrender.mockResolvedValue(true);
      });

      it('should return to issuer with signer and remarks', async () => {
        const result = await returnToIssuer(
          {
            titleEscrowAddress,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.encrypt).toHaveBeenCalledWith(mockRemarks, 'encryption-id');
        expect(
          (isV5TT ? v5Contracts : v4Contracts).TitleEscrow__factory.connect,
        ).toHaveBeenCalled();
      });

      it('should return to issuer without remarks', async () => {
        const result = await returnToIssuer(
          { titleEscrowAddress },
          wallet,
          {},
          { chainId: mockChainId },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.encrypt).not.toHaveBeenCalled();
      });

      it('should throw when callStatic fails', async () => {
        if (isV5TT) {
          mockV5TitleEscrowContract.callStatic.returnToIssuer.mockRejectedValue(
            new Error('Simulated failure'),
          );
        } else {
          mockV4TitleEscrowContract.callStatic.surrender.mockRejectedValue(
            new Error('Simulated failure'),
          );
        }

        await expect(
          returnToIssuer(
            { tokenRegistryAddress: mockTokenRegistryAddress, tokenId: mockTokenId },
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Pre-check (callStatic) for returnToIssuer failed');
        if (isV5TT) {
          mockV5TitleEscrowContract.callStatic.returnToIssuer = vi.fn();
        } else {
          mockV4TitleEscrowContract.callStatic.surrender = vi.fn();
        }
      });
      it('should throw error when provider is missing', async () => {
        const signerWithoutProvider = isV5TT
          ? new WalletV5('0x'.padEnd(66, '1'))
          : new WalletV6('0x'.padEnd(66, '1'));

        await expect(
          returnToIssuer(
            { tokenRegistryAddress: mockTokenRegistryAddress, tokenId: mockTokenId },
            signerWithoutProvider,
            {},
            { chainId: mockChainId },
          ),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw when version is unsupported', async () => {
        vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(false);

        await expect(
          returnToIssuer(
            { tokenRegistryAddress: mockTokenRegistryAddress, tokenId: mockTokenId },
            wallet,
            {},
            { chainId: mockChainId },
          ),
        ).rejects.toThrow('Only Token Registry V4/V5 is supported');
      });

      it('should work with explicit  version', async () => {
        const result = await returnToIssuer(
          { tokenRegistryAddress: mockTokenRegistryAddress, tokenId: mockTokenId },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id', titleEscrowVersion },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.isTitleEscrowVersion).not.toHaveBeenCalled();
      });
    },
  );

  describe.each(providers)(
    'Reject Return Token with TR version $titleEscrowVersion and ethers version $ethersVersion',
    async ({ Provider, ethersVersion, titleEscrowVersion }) => {
      const isV5TT = titleEscrowVersion === 'v5';
      //   let mockContract = isV5TT ? mockV5TradeTrustTokenContract : mockV4TradeTrustTokenContract;
      const mockTxResponse =
        titleEscrowVersion === 'v5' ? 'v5_restore_tx_hash' : 'v4_restore_tx_hash';

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
      //   const titleEscrowAddress = isV5TT ? '0xv5contract' : '0xv4contract';
      beforeEach(() => {
        vi.clearAllMocks();
        // vi.spyOn(coreModule, 'encrypt').mockReturnValue(mockEncryptedRemarks.slice(2));
        vi.spyOn(coreModule, 'checkSupportsInterface').mockImplementation(
          async (address, interfaceId) => {
            return (
              interfaceId ===
              (isV5TT ? '0xTradeTrustTokenRestorableIdV5' : '0xTradeTrustTokenRestorableIdV4')
            );
          },
        );
        mockV5TradeTrustTokenContract.callStatic.restore.mockResolvedValue(true);
        mockV4TradeTrustTokenContract.callStatic.restore.mockResolvedValue(true);
      });

      it('should reject returned token with remarks', async () => {
        const result = await rejectReturned(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          { tokenId: mockTokenId, remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual(mockTxResponse);
        if (isV5TT) expect(coreModule.encrypt).toHaveBeenCalledWith(mockRemarks, 'encryption-id');
        expect(
          (isV5TT ? v5Contracts : v4Contracts).TradeTrustToken__factory.connect,
        ).toHaveBeenCalled();
      });

      it('should reject returned token without remarks', async () => {
        const result = await rejectReturned(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          { tokenId: mockTokenId },
          { chainId: mockChainId, titleEscrowVersion },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.encrypt).not.toHaveBeenCalled();
      });

      it('should throw when callStatic fails', async () => {
        const mockError = new Error('callStatic error');
        if (isV5TT) {
          mockV5TradeTrustTokenContract.callStatic.restore.mockRejectedValue(mockError);
        } else {
          mockV4TradeTrustTokenContract.callStatic.restore.mockRejectedValue(mockError);
        }
        await expect(
          rejectReturned(
            { tokenRegistryAddress: mockTokenRegistryAddress },
            wallet,
            { tokenId: mockTokenId, remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Pre-check (callStatic) for rejectReturned failed');
        if (isV5TT) {
          mockV5TradeTrustTokenContract.callStatic.restore = vi.fn();
        } else {
          mockV4TradeTrustTokenContract.callStatic.restore = vi.fn();
        }
      });

      it('should throw when token registry address is missing', async () => {
        await expect(
          rejectReturned(
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
          rejectReturned(
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
          rejectReturned(
            { tokenRegistryAddress: mockTokenRegistryAddress },
            wallet,
            { tokenId: mockTokenId },
            { chainId: mockChainId },
          ),
        ).rejects.toThrow('Only Token Registry V4/V5 is supported');
      });

      it('should work with explicit V5/V4 version', async () => {
        const result = await rejectReturned(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          { tokenId: mockTokenId, remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id', titleEscrowVersion },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.checkSupportsInterface).not.toHaveBeenCalled();
      });
    },
  );

  describe.each(providers)(
    'Accept Return Token with TR version $titleEscrowVersion and ethers version $ethersVersion',
    async ({ Provider, ethersVersion, titleEscrowVersion }) => {
      const isV5TT = titleEscrowVersion === 'v5';
      //   let mockContract = isV5TT ? mockV5TradeTrustTokenContract : mockV4TradeTrustTokenContract;
      const mockTxResponse = titleEscrowVersion === 'v5' ? 'v5_burn_tx_hash' : 'v4_burn_tx_hash';

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
      //   const titleEscrowAddress = isV5TT ? '0xv5contract' : '0xv4contract';
      beforeEach(() => {
        vi.clearAllMocks();

        vi.spyOn(coreModule, 'checkSupportsInterface').mockImplementation(
          async (address, interfaceId) => {
            return (
              interfaceId ===
              (isV5TT ? '0xTradeTrustTokenBurnableIdV5' : '0xTradeTrustTokenBurnableIdV4')
            );
          },
        );
        mockV5TradeTrustTokenContract.callStatic.burn.mockResolvedValue(true);
        mockV4TradeTrustTokenContract.callStatic.burn.mockResolvedValue(true);
      });

      it('should accept returned token with remarks', async () => {
        const result = await acceptReturned(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          { tokenId: mockTokenId, remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual(mockTxResponse);
        if (isV5TT) expect(coreModule.encrypt).toHaveBeenCalledWith(mockRemarks, 'encryption-id');
        expect(
          (isV5TT ? v5Contracts : v4Contracts).TradeTrustToken__factory.connect,
        ).toHaveBeenCalled();
      });

      it('should accept returned token without remarks', async () => {
        const result = await acceptReturned(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          { tokenId: mockTokenId },
          { chainId: mockChainId, titleEscrowVersion },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.encrypt).not.toHaveBeenCalled();
      });

      it('should throw when callStatic fails', async () => {
        const mockError = new Error('callStatic error');
        if (isV5TT) {
          mockV5TradeTrustTokenContract.callStatic.burn.mockRejectedValue(mockError);
        } else {
          mockV4TradeTrustTokenContract.callStatic.burn.mockRejectedValue(mockError);
        }
        await expect(
          acceptReturned(
            { tokenRegistryAddress: mockTokenRegistryAddress },
            wallet,
            { tokenId: mockTokenId, remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Pre-check (callStatic) for acceptReturned failed');
        if (isV5TT) {
          mockV5TradeTrustTokenContract.callStatic.burn = vi.fn();
        } else {
          mockV4TradeTrustTokenContract.callStatic.burn = vi.fn();
        }
      });

      it('should throw when token registry address is missing', async () => {
        await expect(
          acceptReturned(
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
          acceptReturned(
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
          acceptReturned(
            { tokenRegistryAddress: mockTokenRegistryAddress },
            wallet,
            { tokenId: mockTokenId },
            { chainId: mockChainId },
          ),
        ).rejects.toThrow('Only Token Registry V4/V5 is supported');
      });

      it('should work with explicit V5/V4 version', async () => {
        const result = await acceptReturned(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          { tokenId: mockTokenId, remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id', titleEscrowVersion },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.checkSupportsInterface).not.toHaveBeenCalled();
      });
    },
  );
});
