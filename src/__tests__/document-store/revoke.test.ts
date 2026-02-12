import './fixtures';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { Wallet as WalletV6, Network, ethers as ethersV6 } from 'ethersV6';
import * as coreModule from '../../core';

import { documentStoreRevoke } from '../../document-store/revoke';
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

describe('Revoke Document', () => {
  const mockDocumentHash = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const mockChainId = CHAIN_ID.local;

  describe.each(providers)(
    'Revoke Document with $contractType and ethers version $ethersVersion',
    ({ Provider, ethersVersion, contractType }) => {
      const isTransferable = contractType === 'TransferableDocumentStore';
      const mockContract = isTransferable
        ? mockTransferableDocumentStoreContract
        : mockDocumentStoreContract;
      const mockTxResponse = isTransferable
        ? 'transferable_document_store_revoke_tx_hash'
        : 'document_store_revoke_tx_hash';

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

      // beforeAll(() => {
      //   vi.clearAllMocks();
      //   const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
      //   vi.mocked(getEthersContractFromProvider).mockReturnValue(
      //     mockContractConstructor(mockContract),
      //   );
      // });

      beforeEach(() => {
        vi.clearAllMocks();
        const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockContract),
        );
        vi.spyOn(coreModule, 'checkSupportsInterface').mockImplementation(
          async (address, interfaceId) => {
            if (isTransferable) {
              return interfaceId === supportInterfaceIds.ITransferableDocumentStore;
            }
            return interfaceId === supportInterfaceIds.IDocumentStore;
          },
        );
        mockContract.callStatic.revoke.mockResolvedValue(true);
        mockContract.revoke.staticCall.mockResolvedValue(true);
      });

      it('should revoke document hash successfully', async () => {
        const result = await documentStoreRevoke(
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

      it('should revoke document with explicit contract type', async () => {
        const result = await documentStoreRevoke(
          mockDocumentStoreAddress,
          mockDocumentHash,
          wallet,
          {
            chainId: mockChainId,
            isTransferable,
          },
        );
        expect(result).toEqual(mockTxResponse);
        expect(coreModule.checkSupportsInterface).not.toHaveBeenCalled();
      });

      it('should revoke document without chainId option', async () => {
        const result = await documentStoreRevoke(
          mockDocumentStoreAddress,
          mockDocumentHash,
          wallet,
          {
            isTransferable,
          },
        );
        expect(result).toEqual(mockTxResponse);
      });

      it('should revoke document with gas options', async () => {
        const result = await documentStoreRevoke(
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
          documentStoreRevoke('', mockDocumentHash, wallet, { chainId: mockChainId }),
        ).rejects.toThrow('Document store address is required');
      });

      it('should throw when provider is missing', async () => {
        const signerWithoutProvider = new (ethersVersion === 'v5' ? WalletV5 : WalletV6)(
          '0x'.padEnd(66, '1'),
        );
        await expect(
          documentStoreRevoke(mockDocumentStoreAddress, mockDocumentHash, signerWithoutProvider, {
            chainId: mockChainId,
          }),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw when document hash is missing', async () => {
        await expect(
          documentStoreRevoke(mockDocumentStoreAddress, '', wallet, { chainId: mockChainId }),
        ).rejects.toThrow('Document hash is required');
      });

      it('should throw when callStatic fails', async () => {
        const mockError = new Error('callStatic error');
        mockContract.callStatic.revoke.mockRejectedValue(mockError);
        mockContract.revoke.staticCall.mockRejectedValue(mockError);
        await expect(
          documentStoreRevoke(mockDocumentStoreAddress, mockDocumentHash, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for revoke failed');
      });

      it('should fallback to TT Document Store when ERC-165 interfaces not supported', async () => {
        vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
        const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockTTDocumentStoreContract),
        );
        const result = await documentStoreRevoke(
          mockDocumentStoreAddress,
          mockDocumentHash,
          wallet,

          {
            chainId: mockChainId,
          },
        );
        expect(result).toBeDefined();
        expect(coreModule.checkSupportsInterface).toHaveBeenCalledTimes(2);
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockContract),
        );
      });

      it('should handle invalid document hash format gracefully', async () => {
        const invalidHash = '0xinvalid';
        mockContract.callStatic.revoke.mockRejectedValue(new Error('Invalid hash format'));
        mockContract.revoke.staticCall.mockRejectedValue(new Error('Invalid hash format'));
        await expect(
          documentStoreRevoke(mockDocumentStoreAddress, invalidHash, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for revoke failed');
      });

      it('should handle already revoked document', async () => {
        mockContract.callStatic.revoke.mockRejectedValue(new Error('Document already revoked'));
        mockContract.revoke.staticCall.mockRejectedValue(new Error('Document already revoked'));
        await expect(
          documentStoreRevoke(mockDocumentStoreAddress, mockDocumentHash, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for revoke failed');
      });

      it('should work with different document hash formats', async () => {
        const differentHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        const result = await documentStoreRevoke(mockDocumentStoreAddress, differentHash, wallet, {
          chainId: mockChainId,
          isTransferable,
        });
        expect(result).toEqual(mockTxResponse);
      });
    },
  );

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
      mockTTDocumentStoreContract.callStatic.revoke.mockResolvedValue(true);
      mockTTDocumentStoreContract.revoke.staticCall.mockResolvedValue(true);
    });

    it('should auto-detect TT Document Store as fallback when ERC-165 interfaces not supported', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await documentStoreRevoke(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockDocumentHash,
        wallet,
        {
          chainId: mockChainId,
        },
      );
      expect(result).toEqual('tt_document_store_revoke_tx_hash');
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

    it('should revoke document with TT Document Store (ethers v5)', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await documentStoreRevoke(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockDocumentHash,
        wallet,
        {
          chainId: mockChainId,
        },
      );
      expect(result).toEqual('tt_document_store_revoke_tx_hash');
    });

    it('should revoke document with TT Document Store (ethers v6)', async () => {
      const walletV6 = new WalletV6(PRIVATE_KEY, providerV6 as any);
      vi.spyOn(providerV6, 'getNetwork').mockResolvedValue({
        chainId: mockChainId,
      } as unknown as Network);
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await documentStoreRevoke(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockDocumentHash,
        walletV6,
        {
          chainId: mockChainId,
        },
      );
      expect(result).toEqual('tt_document_store_revoke_tx_hash');
    });

    it('should handle callStatic failure for TT Document Store', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const mockError = new Error('TT callStatic error');
      mockTTDocumentStoreContract.callStatic.revoke.mockRejectedValue(mockError);
      mockTTDocumentStoreContract.revoke.staticCall.mockRejectedValue(mockError);
      await expect(
        documentStoreRevoke(MOCK_TT_DOCUMENT_STORE_ADDRESS, mockDocumentHash, wallet, {
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Pre-check (callStatic) for revoke failed');
    });

    it('should revoke TT Document Store with gas options', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await documentStoreRevoke(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockDocumentHash,
        wallet,
        {
          chainId: mockChainId,
          maxFeePerGas: '2000000000',
          maxPriorityFeePerGas: '1500000000',
        },
      );
      expect(result).toEqual('tt_document_store_revoke_tx_hash');
    });

    it('should handle already revoked document in TT Document Store', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      mockTTDocumentStoreContract.callStatic.revoke.mockRejectedValue(
        new Error('Document already revoked'),
      );
      mockTTDocumentStoreContract.revoke.staticCall.mockRejectedValue(
        new Error('Document already revoked'),
      );
      await expect(
        documentStoreRevoke(MOCK_TT_DOCUMENT_STORE_ADDRESS, mockDocumentHash, wallet, {
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Pre-check (callStatic) for revoke failed');
    });
  });
});
