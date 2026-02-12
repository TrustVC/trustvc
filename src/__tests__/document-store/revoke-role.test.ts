import './fixtures';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { Wallet as WalletV6, Network, ethers as ethersV6 } from 'ethersV6';
import * as coreModule from '../../core';

import { revokeDocumentStoreRole } from '../../document-store/revoke-role';
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

describe('Revoke Document Store Role', () => {
  const mockRole = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const mockAccount = '0x1234567890123456789012345678901234567890';
  const mockChainId = CHAIN_ID.local;

  describe.each(providers)(
    'Revoke role with $contractType and ethers version $ethersVersion',
    async ({ Provider, ethersVersion, contractType }) => {
      const isTransferable = contractType === 'TransferableDocumentStore';
      const mockContract = isTransferable
        ? mockTransferableDocumentStoreContract
        : mockDocumentStoreContract;
      const mockTxResponse = isTransferable
        ? 'transferable_document_store_revoke_role_tx_hash'
        : 'document_store_revoke_role_tx_hash';

      let wallet: ethersV5.Wallet | ethersV6.Wallet;

      const mockDocumentStoreAddress = isTransferable
        ? MOCK_TRANSFERABLE_DOCUMENT_STORE_ADDRESS
        : MOCK_DOCUMENT_STORE_ADDRESS;

      beforeAll(() => {
        vi.clearAllMocks();
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
        mockContract.callStatic.revokeRole.mockResolvedValue(true);
        mockContract.revokeRole.staticCall.mockResolvedValue(true);

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

      it('should revoke role successfully', async () => {
        const result = await revokeDocumentStoreRole(
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

      it('should revoke role with explicit contract type', async () => {
        const result = await revokeDocumentStoreRole(
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

      it('should revoke role without chainId option', async () => {
        const result = await revokeDocumentStoreRole(
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

      it('should revoke role with gas options', async () => {
        const result = await revokeDocumentStoreRole(
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
          revokeDocumentStoreRole('', mockRole, mockAccount, wallet, { chainId: mockChainId }),
        ).rejects.toThrow('Document store address is required');
      });

      it('should throw when provider is missing', async () => {
        const signerWithoutProvider = new (ethersVersion === 'v5' ? WalletV5 : WalletV6)(
          '0x'.padEnd(66, '1'),
        );
        await expect(
          revokeDocumentStoreRole(
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
          revokeDocumentStoreRole(mockDocumentStoreAddress, '', mockAccount, wallet, {
            chainId: mockChainId,
          }),
        ).rejects.toThrow('Role is required');
      });

      it('should throw when account is missing', async () => {
        await expect(
          revokeDocumentStoreRole(mockDocumentStoreAddress, mockRole, '', wallet, {
            chainId: mockChainId,
          }),
        ).rejects.toThrow('Account is required');
      });

      it('should throw when callStatic fails', async () => {
        const mockError = new Error('callStatic error');
        mockContract.callStatic.revokeRole.mockRejectedValue(mockError);
        mockContract.revokeRole.staticCall.mockRejectedValue(mockError);
        await expect(
          revokeDocumentStoreRole(mockDocumentStoreAddress, mockRole, mockAccount, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for revoke-role failed');
      });

      it('should fallback to TT Document Store when ERC-165 interfaces not supported', async () => {
        vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
        const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockTTDocumentStoreContract),
        );
        const result = await revokeDocumentStoreRole(
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
        vi.mocked(getEthersContractFromProvider).mockReturnValue(
          mockContractConstructor(mockContract),
        );
      });

      it('should handle invalid role format gracefully', async () => {
        const invalidRole = 'invalid-role';
        mockContract.callStatic.revokeRole.mockRejectedValue(new Error('Invalid role format'));
        mockContract.revokeRole.staticCall.mockRejectedValue(new Error('Invalid role format'));
        await expect(
          revokeDocumentStoreRole(mockDocumentStoreAddress, invalidRole, mockAccount, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for revoke-role failed');
      });

      it('should handle role not granted error', async () => {
        mockContract.callStatic.revokeRole.mockRejectedValue(new Error('Role not granted'));
        mockContract.revokeRole.staticCall.mockRejectedValue(new Error('Role not granted'));
        await expect(
          revokeDocumentStoreRole(mockDocumentStoreAddress, mockRole, mockAccount, wallet, {
            chainId: mockChainId,
            isTransferable,
          }),
        ).rejects.toThrow('Pre-check (callStatic) for revoke-role failed');
      });

      it('should work with different role and account addresses', async () => {
        const differentRole = '0x1111111111111111111111111111111111111111111111111111111111111111';
        const differentAccount = '0x9876543210987654321098765432109876543210';
        const result = await revokeDocumentStoreRole(
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
      mockTTDocumentStoreContract.callStatic.revokeRole.mockResolvedValue(true);
      mockTTDocumentStoreContract.revokeRole.staticCall.mockResolvedValue(true);
    });

    it('should auto-detect TT Document Store as fallback when ERC-165 interfaces not supported', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await revokeDocumentStoreRole(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockRole,
        mockAccount,
        wallet,
        {
          chainId: mockChainId,
        },
      );
      expect(result).toEqual('tt_document_store_revoke_role_tx_hash');
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

    it('should revoke role with TT Document Store (ethers v5)', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await revokeDocumentStoreRole(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockRole,
        mockAccount,
        wallet,
        {
          chainId: mockChainId,
        },
      );
      expect(result).toEqual('tt_document_store_revoke_role_tx_hash');
    });

    it('should revoke role with TT Document Store (ethers v6)', async () => {
      const walletV6 = new WalletV6(PRIVATE_KEY, providerV6 as any);
      vi.spyOn(providerV6, 'getNetwork').mockResolvedValue({
        chainId: mockChainId,
      } as unknown as Network);
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await revokeDocumentStoreRole(
        MOCK_TT_DOCUMENT_STORE_ADDRESS,
        mockRole,
        mockAccount,
        walletV6,
        {
          chainId: mockChainId,
        },
      );
      expect(result).toEqual('tt_document_store_revoke_role_tx_hash');
    });

    it('should handle callStatic failure for TT Document Store', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const mockError = new Error('TT callStatic error');
      mockTTDocumentStoreContract.callStatic.revokeRole.mockRejectedValue(mockError);
      mockTTDocumentStoreContract.revokeRole.staticCall.mockRejectedValue(mockError);
      await expect(
        revokeDocumentStoreRole(MOCK_TT_DOCUMENT_STORE_ADDRESS, mockRole, mockAccount, wallet, {
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Pre-check (callStatic) for revoke-role failed');
    });

    it('should revoke role TT Document Store with gas options', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      const result = await revokeDocumentStoreRole(
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
      expect(result).toEqual('tt_document_store_revoke_role_tx_hash');
    });

    it('should handle role not granted error in TT Document Store', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);
      mockTTDocumentStoreContract.callStatic.revokeRole.mockRejectedValue(
        new Error('Role not granted'),
      );
      mockTTDocumentStoreContract.revokeRole.staticCall.mockRejectedValue(
        new Error('Role not granted'),
      );
      await expect(
        revokeDocumentStoreRole(MOCK_TT_DOCUMENT_STORE_ADDRESS, mockRole, mockAccount, wallet, {
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Pre-check (callStatic) for revoke-role failed');
    });
  });
});
