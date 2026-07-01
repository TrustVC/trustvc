import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('../../core', () => ({
  encrypt: vi.fn(() => 'encrypted_remarks'),
}));

vi.mock('viem', () => ({
  encodeFunctionData: vi.fn(() => '0xencodeddata'),
}));

vi.mock('../../token-registry-v5', () => ({
  v5Contracts: {
    TitleEscrow__factory: { abi: [] },
    TradeTrustToken__factory: { abi: [] },
  },
  constants: {
    contractInterfaceId: {},
    contractAddress: { TitleEscrowFactory: {}, TokenImplementation: {}, Deployer: {} },
  },
}));

import { encrypt } from '../../core';
import {
  returnToIssuerGasless,
  rejectReturnedGasless,
  acceptReturnedGasless,
} from '../../eip7702-functions';

const TITLE_ESCROW_ADDRESS = '0x1234567890123456789012345678901234567890';
const TOKEN_REGISTRY_ADDRESS = '0xabcdef1234567890123456789012345678901234';
const TX_HASH = '0xtxhash';

const makeMockClient = () => ({
  sendTransaction: vi.fn(() => Promise.resolve(TX_HASH as `0x${string}`)),
});

describe('Gasless Return Token Functions', () => {
  let mockClient: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = makeMockClient();
  });

  describe('returnToIssuerGasless', () => {
    it('throws if titleEscrowAddress is missing', async () => {
      await expect(
        returnToIssuerGasless({ titleEscrowAddress: '' } as any, mockClient, {}, { id: 'doc-id' }),
      ).rejects.toThrow('titleEscrowAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await returnToIssuerGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        {},
        { id: 'doc-id' },
      );
      expect(mockClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ to: TITLE_ESCROW_ADDRESS, value: 0n }),
      );
    });

    it('encrypts remarks when provided', async () => {
      await returnToIssuerGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { remarks: 'return reason' },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('return reason', 'doc-id');
    });

    it('does not call encrypt when remarks are absent', async () => {
      await returnToIssuerGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        {},
        { id: 'doc-id' },
      );
      expect(encrypt).not.toHaveBeenCalled();
    });

    it('returns the transaction hash', async () => {
      const result = await returnToIssuerGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        {},
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });

  describe('rejectReturnedGasless', () => {
    it('throws if tokenRegistryAddress is missing', async () => {
      await expect(
        rejectReturnedGasless(
          { tokenRegistryAddress: '' },
          mockClient,
          { tokenId: '0x1' },
          { id: 'doc-id' },
        ),
      ).rejects.toThrow('tokenRegistryAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await rejectReturnedGasless(
        { tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
        mockClient,
        { tokenId: '0x1' },
        { id: 'doc-id' },
      );
      expect(mockClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ to: TOKEN_REGISTRY_ADDRESS, value: 0n }),
      );
    });

    it('encrypts remarks when provided', async () => {
      await rejectReturnedGasless(
        { tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
        mockClient,
        { tokenId: '0x1', remarks: 'reject reason' },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('reject reason', 'doc-id');
    });

    it('does not call encrypt when remarks are absent', async () => {
      await rejectReturnedGasless(
        { tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
        mockClient,
        { tokenId: '0x1' },
        { id: 'doc-id' },
      );
      expect(encrypt).not.toHaveBeenCalled();
    });

    it('returns the transaction hash', async () => {
      const result = await rejectReturnedGasless(
        { tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
        mockClient,
        { tokenId: '0x1' },
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });

  describe('acceptReturnedGasless', () => {
    it('throws if tokenRegistryAddress is missing', async () => {
      await expect(
        acceptReturnedGasless(
          { tokenRegistryAddress: '' },
          mockClient,
          { tokenId: '0x1' },
          { id: 'doc-id' },
        ),
      ).rejects.toThrow('tokenRegistryAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await acceptReturnedGasless(
        { tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
        mockClient,
        { tokenId: '0x1' },
        { id: 'doc-id' },
      );
      expect(mockClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ to: TOKEN_REGISTRY_ADDRESS, value: 0n }),
      );
    });

    it('encrypts remarks when provided', async () => {
      await acceptReturnedGasless(
        { tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
        mockClient,
        { tokenId: '0x1', remarks: 'accept reason' },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('accept reason', 'doc-id');
    });

    it('does not call encrypt when remarks are absent', async () => {
      await acceptReturnedGasless(
        { tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
        mockClient,
        { tokenId: '0x1' },
        { id: 'doc-id' },
      );
      expect(encrypt).not.toHaveBeenCalled();
    });

    it('returns the transaction hash', async () => {
      const result = await acceptReturnedGasless(
        { tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
        mockClient,
        { tokenId: '0x1' },
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });
});
