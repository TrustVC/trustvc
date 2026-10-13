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
  transferHolderGasless,
  transferBeneficiaryGasless,
  transferOwnersGasless,
  nominateGasless,
} from '../../eip7702-functions';

const TITLE_ESCROW_ADDRESS = '0x1234567890123456789012345678901234567890';
const TX_HASH = '0xtxhash';

const makeMockClient = () => ({
  sendTransaction: vi.fn(() => Promise.resolve(TX_HASH as `0x${string}`)),
});

describe('Gasless Transfer Functions', () => {
  let mockClient: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = makeMockClient();
  });

  describe('transferHolderGasless', () => {
    it('throws if titleEscrowAddress is missing', async () => {
      await expect(
        transferHolderGasless(
          { titleEscrowAddress: '' } as any,
          mockClient,
          { holderAddress: '0xholder' },
          { id: 'doc-id' },
        ),
      ).rejects.toThrow('titleEscrowAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await transferHolderGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { holderAddress: '0xholder' },
        { id: 'doc-id' },
      );
      expect(mockClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ to: TITLE_ESCROW_ADDRESS, value: 0n }),
      );
    });

    it('encrypts remarks when provided', async () => {
      await transferHolderGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { holderAddress: '0xholder', remarks: 'my remarks' },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('my remarks', 'doc-id');
    });

    it('sends 0x when remarks are not provided', async () => {
      await transferHolderGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { holderAddress: '0xholder' },
        { id: 'doc-id' },
      );
      expect(encrypt).not.toHaveBeenCalled();
    });

    it('returns the transaction hash', async () => {
      const result = await transferHolderGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { holderAddress: '0xholder' },
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });

  describe('transferBeneficiaryGasless', () => {
    it('throws if titleEscrowAddress is missing', async () => {
      await expect(
        transferBeneficiaryGasless(
          { titleEscrowAddress: '' } as any,
          mockClient,
          { newBeneficiaryAddress: '0xbeneficiary' },
          { id: 'doc-id' },
        ),
      ).rejects.toThrow('titleEscrowAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await transferBeneficiaryGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { newBeneficiaryAddress: '0xbeneficiary' },
        { id: 'doc-id' },
      );
      expect(mockClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ to: TITLE_ESCROW_ADDRESS, value: 0n }),
      );
    });

    it('encrypts remarks when provided', async () => {
      await transferBeneficiaryGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { newBeneficiaryAddress: '0xbeneficiary', remarks: 'my remarks' },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('my remarks', 'doc-id');
    });

    it('returns the transaction hash', async () => {
      const result = await transferBeneficiaryGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { newBeneficiaryAddress: '0xbeneficiary' },
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });

  describe('transferOwnersGasless', () => {
    it('throws if titleEscrowAddress is missing', async () => {
      await expect(
        transferOwnersGasless(
          { titleEscrowAddress: '' } as any,
          mockClient,
          { newBeneficiaryAddress: '0xbeneficiary', newHolderAddress: '0xholder' },
          { id: 'doc-id' },
        ),
      ).rejects.toThrow('titleEscrowAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await transferOwnersGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { newBeneficiaryAddress: '0xbeneficiary', newHolderAddress: '0xholder' },
        { id: 'doc-id' },
      );
      expect(mockClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ to: TITLE_ESCROW_ADDRESS, value: 0n }),
      );
    });

    it('encrypts remarks when provided', async () => {
      await transferOwnersGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        {
          newBeneficiaryAddress: '0xbeneficiary',
          newHolderAddress: '0xholder',
          remarks: 'my remarks',
        },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('my remarks', 'doc-id');
    });

    it('returns the transaction hash', async () => {
      const result = await transferOwnersGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { newBeneficiaryAddress: '0xbeneficiary', newHolderAddress: '0xholder' },
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });

  describe('nominateGasless', () => {
    it('throws if titleEscrowAddress is missing', async () => {
      await expect(
        nominateGasless(
          { titleEscrowAddress: '' } as any,
          mockClient,
          { newBeneficiaryAddress: '0xbeneficiary' },
          { id: 'doc-id' },
        ),
      ).rejects.toThrow('titleEscrowAddress is required');
    });

    it('calls sendTransaction with correct to and value', async () => {
      await nominateGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { newBeneficiaryAddress: '0xbeneficiary' },
        { id: 'doc-id' },
      );
      expect(mockClient.sendTransaction).toHaveBeenCalledWith(
        expect.objectContaining({ to: TITLE_ESCROW_ADDRESS, value: 0n }),
      );
    });

    it('encrypts remarks when provided', async () => {
      await nominateGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { newBeneficiaryAddress: '0xbeneficiary', remarks: 'my remarks' },
        { id: 'doc-id' },
      );
      expect(encrypt).toHaveBeenCalledWith('my remarks', 'doc-id');
    });

    it('returns the transaction hash', async () => {
      const result = await nominateGasless(
        { titleEscrowAddress: TITLE_ESCROW_ADDRESS },
        mockClient,
        { newBeneficiaryAddress: '0xbeneficiary' },
        { id: 'doc-id' },
      );
      expect(result).toBe(TX_HASH);
    });
  });
});
