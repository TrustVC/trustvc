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
  },
  constants: {
    contractInterfaceId: {},
    contractAddress: { TitleEscrowFactory: {}, TokenImplementation: {}, Deployer: {} },
  },
}));

import { encrypt } from '../../core';
import {
  rejectTransferHolderGasless,
  rejectTransferBeneficiaryGasless,
  rejectTransferOwnersGasless,
} from '../../eip7702-functions';

const TITLE_ESCROW_ADDRESS = '0x1234567890123456789012345678901234567890';
const TX_HASH = '0xtxhash';

const makeMockClient = () => ({
  sendTransaction: vi.fn(() => Promise.resolve(TX_HASH as `0x${string}`)),
});

describe('Gasless Reject Transfer Functions', () => {
  let mockClient: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = makeMockClient();
  });

  describe('rejectTransferHolderGasless', () => {
    it('throws if titleEscrowAddress is missing', async () => {
      await expect(
        rejectTransferHolderGasless(
          { titleEscrowAddress: '' } as any,
          mockClient,
          {},
          { id: 'doc-id' },
        ),
      ).rejects.toThrow('titleEscrowAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await rejectTransferHolderGasless(
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
      await rejectTransferHolderGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { remarks: 'rejection reason' },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('rejection reason', 'doc-id');
    });

    it('does not call encrypt when remarks are absent', async () => {
      await rejectTransferHolderGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        {},
        { id: 'doc-id' },
      );
      expect(encrypt).not.toHaveBeenCalled();
    });

    it('returns the transaction hash', async () => {
      const result = await rejectTransferHolderGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        {},
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });

  describe('rejectTransferBeneficiaryGasless', () => {
    it('throws if titleEscrowAddress is missing', async () => {
      await expect(
        rejectTransferBeneficiaryGasless(
          { titleEscrowAddress: '' } as any,
          mockClient,
          {},
          { id: 'doc-id' },
        ),
      ).rejects.toThrow('titleEscrowAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await rejectTransferBeneficiaryGasless(
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
      await rejectTransferBeneficiaryGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { remarks: 'rejection reason' },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('rejection reason', 'doc-id');
    });

    it('returns the transaction hash', async () => {
      const result = await rejectTransferBeneficiaryGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        {},
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });

  describe('rejectTransferOwnersGasless', () => {
    it('throws if titleEscrowAddress is missing', async () => {
      await expect(
        rejectTransferOwnersGasless(
          { titleEscrowAddress: '' } as any,
          mockClient,
          {},
          { id: 'doc-id' },
        ),
      ).rejects.toThrow('titleEscrowAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await rejectTransferOwnersGasless(
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
      await rejectTransferOwnersGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { remarks: 'rejection reason' },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('rejection reason', 'doc-id');
    });

    it('returns the transaction hash', async () => {
      const result = await rejectTransferOwnersGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        {},
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });
});
