import { describe, expect, it, vi } from 'vitest';
import { ethers as ethersV6 } from 'ethersV6';
import * as ethersUtils from '../../utils/ethers';
import { fetchEndorsementChain } from '../../core/endorsement-chain/useEndorsementChain';

const TITLE_ESCROW_ADDRESS = '0x1111111111111111111111111111111111111111';
const REGISTRY_ADDRESS = '0x2222222222222222222222222222222222222222';

describe('fetchEndorsementChain - pre-BOE (legacy) V5 TitleEscrow fallback', () => {
  it('still resolves as V5 via prevBeneficiary() duck-typing when supportsInterface fails for both V4 and the current V5 interfaceId', async () => {
    const fakeContract = {
      supportsInterface: vi.fn().mockResolvedValue(false),
      prevBeneficiary: vi.fn().mockResolvedValue('0x000000000000000000000000000000000000dEaD'),
      registry: vi.fn().mockResolvedValue(REGISTRY_ADDRESS),
      getAddress: vi.fn().mockResolvedValue(TITLE_ESCROW_ADDRESS),
      address: TITLE_ESCROW_ADDRESS,
      filters: new Proxy(
        {},
        {
          get: () => vi.fn(() => ({})),
        },
      ),
      queryFilter: vi.fn().mockResolvedValue([]),
      interface: { parseLog: vi.fn() },
    };

    vi.spyOn(ethersUtils, 'getEthersContractFromProvider').mockReturnValue(
      vi.fn(() => fakeContract) as any,
    );

    const provider = new ethersV6.JsonRpcProvider('http://localhost:1', 11155111, {
      staticNetwork: true,
    });

    const result = await fetchEndorsementChain(
      REGISTRY_ADDRESS,
      '1',
      provider,
      undefined,
      TITLE_ESCROW_ADDRESS,
    );

    expect(result).toEqual([]);
    expect(fakeContract.prevBeneficiary).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('throws when neither V4/V5 interfaces match nor prevBeneficiary() succeeds (genuinely unsupported registry)', async () => {
    const fakeContract = {
      supportsInterface: vi.fn().mockResolvedValue(false),
      prevBeneficiary: vi.fn().mockRejectedValue(new Error('no such function')),
    };

    vi.spyOn(ethersUtils, 'getEthersContractFromProvider').mockReturnValue(
      vi.fn(() => fakeContract) as any,
    );

    const provider = new ethersV6.JsonRpcProvider('http://localhost:1', 11155111, {
      staticNetwork: true,
    });

    await expect(
      fetchEndorsementChain(REGISTRY_ADDRESS, '1', provider, undefined, TITLE_ESCROW_ADDRESS),
    ).rejects.toThrow('Only Token Registry V4/V5 is supported');

    vi.restoreAllMocks();
  });
});
