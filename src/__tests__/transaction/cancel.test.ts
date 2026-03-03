import { describe, it, expect, vi } from 'vitest';
import { cancelTransaction } from '../../transaction/cancel';

describe('transaction/cancel', () => {
  const mockAddress = '0xC84b0719A82626417c40f3168513dFABDB6A9079';

  describe('cancelTransaction', () => {
    it('throws when signer has no provider', async () => {
      const signer = { getAddress: vi.fn(), provider: null } as any;
      await expect(
        cancelTransaction(signer, { nonce: '0', gasPrice: '1000000000' }),
      ).rejects.toThrow('Provider is required on signer');
    });

    it('throws when neither (nonce+gasPrice) nor transactionHash provided', async () => {
      const signer = { getAddress: vi.fn().mockResolvedValue(mockAddress), provider: {} } as any;
      await expect(cancelTransaction(signer, {})).rejects.toThrow(
        /Provide either \(--nonce and --gas-price\) or --transaction-hash/,
      );
    });

    it('sends replacement tx with nonce and gasPrice and returns hash (v6-style signer)', async () => {
      const mockHash = '0xabc123';
      const sendTransaction = vi.fn().mockResolvedValue({ hash: mockHash });
      const signer = {
        getAddress: vi.fn().mockResolvedValue(mockAddress),
        provider: { _isProvider: false, provider: {} },
        sendTransaction,
      } as any;

      const hash = await cancelTransaction(signer, { nonce: '5', gasPrice: '25000000000' });

      expect(hash).toBe(mockHash);
      expect(sendTransaction).toHaveBeenCalledTimes(1);
      const call = sendTransaction.mock.calls[0][0];
      expect(call.to).toBe(mockAddress);
      expect(call.nonce).toBe(5);
      expect(call.gasPrice).toBe('25000000000');
      expect(call.value).toBe(0);
      expect(call.gasLimit).toBe(21000);
    });

    it('when transactionHash provided, fetches tx and uses 2x gas price', async () => {
      const mockHash = '0xreplacement';
      const getTransaction = vi.fn().mockResolvedValue({
        nonce: 10,
        gasPrice: 3n,
      });
      const sendTransaction = vi.fn().mockResolvedValue({ hash: mockHash });
      const signer = {
        getAddress: vi.fn().mockResolvedValue(mockAddress),
        provider: {
          _isProvider: false,
          provider: {},
          getTransaction,
        },
        sendTransaction,
      } as any;

      const hash = await cancelTransaction(signer, {
        transactionHash: '0x456bba58226f03e3fb7d72b5143ceecfb6bfb66b00586929f6d60890ec264c2c',
      });

      expect(getTransaction).toHaveBeenCalledWith(
        '0x456bba58226f03e3fb7d72b5143ceecfb6bfb66b00586929f6d60890ec264c2c',
      );
      expect(hash).toBe(mockHash);
      expect(sendTransaction.mock.calls[0][0].nonce).toBe(10);
      expect(sendTransaction.mock.calls[0][0].gasPrice).toBe('6'); // 2 * 3
    });

    it('throws when transactionHash not found', async () => {
      const getTransaction = vi.fn().mockResolvedValue(null);
      const signer = {
        getAddress: vi.fn().mockResolvedValue(mockAddress),
        provider: { getTransaction: getTransaction },
      } as any;

      await expect(
        cancelTransaction(signer, {
          transactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        }),
      ).rejects.toThrow('Transaction not found');
    });
  });

  // createAndCancelTransaction helper has been removed; tests focus on cancelTransaction only.
});
