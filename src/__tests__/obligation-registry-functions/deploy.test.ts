import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  deployObligationEscrowFactory,
  deployObligationRegistry,
} from '../../obligation-registry-functions';
import { getEthersContractFactoryFromProvider, isV6EthersProvider } from '../../utils/ethers';
import { CHAIN_ID } from '../../utils';

describe('deploy obligation registry', () => {
  const mockChainId = CHAIN_ID.sepolia;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deployObligationEscrowFactory with ethers v6', async () => {
    const mockContract = {
      getAddress: vi.fn().mockResolvedValue('0xEscrowFactory'),
      deploymentTransaction: vi.fn().mockReturnValue({
        wait: vi.fn().mockResolvedValue({ transactionHash: 'factory_tx' }),
      }),
    };
    const mockFactory = {
      deploy: vi.fn().mockResolvedValue(mockContract),
    };

    const providerV6Mock: any = {
      getNetwork: vi.fn().mockResolvedValue({ chainId: mockChainId }),
    };
    const wallet: any = { provider: providerV6Mock };

    vi.mocked(isV6EthersProvider).mockReturnValue(true);
    vi.mocked(getEthersContractFactoryFromProvider).mockReturnValue(
      vi.fn().mockReturnValue(mockFactory) as any,
    );

    const result = await deployObligationEscrowFactory(wallet, { chainId: mockChainId });

    expect(result.obligationEscrowFactoryAddress).toBe('0xEscrowFactory');
    expect(mockFactory.deploy).toHaveBeenCalled();
  });

  it('deployObligationRegistry with existing escrow factory (ethers v6)', async () => {
    const mockContract = {
      getAddress: vi.fn().mockResolvedValue('0xObligationRegistry'),
      deploymentTransaction: vi.fn().mockReturnValue({
        wait: vi.fn().mockResolvedValue({ transactionHash: 'registry_tx' }),
      }),
    };
    const mockFactory = {
      deploy: vi.fn().mockResolvedValue(mockContract),
    };

    const providerV6Mock: any = {
      getNetwork: vi.fn().mockResolvedValue({ chainId: mockChainId }),
    };
    const wallet: any = { provider: providerV6Mock };

    vi.mocked(isV6EthersProvider).mockReturnValue(true);
    vi.mocked(getEthersContractFactoryFromProvider).mockReturnValue(
      vi.fn().mockReturnValue(mockFactory) as any,
    );

    const result = await deployObligationRegistry('BoE', 'BOE', wallet, {
      chainId: mockChainId,
      escrowFactoryAddress: '0xExistingFactory',
    });

    expect(result.obligationRegistry).toBe('0xObligationRegistry');
    expect(result.obligationEscrowFactoryAddress).toBe('0xExistingFactory');
    expect(mockFactory.deploy).toHaveBeenCalledWith('BoE', 'BOE', '0xExistingFactory', {});
  });

  it('throws when provider is missing', async () => {
    await expect(deployObligationEscrowFactory({} as any)).rejects.toThrow('Provider is required');
  });
});
