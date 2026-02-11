import './fixtures';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wallet as WalletV5 } from 'ethers';
import { Wallet as WalletV6, Network } from 'ethersV6';
import { deployDocumentStore } from '../../document-store/deploy';
import { PRIVATE_KEY, providerV5, providerV6 } from './fixtures';
import { CHAIN_ID } from '../../utils';

describe('Deploy Document Store', () => {
  const mockStoreName = 'Test Document Store';
  const mockOwnerAddress = '0x1234567890123456789012345678901234567890';
  const mockChainId = CHAIN_ID.sepolia;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('DocumentStore deployment', () => {
    it('should deploy DocumentStore successfully with ethers v6', async () => {
      const providerV6: any = {
        getNetwork: vi.fn().mockResolvedValue({ chainId: mockChainId }),
        provider: {},
      };

      const wallet: any = {
        provider: providerV6, // must exist
      };
      const result = await deployDocumentStore(mockStoreName, mockOwnerAddress, wallet, {
        chainId: mockChainId,
        isTransferable: false,
      });
      console.log('result', result);

      expect(result).toEqual({
        address: '0xDeployedDocumentStoreAddress',
        transactionHash: 'deploy_tx_hash',
      });
    });

    it('should deploy TransferableDocumentStore successfully with ethers v6', async () => {
      const providerV6: any = {
        getNetwork: vi.fn().mockResolvedValue({ chainId: mockChainId }),
        provider: {},
      };

      const wallet: any = {
        provider: providerV6, // must exist
      };
      vi.spyOn(providerV6, 'getNetwork').mockResolvedValue({
        chainId: mockChainId,
      } as unknown as Network);

      const result = await deployDocumentStore(mockStoreName, mockOwnerAddress, wallet, {
        chainId: mockChainId,
        isTransferable: true,
      });

      expect(result).toEqual({
        address: '0xDeployedDocumentStoreAddress',
        transactionHash: 'deploy_tx_hash',
      });
    });

    it('should deploy DocumentStore successfully with ethers v5', async () => {
      const wallet = new WalletV5(PRIVATE_KEY, providerV5);
      vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);

      const result = await deployDocumentStore(mockStoreName, mockOwnerAddress, wallet, {
        chainId: mockChainId,
        isTransferable: false,
      });

      expect(result).toEqual({
        address: '0xDeployedDocumentStoreAddress',
        transactionHash: 'deploy_tx_hash',
      });
    });

    it('should deploy TransferableDocumentStore successfully with ethers v5', async () => {
      const wallet = new WalletV5(PRIVATE_KEY, providerV5);
      vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);

      const result = await deployDocumentStore(mockStoreName, mockOwnerAddress, wallet, {
        chainId: mockChainId,
        isTransferable: true,
      });

      expect(result).toEqual({
        address: '0xDeployedDocumentStoreAddress',
        transactionHash: 'deploy_tx_hash',
      });
    });

    it('should throw when store name is missing', async () => {
      const wallet = new WalletV6(PRIVATE_KEY, providerV6);
      await expect(
        deployDocumentStore('', mockOwnerAddress, wallet, { chainId: mockChainId }),
      ).rejects.toThrow('Store name is required');
    });

    it('should throw when owner address is missing', async () => {
      const wallet = new WalletV6(PRIVATE_KEY, providerV6);
      await expect(
        deployDocumentStore(mockStoreName, '', wallet, { chainId: mockChainId }),
      ).rejects.toThrow('Owner address is required');
    });

    it('should throw when provider is missing', async () => {
      const signerWithoutProvider = new WalletV5('0x'.padEnd(66, '1'));
      await expect(
        deployDocumentStore(mockStoreName, mockOwnerAddress, signerWithoutProvider, {
          chainId: mockChainId,
        }),
      ).rejects.toThrow('Provider is required');
    });
  });
});
