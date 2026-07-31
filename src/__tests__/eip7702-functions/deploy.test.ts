import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('viem', () => ({
  encodeFunctionData: vi.fn(() => '0xencodeddata'),
  parseEventLogs: vi.fn(() => [{ args: { paymaster: '0xpaymaster' as `0x${string}` } }]),
}));

vi.mock('@trustvc/eip7702', () => ({
  abis: {
    platformPaymasterAbi: [],
    platformAccountFactoryAbi: [],
  },
  constants: {
    ChainId: { Sepolia: 11155111 },
    contractAddress: {
      PlatformAccountFactory: { 11155111: '0xfactory' },
    },
  },
}));

vi.mock('../../token-registry-v5', () => ({
  constants: {
    contractInterfaceId: {},
    contractAddress: { TitleEscrowFactory: {}, TokenImplementation: {}, Deployer: {} },
  },
}));

vi.mock('../../utils/ethers', () => ({
  getEthersContractFromProvider: vi.fn(),
  isV6EthersProvider: vi.fn(),
}));

import { deployTokenRegistryGasless, deployPlatformPaymaster } from '../../eip7702-functions';
import { getEthersContractFromProvider, isV6EthersProvider } from '../../utils/ethers';
import { parseEventLogs } from 'viem';

const PAYMASTER_ADDRESS = '0xabcdef1234567890123456789012345678901234' as `0x${string}`;
const IMPL_ADDRESS = '0x2234567890123456789012345678901234567890' as `0x${string}`;
const FACTORY_ADDRESS = '0xfactory000000000000000000000000000000000' as `0x${string}`;
const TX_HASH = '0xtxhash' as `0x${string}`;
const SALT = `0x${'ab'.repeat(32)}` as `0x${string}`;

// ─── deployTokenRegistryGasless ──────────────────────────────────────────────

describe('deployTokenRegistryGasless', () => {
  const makeMockClient = () => ({
    sendTransaction: vi.fn(() => Promise.resolve(TX_HASH)),
  });

  let mockClient: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = makeMockClient();
  });

  it('throws if paymasterAddress is missing', async () => {
    await expect(
      deployTokenRegistryGasless('My Registry', 'MR', mockClient as any, {
        paymasterAddress: '' as `0x${string}`,
        tokenRegistryImplAddress: IMPL_ADDRESS,
      }),
    ).rejects.toThrow('paymasterAddress is required');
  });

  it('throws if tokenRegistryImplAddress is missing', async () => {
    await expect(
      deployTokenRegistryGasless('My Registry', 'MR', mockClient as any, {
        paymasterAddress: PAYMASTER_ADDRESS,
        tokenRegistryImplAddress: '' as `0x${string}`,
      }),
    ).rejects.toThrow('tokenRegistryImplAddress is required');
  });

  it('calls sendTransaction targeting the paymasterAddress with value 0n', async () => {
    await deployTokenRegistryGasless('My Registry', 'MR', mockClient as any, {
      paymasterAddress: PAYMASTER_ADDRESS,
      tokenRegistryImplAddress: IMPL_ADDRESS,
    });
    expect(mockClient.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ to: PAYMASTER_ADDRESS, value: 0n }),
    );
  });

  it('returns the transaction hash', async () => {
    const result = await deployTokenRegistryGasless('My Registry', 'MR', mockClient as any, {
      paymasterAddress: PAYMASTER_ADDRESS,
      tokenRegistryImplAddress: IMPL_ADDRESS,
    });
    expect(result).toBe(TX_HASH);
  });
});

// ─── deployPlatformPaymaster (viem WalletClient path) ─────────────────────────

describe('deployPlatformPaymaster — viem WalletClient', () => {
  const makeMockWalletClient = () => ({
    writeContract: vi.fn(() => Promise.resolve(TX_HASH)),
    account: { address: '0xdeployer' as `0x${string}` },
    chain: { id: 11155111 },
  });

  const makeMockPublicClient = () => ({
    waitForTransactionReceipt: vi.fn(() =>
      Promise.resolve({ logs: [{ address: FACTORY_ADDRESS, topics: [], data: '0x' }] }),
    ),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(parseEventLogs).mockReturnValue([
      { args: { paymaster: '0xpaymaster' as `0x${string}` } },
    ] as any);
  });

  it('throws if no factory address is resolvable for chain', async () => {
    const walletClient = makeMockWalletClient();
    const publicClient = makeMockPublicClient();
    await expect(
      deployPlatformPaymaster(
        walletClient as any,
        { chainId: 99999, salt: SALT },
        publicClient as any,
      ),
    ).rejects.toThrow('No PlatformAccountFactory address found for chainId 99999');
  });

  it('throws if publicClient is not provided for WalletClient', async () => {
    const walletClient = makeMockWalletClient();
    await expect(
      deployPlatformPaymaster(
        walletClient as any,
        { factoryAddress: FACTORY_ADDRESS, salt: SALT },
        undefined as any,
      ),
    ).rejects.toThrow('publicClient is required when signer is a WalletClient');
  });

  it('calls writeContract with correct factory address and args', async () => {
    const walletClient = makeMockWalletClient();
    const publicClient = makeMockPublicClient();
    await deployPlatformPaymaster(
      walletClient as any,
      {
        factoryAddress: FACTORY_ADDRESS,
        platformAddress: '0xplatform' as `0x${string}`,
        dailyLimit: 0n,
        salt: SALT,
      },
      publicClient as any,
    );
    expect(walletClient.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: FACTORY_ADDRESS,
        functionName: 'deployPlatformPaymaster',
        args: ['0xplatform', 0n, SALT],
      }),
    );
  });

  it('returns txHash and paymasterAddress parsed from logs', async () => {
    const walletClient = makeMockWalletClient();
    const publicClient = makeMockPublicClient();
    const result = await deployPlatformPaymaster(
      walletClient as any,
      { factoryAddress: FACTORY_ADDRESS, salt: SALT },
      publicClient as any,
    );
    expect(result.txHash).toBe(TX_HASH);
    expect(result.paymasterAddress).toBe('0xpaymaster');
  });
});

// ─── deployPlatformPaymaster (ethers v5 path) ─────────────────────────────────

describe('deployPlatformPaymaster — ethers v5 signer', () => {
  const makeMockContract = () => ({
    deployPlatformPaymaster: vi.fn(() =>
      Promise.resolve({
        wait: vi.fn(() =>
          Promise.resolve({
            transactionHash: TX_HASH,
            logs: [{ address: FACTORY_ADDRESS, topics: [], data: '0x' }],
          }),
        ),
      }),
    ),
    interface: {
      parseLog: vi.fn(() => ({
        name: 'PlatformOnboarded',
        args: { paymaster: '0xpaymaster' },
      })),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deployPlatformPaymaster on the contract with correct args', async () => {
    const mockContract = makeMockContract();
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
    vi.mocked(isV6EthersProvider).mockReturnValue(false);

    const ethSigner = {
      provider: {},
      getAddress: vi.fn(() => Promise.resolve('0xdeployer')),
    };

    await deployPlatformPaymaster(ethSigner as any, {
      factoryAddress: FACTORY_ADDRESS,
      salt: SALT,
    });

    expect(mockContract.deployPlatformPaymaster).toHaveBeenCalledWith('0xdeployer', 0n, SALT);
  });

  it('returns txHash and paymasterAddress from event logs', async () => {
    const mockContract = makeMockContract();
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
    vi.mocked(isV6EthersProvider).mockReturnValue(false);

    const ethSigner = {
      provider: {},
      getAddress: vi.fn(() => Promise.resolve('0xdeployer')),
    };

    const result = await deployPlatformPaymaster(ethSigner as any, {
      factoryAddress: FACTORY_ADDRESS,
      salt: SALT,
    });

    expect(result.txHash).toBe(TX_HASH);
    expect(result.paymasterAddress).toBe('0xpaymaster');
  });

  it('throws when PlatformOnboarded event is not found in logs', async () => {
    const mockContract = {
      deployPlatformPaymaster: vi.fn(() =>
        Promise.resolve({
          wait: vi.fn(() => Promise.resolve({ transactionHash: TX_HASH, logs: [] })),
        }),
      ),
      interface: {
        parseLog: vi.fn(() => {
          throw new Error('unknown log');
        }),
      },
    };
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
    vi.mocked(isV6EthersProvider).mockReturnValue(false);

    const ethSigner = { provider: {}, getAddress: vi.fn(() => Promise.resolve('0xdeployer')) };
    await expect(
      deployPlatformPaymaster(ethSigner as any, { factoryAddress: FACTORY_ADDRESS, salt: SALT }),
    ).rejects.toThrow('PlatformOnboarded event not found');
  });
});

// ─── deployPlatformPaymaster (ethers v6 path) ─────────────────────────────────

describe('deployPlatformPaymaster — ethers v6 signer', () => {
  const makeMockV6Contract = () => ({
    deployPlatformPaymaster: vi.fn(() =>
      Promise.resolve({
        wait: vi.fn(() =>
          Promise.resolve({
            hash: TX_HASH,
            logs: [{ address: FACTORY_ADDRESS, topics: [], data: '0x' }],
          }),
        ),
      }),
    ),
    interface: {
      parseLog: vi.fn(() => ({
        name: 'PlatformOnboarded',
        args: { paymaster: '0xpaymaster' },
      })),
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deployPlatformPaymaster on the contract with correct args', async () => {
    const mockContract = makeMockV6Contract();
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
    vi.mocked(isV6EthersProvider).mockReturnValue(true);

    const ethSigner = { provider: {}, getAddress: vi.fn(() => Promise.resolve('0xdeployer')) };
    await deployPlatformPaymaster(ethSigner as any, {
      factoryAddress: FACTORY_ADDRESS,
      salt: SALT,
    });

    expect(mockContract.deployPlatformPaymaster).toHaveBeenCalledWith('0xdeployer', 0n, SALT);
  });

  it('returns receipt.hash (not transactionHash) as txHash', async () => {
    const mockContract = makeMockV6Contract();
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
    vi.mocked(isV6EthersProvider).mockReturnValue(true);

    const ethSigner = { provider: {}, getAddress: vi.fn(() => Promise.resolve('0xdeployer')) };
    const result = await deployPlatformPaymaster(ethSigner as any, {
      factoryAddress: FACTORY_ADDRESS,
      salt: SALT,
    });

    expect(result.txHash).toBe(TX_HASH);
    expect(result.paymasterAddress).toBe('0xpaymaster');
  });

  it('throws when PlatformOnboarded event is not found in logs', async () => {
    const mockContract = {
      deployPlatformPaymaster: vi.fn(() =>
        Promise.resolve({
          wait: vi.fn(() => Promise.resolve({ hash: TX_HASH, logs: [] })),
        }),
      ),
      interface: {
        parseLog: vi.fn(() => {
          throw new Error('unknown log');
        }),
      },
    };
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
    vi.mocked(isV6EthersProvider).mockReturnValue(true);

    const ethSigner = { provider: {}, getAddress: vi.fn(() => Promise.resolve('0xdeployer')) };
    await expect(
      deployPlatformPaymaster(ethSigner as any, { factoryAddress: FACTORY_ADDRESS, salt: SALT }),
    ).rejects.toThrow('PlatformOnboarded event not found');
  });
});

// ─── deployPlatformPaymaster (viem — missing event) ───────────────────────────

describe('deployPlatformPaymaster — viem missing PlatformOnboarded event', () => {
  const makeMockWalletClient = () => ({
    writeContract: vi.fn(() => Promise.resolve(TX_HASH)),
    account: { address: '0xdeployer' as `0x${string}` },
    chain: { id: 11155111 },
  });

  const makeMockPublicClient = () => ({
    waitForTransactionReceipt: vi.fn(() => Promise.resolve({ logs: [] })),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(parseEventLogs).mockReturnValue([] as any);
  });

  it('throws when parseEventLogs returns empty array', async () => {
    const walletClient = makeMockWalletClient();
    const publicClient = makeMockPublicClient();
    await expect(
      deployPlatformPaymaster(
        walletClient as any,
        { factoryAddress: FACTORY_ADDRESS, salt: SALT },
        publicClient as any,
      ),
    ).rejects.toThrow('PlatformOnboarded event not found');
  });
});
