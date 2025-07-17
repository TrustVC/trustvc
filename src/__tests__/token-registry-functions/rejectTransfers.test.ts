import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { ethers as ethersV6, Network, Wallet as WalletV6 } from 'ethersV6';
import * as coreModule from '../../core';
import { CHAIN_ID } from '@tradetrust-tt/tradetrust-utils';
import {
  rejectTransferBeneficiary,
  rejectTransferHolder,
  rejectTransferOwners,
} from '../../token-registry-functions/rejectTransfers';
import { mockV5TitleEscrowContract, PRIVATE_KEY, providerV5, providerV6 } from './fixtures';
import { ProviderInfo } from '../../token-registry-functions/types.js';
import { getEthersContractFromProvider } from '../../utils/ethers';

const providers: ProviderInfo[] = [
  {
    Provider: providerV5,
    ethersVersion: 'v5',
    titleEscrowVersion: 'v5',
  },
  {
    Provider: providerV6,
    ethersVersion: 'v6',
    titleEscrowVersion: 'v5',
  },
];

describe.each(providers)(
  'Reject Transfers',
  async ({ Provider, ethersVersion, titleEscrowVersion }) => {
    const mockTokenRegistryAddress = '0xTokenRegistry';
    const mockTokenId = '0xTokenId';
    const mockTitleEscrowAddress = '0xTitleEscrow';
    const mockRemarks = 'Rejection remarks';
    const mockChainId = CHAIN_ID.local;
    const mockEncryptedRemarks = '0xencryptedRemarks';

    let wallet: ethersV5.Wallet | ethersV6.Wallet;
    // Handle both v5 and v6 contract constructors
    beforeAll(() => {
      // Clear any existing mocks first
      vi.clearAllMocks();
      const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
      // Only set up the mock if it hasn't been set up yet
      vi.mocked(getEthersContractFromProvider).mockReturnValue(
        mockContractConstructor(mockV5TitleEscrowContract),
      );
    });
    beforeEach(() => {
      // Reset all mocks before each test
      vi.clearAllMocks();

      if (ethersVersion === 'v5') {
        wallet = new WalletV5(PRIVATE_KEY, Provider as any) as ethersV5.Wallet;
        //   wallet = {
        //     ...wallet,
        //     address: '0xcurrent_holder',
        //     getChainId: vi.fn().mockResolvedValue(CHAIN_ID.mainnet as unknown as number),
        //   } as any;
        vi.spyOn(wallet, 'getChainId').mockResolvedValue(CHAIN_ID.mainnet as unknown as number);
      } else {
        wallet = new WalletV6(PRIVATE_KEY, Provider as any);
        vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
          chainId: CHAIN_ID.mainnet,
        } as unknown as Network);
        //   vi.spyOn(wallet, 'getAddress').mockResolvedValue('0xcurrent_holder');
      }

      // Mock core functions
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockResolvedValue(mockTitleEscrowAddress);
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(true);
      vi.spyOn(coreModule, 'encrypt').mockReturnValue(mockEncryptedRemarks.slice(2));

      // Mock contract calls
    });
    describe(`Reject Transfers Holder with ethers version ${ethersVersion}`, () => {
      it('should reject transfer holder with signer and all required parameters', async () => {
        const result = await rejectTransferHolder(
          {
            tokenRegistryAddress: mockTokenRegistryAddress,
            tokenId: mockTokenId,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual('v5_reject_transfer_holder_tx_hash');
      });

      it('should reject transfer holder when titleEscrowAddress is provided', async () => {
        const result = await rejectTransferHolder(
          {
            titleEscrowAddress: mockTitleEscrowAddress,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual('v5_reject_transfer_holder_tx_hash');
        expect(coreModule.getTitleEscrowAddress).not.toHaveBeenCalled();
      });

      it('should reject transfer holder without remarks', async () => {
        const result = await rejectTransferHolder(
          {
            tokenRegistryAddress: mockTokenRegistryAddress,
            tokenId: mockTokenId,
          },
          wallet,
          {},
          { chainId: mockChainId },
        );

        expect(result).toEqual('v5_reject_transfer_holder_tx_hash');
        expect(coreModule.encrypt).not.toHaveBeenCalled();
      });

      it('should throw error when tokenRegistryAddress is missing', async () => {
        vi.mocked(coreModule.getTitleEscrowAddress).mockResolvedValue(undefined);
        await expect(
          rejectTransferHolder(
            {
              tokenId: mockTokenId,
            } as any,
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Token registry address is required');
      });

      it('should throw error when provider is missing', async () => {
        const signerWithoutProvider = new WalletV5('0x'.padEnd(66, '1'));

        await expect(
          rejectTransferHolder(
            {
              tokenRegistryAddress: mockTokenRegistryAddress,
              tokenId: mockTokenId,
            },
            signerWithoutProvider,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw error when title escrow is not V5', async () => {
        vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(false);

        await expect(
          rejectTransferHolder(
            {
              tokenRegistryAddress: mockTokenRegistryAddress,
              tokenId: mockTokenId,
            },
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Only Token Registry V5 is supported');
      });

      it('should throw error when callStatic fails', async () => {
        mockV5TitleEscrowContract.callStatic.rejectTransferHolder.mockRejectedValue(
          new Error('Simulated failure'),
        );
        mockV5TitleEscrowContract.rejectTransferHolder.staticCall.mockRejectedValue(
          new Error('Simulated failure'),
        );

        await expect(
          rejectTransferHolder(
            {
              tokenRegistryAddress: mockTokenRegistryAddress,
              tokenId: mockTokenId,
            },
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Pre-check (callStatic) for rejectTransferHolder failed');
        mockV5TitleEscrowContract.callStatic.rejectTransferHolder = vi.fn();
        mockV5TitleEscrowContract.rejectTransferHolder.staticCall = vi.fn();
      });

      it('should use explicit titleEscrowVersion when provided', async () => {
        await rejectTransferHolder(
          {
            tokenRegistryAddress: mockTokenRegistryAddress,
            tokenId: mockTokenId,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id', titleEscrowVersion },
        );

        expect(coreModule.isTitleEscrowVersion).not.toHaveBeenCalled();
      });
    });

    describe(`Reject Transfers Beneficiary with ethers version ${ethersVersion}`, () => {
      it('should reject transfer beneficiary with signer and all required parameters', async () => {
        const result = await rejectTransferBeneficiary(
          {
            tokenRegistryAddress: mockTokenRegistryAddress,
            tokenId: mockTokenId,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual('v5_reject_transfer_beneficiary_tx_hash');
      });

      it('should reject transfer beneficiary when titleEscrowAddress is provided', async () => {
        const result = await rejectTransferBeneficiary(
          {
            titleEscrowAddress: mockTitleEscrowAddress,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual('v5_reject_transfer_beneficiary_tx_hash');
        expect(coreModule.getTitleEscrowAddress).not.toHaveBeenCalled();
      });

      it('should reject transfer beneficiary without remarks', async () => {
        const result = await rejectTransferBeneficiary(
          {
            tokenRegistryAddress: mockTokenRegistryAddress,
            tokenId: mockTokenId,
          },
          wallet,
          {},
          { chainId: mockChainId },
        );

        expect(result).toEqual('v5_reject_transfer_beneficiary_tx_hash');
        expect(coreModule.encrypt).not.toHaveBeenCalled();
      });

      it('should throw error when tokenRegistryAddress is missing', async () => {
        vi.mocked(coreModule.getTitleEscrowAddress).mockResolvedValue(undefined);
        await expect(
          rejectTransferBeneficiary(
            {
              tokenId: mockTokenId,
            } as any,
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Token registry address is required');
      });

      it('should throw error when provider is missing', async () => {
        const signerWithoutProvider = new WalletV5('0x'.padEnd(66, '1'));

        await expect(
          rejectTransferBeneficiary(
            {
              tokenRegistryAddress: mockTokenRegistryAddress,
              tokenId: mockTokenId,
            },
            signerWithoutProvider,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw error when title escrow is not V5', async () => {
        vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(false);

        await expect(
          rejectTransferBeneficiary(
            {
              tokenRegistryAddress: mockTokenRegistryAddress,
              tokenId: mockTokenId,
            },
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Only Token Registry V5 is supported');
      });

      it('should throw error when callStatic fails', async () => {
        mockV5TitleEscrowContract.callStatic.rejectTransferBeneficiary.mockRejectedValue(
          new Error('Simulated failure'),
        );
        mockV5TitleEscrowContract.rejectTransferBeneficiary.staticCall.mockRejectedValue(
          new Error('Simulated failure'),
        );
        await expect(
          rejectTransferBeneficiary(
            {
              tokenRegistryAddress: mockTokenRegistryAddress,
              tokenId: mockTokenId,
            },
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Pre-check (callStatic) for rejectTransferBeneficiary failed');
        mockV5TitleEscrowContract.callStatic.rejectTransferBeneficiary = vi.fn();
        mockV5TitleEscrowContract.rejectTransferBeneficiary.staticCall = vi.fn();
      });

      it('should use explicit titleEscrowVersion when provided', async () => {
        await rejectTransferBeneficiary(
          {
            tokenRegistryAddress: mockTokenRegistryAddress,
            tokenId: mockTokenId,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id', titleEscrowVersion },
        );

        expect(coreModule.isTitleEscrowVersion).not.toHaveBeenCalled();
      });
    });

    describe(`Reject Transfers Owners with ethers version ${ethersVersion}`, () => {
      it('should reject transfer beneficiary with signer and all required parameters', async () => {
        const result = await rejectTransferOwners(
          {
            tokenRegistryAddress: mockTokenRegistryAddress,
            tokenId: mockTokenId,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual('v5_reject_transfer_owners_tx_hash');
      });

      it('should reject transfer beneficiary when titleEscrowAddress is provided', async () => {
        const result = await rejectTransferOwners(
          {
            titleEscrowAddress: mockTitleEscrowAddress,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id' },
        );

        expect(result).toEqual('v5_reject_transfer_owners_tx_hash');
        expect(coreModule.getTitleEscrowAddress).not.toHaveBeenCalled();
      });

      it('should reject transfer beneficiary without remarks', async () => {
        const result = await rejectTransferOwners(
          {
            tokenRegistryAddress: mockTokenRegistryAddress,
            tokenId: mockTokenId,
          },
          wallet,
          {},
          { chainId: mockChainId },
        );

        expect(result).toEqual('v5_reject_transfer_owners_tx_hash');
        expect(coreModule.encrypt).not.toHaveBeenCalled();
      });

      it('should throw error when tokenRegistryAddress is missing', async () => {
        vi.mocked(coreModule.getTitleEscrowAddress).mockResolvedValue(undefined);
        await expect(
          rejectTransferOwners(
            {
              tokenId: mockTokenId,
            } as any,
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Token registry address is required');
      });

      it('should throw error when provider is missing', async () => {
        const signerWithoutProvider = new WalletV5('0x'.padEnd(66, '1'));

        await expect(
          rejectTransferOwners(
            {
              tokenRegistryAddress: mockTokenRegistryAddress,
              tokenId: mockTokenId,
            },
            signerWithoutProvider,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw error when title escrow is not V5', async () => {
        vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(false);

        await expect(
          rejectTransferOwners(
            {
              tokenRegistryAddress: mockTokenRegistryAddress,
              tokenId: mockTokenId,
            },
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Only Token Registry V5 is supported');
      });

      it('should throw error when callStatic fails', async () => {
        mockV5TitleEscrowContract.callStatic.rejectTransferOwners.mockRejectedValue(
          new Error('Simulated failure'),
        );
        mockV5TitleEscrowContract.rejectTransferOwners.staticCall.mockRejectedValue(
          new Error('Simulated failure'),
        );

        await expect(
          rejectTransferOwners(
            {
              tokenRegistryAddress: mockTokenRegistryAddress,
              tokenId: mockTokenId,
            },
            wallet,
            { remarks: mockRemarks },
            { chainId: mockChainId, id: 'encryption-id' },
          ),
        ).rejects.toThrow('Pre-check (callStatic) for rejectTransferOwners failed');
        mockV5TitleEscrowContract.callStatic.rejectTransferOwners = vi.fn();
        mockV5TitleEscrowContract.rejectTransferOwners.staticCall = vi.fn();
      });

      it('should use explicit titleEscrowVersion when provided', async () => {
        await rejectTransferOwners(
          {
            tokenRegistryAddress: mockTokenRegistryAddress,
            tokenId: mockTokenId,
          },
          wallet,
          { remarks: mockRemarks },
          { chainId: mockChainId, id: 'encryption-id', titleEscrowVersion },
        );

        expect(coreModule.isTitleEscrowVersion).not.toHaveBeenCalled();
      });
    });
  },
);
