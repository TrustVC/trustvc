import { describe, expect, it, vi } from 'vitest';
import { ethers as ethersV6 } from 'ethersV6';
import * as ethersUtils from '../../utils/ethers';
import {
  fetchEndorsementChain,
  TitleEscrowInterface,
} from '../../core/endorsement-chain/useEndorsementChain';

const TITLE_ESCROW_ADDRESS = '0x1111111111111111111111111111111111111111';
const REGISTRY_ADDRESS = '0x2222222222222222222222222222222222222222';

const MINT_LOG = {
  args: { from: '0x0000000000000000000000000000000000000000', to: TITLE_ESCROW_ADDRESS },
  blockNumber: 1,
  transactionHash: `0x${'11'.repeat(32)}`,
  transactionIndex: 0,
};

// The title escrow contract: covers version detection (supportsInterface, prevBeneficiary) and
// both V4/V5 escrow-side event filters (all empty — this suite only cares which branch runs, not
// its event content, which is covered elsewhere).
function buildEscrowContract(supportsInterfaceFor: string[]) {
  return {
    supportsInterface: vi.fn((interfaceId: string) =>
      Promise.resolve(supportsInterfaceFor.includes(interfaceId)),
    ),
    prevBeneficiary: vi.fn().mockResolvedValue('0x000000000000000000000000000000000000dEaD'),
    registry: vi.fn().mockResolvedValue(REGISTRY_ADDRESS),
    getAddress: vi.fn().mockResolvedValue(TITLE_ESCROW_ADDRESS),
    address: TITLE_ESCROW_ADDRESS,
    filters: new Proxy({}, { get: () => vi.fn(() => ({})) }),
    queryFilter: vi.fn().mockResolvedValue([]),
    interface: { parseLog: vi.fn() },
  };
}

// The token registry contract: only needed for the V4 branch, which separately fetches the
// mint/transfer history straight from the registry (fetchTokenTransfers) and throws if it can't
// find the mint log.
function buildRegistryContract() {
  return {
    filters: { Transfer: vi.fn(() => ({})) },
    queryFilter: vi.fn().mockResolvedValue([MINT_LOG]),
    interface: { parseLog: vi.fn(() => ({ name: 'Transfer', args: MINT_LOG.args })) },
  };
}

function mockContracts(escrowContract: ReturnType<typeof buildEscrowContract>) {
  const registryContract = buildRegistryContract();
  vi.spyOn(ethersUtils, 'getEthersContractFromProvider').mockReturnValue(
    vi.fn((address: string) =>
      address === REGISTRY_ADDRESS ? registryContract : escrowContract,
    ) as any,
  );
}

function makeProvider() {
  const provider = new ethersV6.JsonRpcProvider('http://localhost:1', 11155111, {
    staticNetwork: true,
  });
  vi.spyOn(provider, 'getBlock').mockResolvedValue({ timestamp: 1700000000 } as any);
  return provider;
}

describe('fetchEndorsementChain - version detection covers V4, old V5, and new (eBOE) V5', () => {
  it('resolves V4 via its own interfaceId, without falling back to prevBeneficiary', async () => {
    const escrowContract = buildEscrowContract([TitleEscrowInterface.V4]);
    mockContracts(escrowContract);

    const result = await fetchEndorsementChain(
      REGISTRY_ADDRESS,
      '1',
      makeProvider(),
      undefined,
      TITLE_ESCROW_ADDRESS,
    );

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('INITIAL');
    expect(escrowContract.prevBeneficiary).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('resolves new (eBOE) V5 directly via its current interfaceId, without falling back to prevBeneficiary', async () => {
    const escrowContract = buildEscrowContract([TitleEscrowInterface.V5]);
    mockContracts(escrowContract);

    const result = await fetchEndorsementChain(
      REGISTRY_ADDRESS,
      '1',
      makeProvider(),
      undefined,
      TITLE_ESCROW_ADDRESS,
    );

    expect(result).toEqual([]);
    expect(escrowContract.prevBeneficiary).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('resolves old (pre-eBOE) V5 via the prevBeneficiary() fallback when neither interfaceId matches', async () => {
    const escrowContract = buildEscrowContract([]); // matches neither V4 nor the current V5 interfaceId
    mockContracts(escrowContract);

    const result = await fetchEndorsementChain(
      REGISTRY_ADDRESS,
      '1',
      makeProvider(),
      undefined,
      TITLE_ESCROW_ADDRESS,
    );

    expect(result).toEqual([]);
    expect(escrowContract.prevBeneficiary).toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it('throws when neither V4/V5 interfaces match nor prevBeneficiary() succeeds (genuinely unsupported registry)', async () => {
    const escrowContract = buildEscrowContract([]);
    escrowContract.prevBeneficiary = vi.fn().mockRejectedValue(new Error('no such function'));
    mockContracts(escrowContract);

    await expect(
      fetchEndorsementChain(REGISTRY_ADDRESS, '1', makeProvider(), undefined, TITLE_ESCROW_ADDRESS),
    ).rejects.toThrow('Only Token Registry V4/V5 is supported');

    vi.restoreAllMocks();
  });
});
