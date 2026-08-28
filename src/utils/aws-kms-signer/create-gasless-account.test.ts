import { describe, it, expect, vi } from 'vitest';
import { privateKeyToAccount } from 'viem/accounts';

const { mockKmsToAccount } = vi.hoisted(() => ({ mockKmsToAccount: vi.fn() }));

vi.mock('./viem-kms-account', () => ({ kmsToAccount: mockKmsToAccount }));

import { createGaslessAccount } from './create-gasless-account';

const TEST_PRIVATE_KEY = `0x${'42'.repeat(32)}` as const;

describe('createGaslessAccount', () => {
  it('returns a privateKeyToAccount account for a privateKey config', async () => {
    const account = await createGaslessAccount({
      type: 'privateKey',
      privateKey: TEST_PRIVATE_KEY,
    });

    expect(account.address).toBe(privateKeyToAccount(TEST_PRIVATE_KEY).address);
    expect(mockKmsToAccount).not.toHaveBeenCalled();
  });

  it('delegates to kmsToAccount for a kms config, without the discriminant field', async () => {
    mockKmsToAccount.mockResolvedValueOnce({ address: '0xabc', source: 'kms' });

    const account = await createGaslessAccount({
      type: 'kms',
      keyId: 'test-key',
      region: 'ap-southeast-1',
    });

    expect(mockKmsToAccount).toHaveBeenCalledWith({ keyId: 'test-key', region: 'ap-southeast-1' });
    expect(account).toEqual({ address: '0xabc', source: 'kms' });
  });
});
