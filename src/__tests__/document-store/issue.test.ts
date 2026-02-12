import './fixtures';
import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { Wallet as WalletV6, Network, ethers as ethersV6 } from 'ethersV6';
import * as coreModule from '../../core';

import { documentStoreIssue } from '../../document-store/issue';
import {
  MOCK_DOCUMENT_STORE_ADDRESS,
  MOCK_TRANSFERABLE_DOCUMENT_STORE_ADDRESS,
  MOCK_TT_DOCUMENT_STORE_ADDRESS,
  mockDocumentStoreContract,
  mockTransferableDocumentStoreContract,
  mockTTDocumentStoreContract,
  PRIVATE_KEY,
  providerV5,
  providerV6,
} from './fixtures';
import { getEthersContractFromProvider } from '../../utils/ethers';
import { CHAIN_ID } from '../../utils';
import { supportInterfaceIds } from '../../document-store/supportInterfaceIds';

interface ProviderInfo {
  Provider: any;
  ethersVersion: 'v5' | 'v6';
  contractType: 'DocumentStore' | 'TransferableDocumentStore';
}

const providers: ProviderInfo[] = [
  {
    Provider: providerV5,
    ethersVersion: 'v5',
    contractType: 'DocumentStore',
  },
  {
    Provider: providerV5,
    ethersVersion: 'v5',
    contractType: 'TransferableDocumentStore',
  },
  {
    Provider: providerV6,
    ethersVersion: 'v6',
    contractType: 'DocumentStore',
  },
  {
    Provider: providerV6,
    ethersVersion: 'v6',
    contractType: 'TransferableDocumentStore',
  },
];

describe('Issue Document', () => {
  const mockDocumentHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const mockChainId = CHAIN_ID.local;

  describe.each(providers)(
    'Issue Document with $contractType and ethers version $ethersVersion',
    ({ Provider, ethersVersion, contractType }) => {
      const isTransferable = contractType === 'TransferableDocumentStore';
      const mockContract = isTransferable
        ? mockTransferableDocumentStoreContract
        : mockDocumentStoreContract;
      const mockTxResponse = isTransferable
        ? 'transferable_document_store_issue_tx_hash'
        : 'document_store_issue_tx_hash';

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

      const mockDocumentStoreAddress = isTransferable
        ? MOCK_TRANSFERABLE_DOCUMENT_STORE_ADDRESS
        : MOCK_DOCUMENT_STORE_ADDRESS;

      beforeAll(() => {
        // Clear any existing mocks first
        vi.clearAllMocks();
        const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
        // Only set up the mock if it hasn't been set up yet
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockContract),
        );
      });

      beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(coreModule, 'checkSupportsInterface').mockImplementation(
          async (address, interfaceId) => {
            if (isTransferable) {
              return interfaceId === supportInterfaceIds.ITransferableDocumentStore;
            }
            return interfaceId === supportInterfaceIds.IDocumentStore;
          },
        );
        mockContract.callStatic.issue.mockResolvedValue(true);
        mockContract.issue.staticCall.mockResolvedValue(true);
      });

      it('should issue document hash successfully', async () => {
        const result = await documentStoreIssue(
          mockDocumentStoreAddress,

          mockDocumentHash,
          wallet,
          {
            chainId: mockChainId,
          },
        );

        expect(result).toEqual(mockTxResponse);
        expect(coreModule.checkSupportsInterface).toHaveBeenCalled();
      });

      it('should issue document with explicit contract type', async () => {
        const result = await documentStoreIssue(
          mockDocumentStoreAddress,

          mockDocumentHash,
          wallet,
          {
            chainId: mockChainId,
            isTransferable,
          },
        );

        expect(result).toEqual(mockTxResponse);
        // Should not check interface when explicitly provided
        expect(coreModule.checkSupportsInterface).not.toHaveBeenCalled();
      });

      it('should issue document without chainId option', async () => {
        const result = await documentStoreIssue(
          mockDocumentStoreAddress,

          mockDocumentHash,
          wallet,
          {
            isTransferable,
          },
        );

        expect(result).toEqual(mockTxResponse);
      });

      it('should issue document with gas options', async () => {
        const result = await documentStoreIssue(
          mockDocumentStoreAddress,

          mockDocumentHash,
          wallet,
          {
            chainId: mockChainId,
            maxFeePerGas: '1000000000',
            maxPriorityFeePerGas: '1000000000',
            isTransferable,
          },
        );

        expect(result).toEqual(mockTxResponse);
      });

      it('should throw when document store address is missing', async () => {
        await expect(
          documentStoreIssue('', mockDocumentHash, wallet, { chainId: mockChainId }),
        ).rejects.toThrow('Document store address is required');
      });

      it('should throw when provider is missing', async () => {
        const signerWithoutProvider = new WalletV5('0x'.padEnd(66, '1'));

        await expect(
          documentStoreIssue(mockDocumentStoreAddress, mockDocumentHash, signerWithoutProvider, {
            chainId: mockChainId,
          }),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw when document hash is missing', async () => {
        await expect(
          documentStoreIssue(mockDocumentStoreAddress, '', wallet, { chainId: mockChainId }),
        ).rejects.toThrow('Document hash is required');
      });

      it('should throw when callStatic fails', async () => {
        const mockError = new Error('callStatic error');
        mockContract.callStatic.issue.mockRejectedValue(mockError);
        mockContract.issue.staticCall.mockRejectedValue(mockError);

        await expect(
          documentStoreIssue(mockDocumentStoreAddress, mockDocumentHash, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for issue failed');
      });

      it('should fallback to TT Document Store when ERC-165 interfaces not supported', async () => {
        // When checkSupportsInterface returns false, it should fallback to TT Document Store
        vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

        // Mock the contract to use TT Document Store
        const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockTTDocumentStoreContract),
        );

        const result = await documentStoreIssue(
          mockDocumentStoreAddress,

          mockDocumentHash,
          wallet,
          {
            chainId: mockChainId,
          },
        );

        // Should successfully issue using TT Document Store as fallback
        expect(result).toBeDefined();
        expect(coreModule.checkSupportsInterface).toHaveBeenCalledTimes(2);
      });

      it('should handle invalid document hash format gracefully', async () => {
        const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockContract),
        );
        const invalidHash = '0xinvalid';
        mockContract.callStatic.issue.mockRejectedValue(new Error('Invalid hash format'));
        mockContract.issue.staticCall.mockRejectedValue(new Error('Invalid hash format'));

        await expect(
          documentStoreIssue(mockDocumentStoreAddress, invalidHash, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for issue failed');
      });

      it('should handle already issued document', async () => {
        mockContract.callStatic.issue.mockRejectedValue(new Error('Document already issued'));
        mockContract.issue.staticCall.mockRejectedValue(new Error('Document already issued'));

        await expect(
          documentStoreIssue(mockDocumentStoreAddress, mockDocumentHash, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for issue failed');
      });

      it('should work with different document hash formats', async () => {
        const differentHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        const result = await documentStoreIssue(mockDocumentStoreAddress, differentHash, wallet, {
          chainId: mockChainId,
          isTransferable,
        });

        expect(result).toEqual(mockTxResponse);
      });
    },
  );

  describe('Contract Type Detection', () => {
    let wallet: ethersV5.Wallet;

    beforeEach(() => {
      vi.clearAllMocks();
      wallet = new WalletV5(PRIVATE_KEY, providerV5 as any);
      vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);

      const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
      vi.mocked(getEthersContractFromProvider).mockReturnValue(
        mockContractConstructor(mockDocumentStoreContract),
      );

      mockDocumentStoreContract.callStatic.issue.mockResolvedValue(true);
      mockDocumentStoreContract.issue.staticCall.mockResolvedValue(true);
    });

    it('should auto-detect DocumentStore interface', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockImplementation(
        async (address, interfaceId) => {
          return interfaceId === supportInterfaceIds.IDocumentStore;
        },
      );

      const result = await documentStoreIssue(
        MOCK_DOCUMENT_STORE_ADDRESS,

        mockDocumentHash,
        wallet,
        {
          chainId: mockChainId,
        },
      );

      expect(result).toEqual('document_store_issue_tx_hash');
      expect(coreModule.checkSupportsInterface).toHaveBeenCalledWith(
        MOCK_DOCUMENT_STORE_ADDRESS,
        supportInterfaceIds.IDocumentStore,
        wallet.provider,
      );
    });

    it('should auto-detect TransferableDocumentStore interface', async () => {
      const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
      vi.mocked(getEthersContractFromProvider).mockReturnValue(
        mockContractConstructor(mockTransferableDocumentStoreContract),
      );

      mockTransferableDocumentStoreContract.callStatic.issue.mockResolvedValue(true);
      mockTransferableDocumentStoreContract.issue.staticCall.mockResolvedValue(true);

      vi.spyOn(coreModule, 'checkSupportsInterface').mockImplementation(
        async (address, interfaceId) => {
          return interfaceId === supportInterfaceIds.ITransferableDocumentStore;
        },
      );

      const result = await documentStoreIssue(
        MOCK_TRANSFERABLE_DOCUMENT_STORE_ADDRESS,

        mockDocumentHash,
        wallet,
        {
          chainId: mockChainId,
        },
      );

      expect(result).toEqual('transferable_document_store_issue_tx_hash');
      expect(coreModule.checkSupportsInterface).toHaveBeenCalledWith(
        MOCK_TRANSFERABLE_DOCUMENT_STORE_ADDRESS,
        supportInterfaceIds.ITransferableDocumentStore,
        wallet.provider,
      );
    });

    it('should prioritize TransferableDocumentStore when both interfaces are supported', async () => {
      const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
      vi.mocked(getEthersContractFromProvider).mockReturnValue(
        mockContractConstructor(mockTransferableDocumentStoreContract),
      );

      mockTransferableDocumentStoreContract.callStatic.issue.mockResolvedValue(true);
      mockTransferableDocumentStoreContract.issue.staticCall.mockResolvedValue(true);

      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(true);

      const result = await documentStoreIssue(
        MOCK_TRANSFERABLE_DOCUMENT_STORE_ADDRESS,

        mockDocumentHash,
        wallet,
        {
          chainId: mockChainId,
        },
      );

      expect(result).toEqual('transferable_document_store_issue_tx_hash');
    });
  });

  describe('TT Document Store (Fallback)', () => {
    let wallet: ethersV5.Wallet;

    beforeEach(() => {
      vi.clearAllMocks();
      wallet = new WalletV5(PRIVATE_KEY, providerV5 as any);
      vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);

      const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
      vi.mocked(getEthersContractFromProvider).mockReturnValue(
        mockContractConstructor(mockTTDocumentStoreContract),
      );

      mockTTDocumentStoreContract.callStatic.issue.mockResolvedValue(true);
      mockTTDocumentStoreContract.issue.staticCall.mockResolvedValue(true);
    });

    it('should auto-detect TT Document Store as fallback when ERC-165 interfaces not supported', async () => {
      // Mock checkSupportsInterface to return false for both DocumentStore and TransferableDocumentStore
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

      const result = await documentStoreIssue(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,

        mockDocumentHash,
        wallet,
        {
          chainId: mockChainId,
        },
      );

      expect(result).toEqual('tt_document_store_issue_tx_hash');
      // Should check both interfaces before falling back
      expect(coreModule.checkSupportsInterface).toHaveBeenCalledWith(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        supportInterfaceIds.IDocumentStore,
        wallet.provider,
      );
      expect(coreModule.checkSupportsInterface).toHaveBeenCalledWith(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        supportInterfaceIds.ITransferableDocumentStore,
        wallet.provider,
      );
    });

    it('should issue document with TT Document Store (ethers v5)', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

      const result = await documentStoreIssue(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,

        mockDocumentHash,
        wallet,
        {
          chainId: mockChainId,
        },
      );

      expect(result).toEqual('tt_document_store_issue_tx_hash');
    });

    it('should issue document with TT Document Store (ethers v6)', async () => {
      const walletV6 = new WalletV6(PRIVATE_KEY, providerV6 as any);
      vi.spyOn(providerV6, 'getNetwork').mockResolvedValue({
        chainId: mockChainId,
      } as unknown as Network);

      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

      const result = await documentStoreIssue(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,

        mockDocumentHash,
        walletV6,
        {
          chainId: mockChainId,
        },
      );

      expect(result).toEqual('tt_document_store_issue_tx_hash');
    });

    it('should handle callStatic failure for TT Document Store', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

      const mockError = new Error('TT callStatic error');
      mockTTDocumentStoreContract.callStatic.issue.mockRejectedValue(mockError);
      mockTTDocumentStoreContract.issue.staticCall.mockRejectedValue(mockError);

      await expect(
        documentStoreIssue(MOCK_TT_DOCUMENT_STORE_ADDRESS, mockDocumentHash, wallet, {
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Pre-check (callStatic) for issue failed');
    });

    it('should issue TT Document Store with gas options', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

      const result = await documentStoreIssue(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockDocumentHash,
        wallet,
        {
          chainId: mockChainId,
          maxFeePerGas: '2000000000',
          maxPriorityFeePerGas: '1500000000',
        },
      );

      expect(result).toEqual('tt_document_store_issue_tx_hash');
    });

    it('should handle already issued document in TT Document Store', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

      mockTTDocumentStoreContract.callStatic.issue.mockRejectedValue(
        new Error('Document already issued'),
      );
      mockTTDocumentStoreContract.issue.staticCall.mockRejectedValue(
        new Error('Document already issued'),
      );

      await expect(
        documentStoreIssue(MOCK_TT_DOCUMENT_STORE_ADDRESS, mockDocumentHash, wallet, {
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Pre-check (callStatic) for issue failed');
    });
  });
});
