import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wallet as WalletV5 } from 'ethers';
import { ownerOfObligationRegistry } from '../../obligation-registry-functions';
import {
  MOCK_OBLIGATION_REGISTRY_ADDRESS,
  MOCK_OWNER_ADDRESS,
  mockTrustVCTokenContract,
  PRIVATE_KEY,
  providerV5,
} from './fixtures.js';
import * as coreModule from '../../core';
import { getEthersContractFromProvider } from '../../utils/ethers';

describe('ownerOfObligationRegistry', () => {
  let wallet: WalletV5;

  beforeEach(() => {
    vi.clearAllMocks();
    wallet = new WalletV5(PRIVATE_KEY, providerV5 as any);
    vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(true);
    vi.mocked(getEthersContractFromProvider).mockReturnValue(
      vi.fn(() => mockTrustVCTokenContract) as any,
    );
    mockTrustVCTokenContract.ownerOf.mockResolvedValue(MOCK_OWNER_ADDRESS);
  });

  it('returns owner address', async () => {
    const owner = await ownerOfObligationRegistry(
      { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS },
      wallet,
      { tokenId: '1' },
    );

    expect(owner).toBe(MOCK_OWNER_ADDRESS);
  });

  it('throws when registry address is missing', async () => {
    await expect(
      ownerOfObligationRegistry({ obligationRegistryAddress: '' }, wallet, { tokenId: '1' }),
    ).rejects.toThrow('Obligation registry address is required');
  });
});
