import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { Wallet as WalletV6, Network, ethers as ethersV6 } from 'ethersV6';
import * as coreModule from '../../core';

import { mint } from '../../token-registry-functions';
import {
  MOCK_V4_ADDRESS,
  MOCK_V5_ADDRESS,
  mockV4TradeTrustTokenContract,
  mockV5TradeTrustTokenContract,
  PRIVATE_KEY,
  providerV5,
  providerV6,
} from './fixtures.js';
import { ProviderInfo } from '../../token-registry-functions/types';
import { getEthersContractFromProvider } from '../../utils/ethers';
import { CHAIN_ID } from '../../utils';

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
describe('Mint Token', () => {
  const mockTokenId = '0xTokenId';
  const mockRemarks = 'Mint remarks';
  const mockChainId = CHAIN_ID.local;
  describe.each(providers)(
    'Mint Token with TR version $titleEscrowVersion and ethers version $ethersVersion',
    async ({ Provider, ethersVersion, titleEscrowVersion }) => {
      const isV5TT = titleEscrowVersion === 'v5';
      //   let mockContract = isV5TT ? mockV5TradeTrustTokenContract : mockV4TradeTrustTokenContract;
      const mockTxResponse = titleEscrowVersion === 'v5' ? 'v5_mint_tx_hash' : 'v4_mint_tx_hash';

      let wallet: ethersV5.Wallet | ethersV6.Wallet;
      if (ethersVersion === 'v5') {
        wallet = new WalletV5(PRIVATE_KEY, Provider as any) as ethersV5.Wallet;
        vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);
      } else {
        wallet = new WalletV6(PRIVATE_KEY, Provider as any);
        vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
          chainId: mockChainId,
        } as unknown as Network);
      }
      const mockTokenRegistryAddress = isV5TT ? MOCK_V5_ADDRESS : MOCK_V4_ADDRESS;
      const mockBeneficiaryAddress = '0xBeneficiaryAddress';
      const mockHolderAddress = '0xHolderAddress';
      //   const titleEscrowAddress = isV5TT ? '0xv5contract' : '0xv4contract';
      const mockTradeTrustTokenContract = isV5TT
        ? mockV5TradeTrustTokenContract
        : mockV4TradeTrustTokenContract;
      beforeAll(() => {
        // Clear any existing mocks first
        vi.clearAllMocks();
        const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
        // Only set up the mock if it hasn't been set up yet
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockTradeTrustTokenContract),
        );
      });
      beforeEach(() => {
        vi.clearAllMocks();
        // vi.spyOn(coreModule, 'encrypt').mockReturnValue(mockEncryptedRemarks.slice(2));
        vi.spyOn(coreModule, 'checkSupportsInterface').mockImplementation(
          async (address, interfaceId) => {
            return (
              interfaceId ===
              (isV5TT ? '0xTradeTrustTokenMintableIdV5' : '0xTradeTrustTokenMintableIdV4')
            );
          },
        );
        mockTradeTrustTokenContract.callStatic.mint.mockResolvedValue(true);
        mockTradeTrustTokenContract.mint.staticCall.mockResolvedValue(true);
      });

      it('should  Mint token with remarks', async () => {
        const result = await mint(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          {
            beneficiaryAddress: mockBeneficiaryAddress,
            holderAddress: mockHolderAddress,
            tokenId: mockTokenId,
            remarks: mockRemarks,
          },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual(mockTxResponse);
        if (isV5TT) expect(coreModule.encrypt).toHaveBeenCalledWith(mockRemarks, 'encryption-id');
      });

      it('should mint token without remarks', async () => {
        const result = await mint(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          {
            beneficiaryAddress: mockBeneficiaryAddress,
            holderAddress: mockHolderAddress,
            tokenId: mockTokenId,
          },
          { chainId: mockChainId, titleEscrowVersion },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.encrypt).not.toHaveBeenCalled();
      });

      it('should throw when callStatic fails', async () => {
        const mockError = new Error('callStatic error');
        mockTradeTrustTokenContract.callStatic.mint.mockRejectedValue(mockError);
        mockTradeTrustTokenContract.mint.staticCall.mockRejectedValue(mockError);
        await expect(
          mint(
            { tokenRegistryAddress: mockTokenRegistryAddress },
            wallet,
            {
              beneficiaryAddress: mockBeneficiaryAddress,
              holderAddress: mockHolderAddress,
              tokenId: mockTokenId,
              remarks: mockRemarks,
            },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Pre-check (callStatic) for mint failed');
        if (isV5TT) {
          mockV5TradeTrustTokenContract.callStatic.mint = vi.fn();
        } else {
          mockV4TradeTrustTokenContract.callStatic.mint = vi.fn();
        }
      });

      it('should throw when token registry address is missing', async () => {
        await expect(
          mint(
            { tokenRegistryAddress: '' },
            wallet,
            {
              beneficiaryAddress: mockBeneficiaryAddress,
              holderAddress: mockHolderAddress,
              tokenId: mockTokenId,
            },
            { chainId: mockChainId },
          ),
        ).rejects.toThrow('Token registry address is required');
      });

      it('should throw when provider is missing', async () => {
        const signerWithoutProvider = new WalletV5('0x'.padEnd(66, '1'));

        await expect(
          mint(
            { tokenRegistryAddress: mockTokenRegistryAddress },
            signerWithoutProvider,
            {
              beneficiaryAddress: mockBeneficiaryAddress,
              holderAddress: mockHolderAddress,
              tokenId: mockTokenId,
              remarks: mockRemarks,
            },
            { chainId: mockChainId },
          ),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw when version is unsupported', async () => {
        vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

        await expect(
          mint(
            { tokenRegistryAddress: mockTokenRegistryAddress },
            wallet,
            {
              beneficiaryAddress: mockBeneficiaryAddress,
              holderAddress: mockHolderAddress,
              tokenId: mockTokenId,
              remarks: mockRemarks,
            },
            { chainId: mockChainId },
          ),
        ).rejects.toThrow('Only Token Registry V4/V5 is supported');
      });

      it('should work with explicit V5/V4 version', async () => {
        const result = await mint(
          { tokenRegistryAddress: mockTokenRegistryAddress },
          wallet,
          {
            beneficiaryAddress: mockBeneficiaryAddress,
            holderAddress: mockHolderAddress,
            tokenId: mockTokenId,
            remarks: mockRemarks,
          },
          { chainId: mockChainId, id: 'encryption-id', titleEscrowVersion },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.checkSupportsInterface).not.toHaveBeenCalled();
      });
    },
  );
});
