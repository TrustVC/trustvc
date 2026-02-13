import './fixtures';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { Wallet as WalletV6, Network, ethers as ethersV6 } from 'ethersV6';
import * as coreModule from '../../core';

import { documentStoreGrantRole } from '../../document-store/grant-role';
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

describe('Grant Document Store Role', () => {
  const mockRole = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const mockAccount = '0x1234567890123456789012345678901234567890';
  const mockChainId = CHAIN_ID.local;

  describe.each(providers)(
    'Grant role with $contractType and ethers version $ethersVersion',
    async ({ Provider, ethersVersion, contractType }) => {
      const isTransferable = contractType === 'TransferableDocumentStore';
      const mockContract = isTransferable
        ? mockTransferableDocumentStoreContract
        : mockDocumentStoreContract;
      const mockTxResponse = isTransferable
        ? 'transferable_document_store_grant_role_tx_hash'
        : 'document_store_grant_role_tx_hash';

      const mockDocumentStoreAddress = isTransferable
        ? MOCK_TRANSFERABLE_DOCUMENT_STORE_ADDRESS
        : MOCK_DOCUMENT_STORE_ADDRESS;

      let wallet: ethersV5.Wallet | ethersV6.Wallet;

      beforeAll(() => {
        const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
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
        mockContract.callStatic.grantRole.mockResolvedValue(true);
        mockContract.grantRole.staticCall.mockResolvedValue(true);

        if (ethersVersion === 'v5') {
          wallet = new WalletV5(PRIVATE_KEY, Provider as any) as ethersV5.Wallet;
          vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);
        } else {
          wallet = new WalletV6(PRIVATE_KEY, Provider as any);
          vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
            chainId: mockChainId,
          } as unknown as Network);
        }
      });

      it('should grant role successfully', async () => {
        const result = await documentStoreGrantRole(
          mockDocumentStoreAddress,
          mockRole,
          mockAccount,
          wallet,
          {
            chainId: mockChainId,
          },
        );
        expect(result).toEqual(mockTxResponse);
        expect(coreModule.checkSupportsInterface).toHaveBeenCalled();
      });

      it('should grant role with explicit contract type', async () => {
        const result = await documentStoreGrantRole(
          mockDocumentStoreAddress,
          mockRole,
          mockAccount,
          wallet,
          {
            chainId: mockChainId,
            isTransferable,
          },
        );
        expect(result).toEqual(mockTxResponse);
        expect(coreModule.checkSupportsInterface).not.toHaveBeenCalled();
      });

      it('should grant role without chainId option', async () => {
        const result = await documentStoreGrantRole(
          mockDocumentStoreAddress,
          mockRole,
          mockAccount,
          wallet,
          {
            isTransferable,
          },
        );
        expect(result).toEqual(mockTxResponse);
      });

      it('should grant role with gas options', async () => {
        const result = await documentStoreGrantRole(
          mockDocumentStoreAddress,
          mockRole,
          mockAccount,
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
          documentStoreGrantRole('', mockRole, mockAccount, wallet, { chainId: mockChainId }),
        ).rejects.toThrow('Document store address is required');
      });

      it('should throw when provider is missing', async () => {
        const signerWithoutProvider = new (ethersVersion === 'v5' ? WalletV5 : WalletV6)(
          '0x'.padEnd(66, '1'),
        );
        await expect(
          documentStoreGrantRole(
            mockDocumentStoreAddress,
            mockRole,
            mockAccount,
            signerWithoutProvider,
            {
              chainId: mockChainId,
            },
          ),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw when role is missing', async () => {
        await expect(
          documentStoreGrantRole(mockDocumentStoreAddress, '', mockAccount, wallet, {
            chainId: mockChainId,
          }),
        ).rejects.toThrow('Role is required');
      });

      it('should throw when account is missing', async () => {
        await expect(
          documentStoreGrantRole(mockDocumentStoreAddress, mockRole, '', wallet, {
            chainId: mockChainId,
          }),
        ).rejects.toThrow('Account is required');
      });

      it('should throw when callStatic fails', async () => {
        const mockError = new Error('callStatic error');
        mockContract.callStatic.grantRole.mockRejectedValue(mockError);
        mockContract.grantRole.staticCall.mockRejectedValue(mockError);
        await expect(
          documentStoreGrantRole(mockDocumentStoreAddress, mockRole, mockAccount, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for grant-role failed');
      });

      it('should fallback to TT Document Store when ERC-165 interfaces not supported', async () => {
        vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
        const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockContract),
        );
        const result = await documentStoreGrantRole(
          mockDocumentStoreAddress,
          mockRole,
          mockAccount,
          wallet,
          {
            chainId: mockChainId,
          },
        );
        expect(result).toBeDefined();
        expect(coreModule.checkSupportsInterface).toHaveBeenCalledTimes(2);
      });

      it('should handle invalid role format gracefully', async () => {
        const invalidRole = 'invalid-role';
        mockContract.callStatic.grantRole.mockRejectedValue(new Error('Invalid role format'));
        mockContract.grantRole.staticCall.mockRejectedValue(new Error('Invalid role format'));
        await expect(
          documentStoreGrantRole(mockDocumentStoreAddress, invalidRole, mockAccount, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for grant-role failed');
      });

      it('should handle already granted role', async () => {
        mockContract.callStatic.grantRole.mockRejectedValue(new Error('Role already granted'));
        mockContract.grantRole.staticCall.mockRejectedValue(new Error('Role already granted'));
        await expect(
          documentStoreGrantRole(mockDocumentStoreAddress, mockRole, mockAccount, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for grant-role failed');
      });

      it('should work with different role and account addresses', async () => {
        const differentRole = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
        const differentAccount = '0x9876543210987654321098765432109876543210';
        const result = await documentStoreGrantRole(
          mockDocumentStoreAddress,
          differentRole,
          differentAccount,
          wallet,
          {
            chainId: mockChainId,
            isTransferable,
          },
        );
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
      mockTTDocumentStoreContract.callStatic.grantRole.mockResolvedValue(true);
      mockTTDocumentStoreContract.grantRole.staticCall.mockResolvedValue(true);
    });

    it('should auto-detect TT Document Store as fallback when ERC-165 interfaces not supported', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await documentStoreGrantRole(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockRole,
        mockAccount,
        wallet,
        {
          chainId: mockChainId,
        },
      );
      expect(result).toEqual('tt_document_store_grant_role_tx_hash');
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

    it('should grant role with TT Document Store (ethers v5)', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await documentStoreGrantRole(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockRole,
        mockAccount,
        wallet,
        {
          chainId: mockChainId,
        },
      );
      expect(result).toEqual('tt_document_store_grant_role_tx_hash');
    });

    it('should grant role with TT Document Store (ethers v6)', async () => {
      const walletV6 = new WalletV6(PRIVATE_KEY, providerV6 as any);
      vi.spyOn(providerV6, 'getNetwork').mockResolvedValue({
        chainId: mockChainId,
      } as unknown as Network);
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await documentStoreGrantRole(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockRole,
        mockAccount,
        walletV6,
        {
          chainId: mockChainId,
        },
      );
      expect(result).toEqual('tt_document_store_grant_role_tx_hash');
    });

    it('should handle callStatic failure for TT Document Store', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const mockError = new Error('TT callStatic error');
      mockTTDocumentStoreContract.callStatic.grantRole.mockRejectedValue(mockError);
      mockTTDocumentStoreContract.grantRole.staticCall.mockRejectedValue(mockError);
      await expect(
        documentStoreGrantRole(MOCK_TT_DOCUMENT_STORE_ADDRESS, mockRole, mockAccount, wallet, {
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Pre-check (callStatic) for grant-role failed');
    });

    it('should grant role TT Document Store with gas options', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await documentStoreGrantRole(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockRole,
        mockAccount,
        wallet,
        {
          chainId: mockChainId,
          maxFeePerGas: '2000000000',
          maxPriorityFeePerGas: '1500000000',
        },
      );
      expect(result).toEqual('tt_document_store_grant_role_tx_hash');
    });

    it('should handle already granted role in TT Document Store', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      mockTTDocumentStoreContract.callStatic.grantRole.mockRejectedValue(
        new Error('Role already granted'),
      );
      mockTTDocumentStoreContract.grantRole.staticCall.mockRejectedValue(
        new Error('Role already granted'),
      );
      await expect(
        documentStoreGrantRole(MOCK_TT_DOCUMENT_STORE_ADDRESS, mockRole, mockAccount, wallet, {
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Pre-check (callStatic) for grant-role failed');
    });
  });
});
