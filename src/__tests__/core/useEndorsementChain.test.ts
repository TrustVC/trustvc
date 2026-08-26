import { ethers } from 'ethers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTitleEscrowAddress } from '../../core/endorsement-chain/useEndorsementChain';
import { RATE_LIMIT_MAX_RETRIES } from '../../constants';

const BURN_ADDRESS = '0x000000000000000000000000000000000000dEaD';
const TOKEN_REGISTRY_ADDRESS = '0x2222222222222222222222222222222222222222';
const FACTORY_ADDRESS = '0x1111111111111111111111111111111111111111';
const TOKEN_ID = '1';

const OWNER_OF_SELECTOR = ethers.utils.id('ownerOf(uint256)').slice(0, 10);
const TITLE_ESCROW_FACTORY_SELECTOR = ethers.utils.id('titleEscrowFactory()').slice(0, 10);
const GET_ESCROW_ADDRESS_SELECTOR = ethers.utils
  .id('getEscrowAddress(address,uint256)')
  .slice(0, 10);
const GET_ADDRESS_SELECTOR = ethers.utils.id('getAddress(address,uint256)').slice(0, 10);

const encodeAddress = (address: string): string =>
  ethers.utils.defaultAbiCoder.encode(['address'], [address]);

describe('resolveTitleEscrowAddress rate-limit handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('rethrows an exhausted rate-limit error without trying the alternate ABI selector', async () => {
    const call = vi.fn(async (tx: { data?: string }) => {
      const selector = (tx.data ?? '').slice(0, 10);
      if (selector === OWNER_OF_SELECTOR) return encodeAddress(BURN_ADDRESS);
      if (selector === TITLE_ESCROW_FACTORY_SELECTOR) return encodeAddress(FACTORY_ADDRESS);
      if (selector === GET_ESCROW_ADDRESS_SELECTOR) {
        throw Object.assign(new Error('Too Many Requests'), { code: 429 });
      }
      throw new Error(`Unexpected eth_call to selector ${selector}`);
    });
    vi.spyOn(ethers.providers.JsonRpcProvider.prototype, 'call').mockImplementation(
      call as unknown as ethers.providers.JsonRpcProvider['call'],
    );

    const provider = new ethers.providers.JsonRpcProvider('http://localhost:1', {
      name: 'unit-test',
      chainId: 1337,
    });

    const resultPromise = getTitleEscrowAddress(TOKEN_REGISTRY_ADDRESS, TOKEN_ID, provider);
    // Attach the rejection handler before advancing timers so the eventual rejection is
    // never briefly unhandled.
    const rejection = expect(resultPromise).rejects.toThrow(/Too Many Requests/);
    // Let the rate-limit backoff sleeps (real setTimeout calls under the hood) run to
    // completion under fake timers so the retry loop can exhaust and reject.
    await vi.runAllTimersAsync();
    await rejection;

    const selectorsCalled = call.mock.calls.map(([tx]) => (tx.data ?? '').slice(0, 10));
    expect(
      selectorsCalled.filter((selector) => selector === GET_ESCROW_ADDRESS_SELECTOR),
    ).toHaveLength(RATE_LIMIT_MAX_RETRIES + 1);
    expect(selectorsCalled).not.toContain(GET_ADDRESS_SELECTOR);
  });
});
