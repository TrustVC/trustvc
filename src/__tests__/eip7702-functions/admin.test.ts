import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('@trustvc/eip7702', () => ({
  abis: { platformPaymasterAbi: [] },
  constants: {
    ChainId: { Sepolia: 11155111, Amoy: 80002 },
    contractAddress: {
      PlatformAccountFactory: { 11155111: '0xfactory', 80002: '0xfactoryAmoy' },
      PaymasterImplementation: { 11155111: '0xpaymasterImpl', 80002: '0xpaymasterImplAmoy' },
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

import {
  setUserWhitelist,
  removeUserFromWhitelist,
  addRegistry,
  removeRegistry,
  addTitleEscrow,
  removeTitleEscrow,
  addAuthorizedCaller,
  removeAuthorizedCaller,
  setDailyLimit,
  stakePaymaster,
  fundPaymaster,
  delegateUser,
} from '../../eip7702-functions';
import { getEthersContractFromProvider, isV6EthersProvider } from '../../utils/ethers';

const PAYMASTER = '0xabcdef1234567890123456789012345678901234' as `0x${string}`;
const USER = '0x1111111111111111111111111111111111111111' as `0x${string}`;
const REGISTRY = '0x2222222222222222222222222222222222222222' as `0x${string}`;
const TITLE_ESCROW = '0x3333333333333333333333333333333333333333' as `0x${string}`;
const CALLER = '0x4444444444444444444444444444444444444444' as `0x${string}`;
const TX_HASH = '0xtxhash' as `0x${string}`;

// ─── viem WalletClient helpers ────────────────────────────────────────────────

const makeViemSigner = () => ({
  writeContract: vi.fn(() => Promise.resolve(TX_HASH)),
  account: { address: '0xowner' as `0x${string}` },
  chain: { id: 11155111 },
});

// ─── ethers v5 signer helpers ─────────────────────────────────────────────────

const makeEthersV5Contract = (fnName: string) => ({
  [fnName]: vi.fn(() =>
    Promise.resolve({
      wait: vi.fn(() => Promise.resolve({ transactionHash: TX_HASH })),
    }),
  ),
});

const makeEthersV5Signer = () => ({ provider: {} });

function setupEthersV5Mock(fnName: string) {
  const mockContract = makeEthersV5Contract(fnName);
  vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
  vi.mocked(isV6EthersProvider).mockReturnValue(false);
  return mockContract;
}

// ─── ethers v6 signer helpers ─────────────────────────────────────────────────

const makeEthersV6Contract = (fnName: string) => ({
  [fnName]: vi.fn(() => Promise.resolve({ hash: TX_HASH })),
});

function setupEthersV6Mock(fnName: string) {
  const mockContract = makeEthersV6Contract(fnName);
  vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
  vi.mocked(isV6EthersProvider).mockReturnValue(true);
  return mockContract;
}

// ─── setUserWhitelist ─────────────────────────────────────────────────────────

describe('setUserWhitelist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with correct functionName and args', async () => {
    const signer = makeViemSigner();
    await setUserWhitelist(signer as any, PAYMASTER, USER, 2n);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'setUserWhitelist',
        args: [USER, 2n],
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    const result = await setUserWhitelist(signer as any, PAYMASTER, USER, 1n);
    expect(result).toBe(TX_HASH);
  });

  it('viem — rejects when writeContract throws', async () => {
    const signer = makeViemSigner();
    signer.writeContract.mockRejectedValueOnce(new Error('network error'));
    await expect(setUserWhitelist(signer as any, PAYMASTER, USER, 1n)).rejects.toThrow(
      'network error',
    );
  });

  it('ethers v5 — calls setUserWhitelist on the contract with correct args', async () => {
    const mockContract = setupEthersV5Mock('setUserWhitelist');
    const signer = makeEthersV5Signer();
    await setUserWhitelist(signer as any, PAYMASTER, USER, 3n);
    expect(mockContract.setUserWhitelist).toHaveBeenCalledWith(USER, 3n);
  });

  it('ethers v5 — returns the transaction hash', async () => {
    setupEthersV5Mock('setUserWhitelist');
    const signer = makeEthersV5Signer();
    const result = await setUserWhitelist(signer as any, PAYMASTER, USER, 1n);
    expect(result).toBe(TX_HASH);
  });

  it('ethers v6 — calls setUserWhitelist on the contract with correct args', async () => {
    const mockContract = setupEthersV6Mock('setUserWhitelist');
    await setUserWhitelist(makeEthersV5Signer() as any, PAYMASTER, USER, 2n);
    expect(mockContract.setUserWhitelist).toHaveBeenCalledWith(USER, 2n);
  });

  it('ethers v6 — returns tx.hash directly (no .wait())', async () => {
    setupEthersV6Mock('setUserWhitelist');
    const result = await setUserWhitelist(makeEthersV5Signer() as any, PAYMASTER, USER, 1n);
    expect(result).toBe(TX_HASH);
  });
});

// ─── removeUserFromWhitelist ──────────────────────────────────────────────────

describe('removeUserFromWhitelist', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with correct functionName and args', async () => {
    const signer = makeViemSigner();
    await removeUserFromWhitelist(signer as any, PAYMASTER, USER);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'removeUserFromWhitelist',
        args: [USER],
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await removeUserFromWhitelist(signer as any, PAYMASTER, USER)).toBe(TX_HASH);
  });

  it('ethers v5 — calls removeUserFromWhitelist on the contract', async () => {
    const mockContract = setupEthersV5Mock('removeUserFromWhitelist');
    await removeUserFromWhitelist(makeEthersV5Signer() as any, PAYMASTER, USER);
    expect(mockContract.removeUserFromWhitelist).toHaveBeenCalledWith(USER);
  });

  it('ethers v6 — returns tx.hash directly (no .wait())', async () => {
    setupEthersV6Mock('removeUserFromWhitelist');
    const result = await removeUserFromWhitelist(makeEthersV5Signer() as any, PAYMASTER, USER);
    expect(result).toBe(TX_HASH);
  });
});

// ─── addRegistry ──────────────────────────────────────────────────────────────

describe('addRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with correct functionName and args', async () => {
    const signer = makeViemSigner();
    await addRegistry(signer as any, PAYMASTER, REGISTRY);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'addRegistry',
        args: [REGISTRY],
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await addRegistry(signer as any, PAYMASTER, REGISTRY)).toBe(TX_HASH);
  });

  it('ethers v5 — calls addRegistry on the contract', async () => {
    const mockContract = setupEthersV5Mock('addRegistry');
    await addRegistry(makeEthersV5Signer() as any, PAYMASTER, REGISTRY);
    expect(mockContract.addRegistry).toHaveBeenCalledWith(REGISTRY);
  });

  it('ethers v6 — returns tx.hash directly (no .wait())', async () => {
    setupEthersV6Mock('addRegistry');
    const result = await addRegistry(makeEthersV5Signer() as any, PAYMASTER, REGISTRY);
    expect(result).toBe(TX_HASH);
  });
});

// ─── removeRegistry ───────────────────────────────────────────────────────────

describe('removeRegistry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with correct functionName and args', async () => {
    const signer = makeViemSigner();
    await removeRegistry(signer as any, PAYMASTER, REGISTRY);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'removeRegistry',
        args: [REGISTRY],
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await removeRegistry(signer as any, PAYMASTER, REGISTRY)).toBe(TX_HASH);
  });

  it('ethers v5 — calls removeRegistry on the contract', async () => {
    const mockContract = setupEthersV5Mock('removeRegistry');
    await removeRegistry(makeEthersV5Signer() as any, PAYMASTER, REGISTRY);
    expect(mockContract.removeRegistry).toHaveBeenCalledWith(REGISTRY);
  });

  it('ethers v6 — returns tx.hash directly (no .wait())', async () => {
    setupEthersV6Mock('removeRegistry');
    const result = await removeRegistry(makeEthersV5Signer() as any, PAYMASTER, REGISTRY);
    expect(result).toBe(TX_HASH);
  });
});

// ─── addTitleEscrow ───────────────────────────────────────────────────────────

describe('addTitleEscrow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with correct functionName and args', async () => {
    const signer = makeViemSigner();
    await addTitleEscrow(signer as any, PAYMASTER, TITLE_ESCROW);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'addTitleEscrow',
        args: [TITLE_ESCROW],
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await addTitleEscrow(signer as any, PAYMASTER, TITLE_ESCROW)).toBe(TX_HASH);
  });

  it('ethers v5 — calls addTitleEscrow on the contract', async () => {
    const mockContract = setupEthersV5Mock('addTitleEscrow');
    await addTitleEscrow(makeEthersV5Signer() as any, PAYMASTER, TITLE_ESCROW);
    expect(mockContract.addTitleEscrow).toHaveBeenCalledWith(TITLE_ESCROW);
  });

  it('ethers v6 — returns tx.hash directly (no .wait())', async () => {
    setupEthersV6Mock('addTitleEscrow');
    const result = await addTitleEscrow(makeEthersV5Signer() as any, PAYMASTER, TITLE_ESCROW);
    expect(result).toBe(TX_HASH);
  });
});

// ─── removeTitleEscrow ────────────────────────────────────────────────────────

describe('removeTitleEscrow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with correct functionName and args', async () => {
    const signer = makeViemSigner();
    await removeTitleEscrow(signer as any, PAYMASTER, TITLE_ESCROW);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'removeTitleEscrow',
        args: [TITLE_ESCROW],
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await removeTitleEscrow(signer as any, PAYMASTER, TITLE_ESCROW)).toBe(TX_HASH);
  });

  it('ethers v5 — calls removeTitleEscrow on the contract', async () => {
    const mockContract = setupEthersV5Mock('removeTitleEscrow');
    await removeTitleEscrow(makeEthersV5Signer() as any, PAYMASTER, TITLE_ESCROW);
    expect(mockContract.removeTitleEscrow).toHaveBeenCalledWith(TITLE_ESCROW);
  });

  it('ethers v6 — returns tx.hash directly (no .wait())', async () => {
    setupEthersV6Mock('removeTitleEscrow');
    const result = await removeTitleEscrow(makeEthersV5Signer() as any, PAYMASTER, TITLE_ESCROW);
    expect(result).toBe(TX_HASH);
  });
});

// ─── addAuthorizedCaller ──────────────────────────────────────────────────────

describe('addAuthorizedCaller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with correct functionName and args', async () => {
    const signer = makeViemSigner();
    await addAuthorizedCaller(signer as any, PAYMASTER, CALLER);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'addAuthorizedCaller',
        args: [CALLER],
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await addAuthorizedCaller(signer as any, PAYMASTER, CALLER)).toBe(TX_HASH);
  });

  it('ethers v5 — calls addAuthorizedCaller on the contract', async () => {
    const mockContract = setupEthersV5Mock('addAuthorizedCaller');
    await addAuthorizedCaller(makeEthersV5Signer() as any, PAYMASTER, CALLER);
    expect(mockContract.addAuthorizedCaller).toHaveBeenCalledWith(CALLER);
  });

  it('ethers v6 — returns tx.hash directly (no .wait())', async () => {
    setupEthersV6Mock('addAuthorizedCaller');
    const result = await addAuthorizedCaller(makeEthersV5Signer() as any, PAYMASTER, CALLER);
    expect(result).toBe(TX_HASH);
  });
});

// ─── removeAuthorizedCaller ───────────────────────────────────────────────────

describe('removeAuthorizedCaller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with correct functionName and args', async () => {
    const signer = makeViemSigner();
    await removeAuthorizedCaller(signer as any, PAYMASTER, CALLER);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'removeAuthorizedCaller',
        args: [CALLER],
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await removeAuthorizedCaller(signer as any, PAYMASTER, CALLER)).toBe(TX_HASH);
  });

  it('ethers v5 — calls removeAuthorizedCaller on the contract', async () => {
    const mockContract = setupEthersV5Mock('removeAuthorizedCaller');
    await removeAuthorizedCaller(makeEthersV5Signer() as any, PAYMASTER, CALLER);
    expect(mockContract.removeAuthorizedCaller).toHaveBeenCalledWith(CALLER);
  });

  it('ethers v6 — returns tx.hash directly (no .wait())', async () => {
    setupEthersV6Mock('removeAuthorizedCaller');
    const result = await removeAuthorizedCaller(makeEthersV5Signer() as any, PAYMASTER, CALLER);
    expect(result).toBe(TX_HASH);
  });
});

// ─── setDailyLimit ────────────────────────────────────────────────────────────

describe('setDailyLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with correct functionName and args', async () => {
    const signer = makeViemSigner();
    await setDailyLimit(signer as any, PAYMASTER, 1000000n);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'setDailyLimit',
        args: [1000000n],
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await setDailyLimit(signer as any, PAYMASTER, 0n)).toBe(TX_HASH);
  });

  it('viem — supports 0n (unlimited)', async () => {
    const signer = makeViemSigner();
    await setDailyLimit(signer as any, PAYMASTER, 0n);
    expect(signer.writeContract).toHaveBeenCalledWith(expect.objectContaining({ args: [0n] }));
  });

  it('ethers v5 — calls setDailyLimit on the contract', async () => {
    const mockContract = setupEthersV5Mock('setDailyLimit');
    await setDailyLimit(makeEthersV5Signer() as any, PAYMASTER, 500n);
    expect(mockContract.setDailyLimit).toHaveBeenCalledWith(500n);
  });

  it('ethers v5 — returns the transaction hash', async () => {
    setupEthersV5Mock('setDailyLimit');
    const result = await setDailyLimit(makeEthersV5Signer() as any, PAYMASTER, 500n);
    expect(result).toBe(TX_HASH);
  });

  it('ethers v6 — returns tx.hash directly (no .wait())', async () => {
    setupEthersV6Mock('setDailyLimit');
    const result = await setDailyLimit(makeEthersV5Signer() as any, PAYMASTER, 500n);
    expect(result).toBe(TX_HASH);
  });
});

// ─── sendAdminTx error propagation ───────────────────────────────────────────

describe('sendAdminTx error propagation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — propagates rejection from writeContract', async () => {
    const signer = makeViemSigner();
    signer.writeContract.mockRejectedValueOnce(new Error('tx reverted'));
    await expect(setDailyLimit(signer as any, PAYMASTER, 100n)).rejects.toThrow('tx reverted');
  });

  it('ethers v5 — propagates rejection from contract call', async () => {
    const mockContract = { setDailyLimit: vi.fn(() => Promise.reject(new Error('call failed'))) };
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
    vi.mocked(isV6EthersProvider).mockReturnValue(false);
    await expect(setDailyLimit(makeEthersV5Signer() as any, PAYMASTER, 100n)).rejects.toThrow(
      'call failed',
    );
  });

  it('ethers v5 — propagates rejection from tx.wait()', async () => {
    const mockContract = {
      setDailyLimit: vi.fn(() =>
        Promise.resolve({ wait: vi.fn(() => Promise.reject(new Error('wait failed'))) }),
      ),
    };
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
    vi.mocked(isV6EthersProvider).mockReturnValue(false);
    await expect(setDailyLimit(makeEthersV5Signer() as any, PAYMASTER, 100n)).rejects.toThrow(
      'wait failed',
    );
  });

  it('ethers v6 — propagates rejection from contract call', async () => {
    const mockContract = {
      setDailyLimit: vi.fn(() => Promise.reject(new Error('v6 call failed'))),
    };
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as any);
    vi.mocked(isV6EthersProvider).mockReturnValue(true);
    await expect(setDailyLimit(makeEthersV5Signer() as any, PAYMASTER, 100n)).rejects.toThrow(
      'v6 call failed',
    );
  });
});

// ─── stakePaymaster ───────────────────────────────────────────────────────────

describe('stakePaymaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with addStake, correct args, and value', async () => {
    const signer = makeViemSigner();
    await stakePaymaster(signer as never, PAYMASTER, 86400, 1000000000000000000n);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'addStake',
        args: [86400],
        value: 1000000000000000000n,
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await stakePaymaster(signer as never, PAYMASTER, 86400, 1n)).toBe(TX_HASH);
  });

  it('ethers v5 — calls addStake with args and value override', async () => {
    const mockContract = makeEthersV5Contract('addStake');
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as never);
    vi.mocked(isV6EthersProvider).mockReturnValue(false);
    await stakePaymaster(makeEthersV5Signer() as never, PAYMASTER, 86400, 500n);
    expect(mockContract.addStake).toHaveBeenCalledWith(86400, { value: 500n });
  });

  it('ethers v5 — returns the transaction hash', async () => {
    setupEthersV5Mock('addStake');
    expect(await stakePaymaster(makeEthersV5Signer() as never, PAYMASTER, 86400, 1n)).toBe(TX_HASH);
  });

  it('ethers v6 — returns tx.hash directly', async () => {
    setupEthersV6Mock('addStake');
    expect(await stakePaymaster(makeEthersV5Signer() as never, PAYMASTER, 86400, 1n)).toBe(TX_HASH);
  });
});

// ─── fundPaymaster ────────────────────────────────────────────────────────────

describe('fundPaymaster', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viem — calls writeContract with deposit and value', async () => {
    const signer = makeViemSigner();
    await fundPaymaster(signer as never, PAYMASTER, 2000000000000000000n);
    expect(signer.writeContract).toHaveBeenCalledWith(
      expect.objectContaining({
        address: PAYMASTER,
        functionName: 'deposit',
        args: [],
        value: 2000000000000000000n,
      }),
    );
  });

  it('viem — returns the transaction hash', async () => {
    const signer = makeViemSigner();
    expect(await fundPaymaster(signer as never, PAYMASTER, 1n)).toBe(TX_HASH);
  });

  it('ethers v5 — calls deposit with value override', async () => {
    const mockContract = makeEthersV5Contract('deposit');
    vi.mocked(getEthersContractFromProvider).mockReturnValue(vi.fn(() => mockContract) as never);
    vi.mocked(isV6EthersProvider).mockReturnValue(false);
    await fundPaymaster(makeEthersV5Signer() as never, PAYMASTER, 999n);
    expect(mockContract.deposit).toHaveBeenCalledWith({ value: 999n });
  });

  it('ethers v5 — returns the transaction hash', async () => {
    setupEthersV5Mock('deposit');
    expect(await fundPaymaster(makeEthersV5Signer() as never, PAYMASTER, 1n)).toBe(TX_HASH);
  });

  it('ethers v6 — returns tx.hash directly', async () => {
    setupEthersV6Mock('deposit');
    expect(await fundPaymaster(makeEthersV5Signer() as never, PAYMASTER, 1n)).toBe(TX_HASH);
  });
});

// ─── delegateUser ─────────────────────────────────────────────────────────────

const IMPL = '0x5555555555555555555555555555555555555555' as `0x${string}`;
const OWNER_ADDR = '0xowner' as `0x${string}`;
const SIGNED_AUTH = {
  contractAddress: IMPL,
  chainId: 11155111,
  nonce: 1,
  r: '0x',
  s: '0x',
  yParity: 0,
};

const makeOwnerSigner = () => ({
  account: { address: OWNER_ADDR },
  chain: { id: 11155111 },
  signAuthorization: vi.fn(() => Promise.resolve(SIGNED_AUTH)),
  sendTransaction: vi.fn(() => Promise.resolve(TX_HASH)),
});

const makePayerSigner = () => ({
  account: { address: '0xpayer' as `0x${string}` },
  chain: { id: 11155111 },
  sendTransaction: vi.fn(() => Promise.resolve(TX_HASH)),
});

describe('delegateUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('owner signs authorization with the implementation address', async () => {
    const owner = makeOwnerSigner();
    await delegateUser(IMPL, owner as never);
    expect(owner.signAuthorization).toHaveBeenCalledWith(
      expect.objectContaining({ contractAddress: IMPL }),
    );
  });

  it('without payerSigner — owner submits and pays gas', async () => {
    const owner = makeOwnerSigner();
    await delegateUser(IMPL, owner as never);
    expect(owner.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ authorizationList: [SIGNED_AUTH], to: OWNER_ADDR, data: '0x' }),
    );
  });

  it('with payerSigner — payer submits the transaction, owner does not', async () => {
    const owner = makeOwnerSigner();
    const payer = makePayerSigner();
    await delegateUser(IMPL, owner as never, payer as never);
    expect(payer.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ authorizationList: [SIGNED_AUTH], to: OWNER_ADDR, data: '0x' }),
    );
    expect(owner.sendTransaction).not.toHaveBeenCalled();
  });

  it('returns the transaction hash', async () => {
    const owner = makeOwnerSigner();
    expect(await delegateUser(IMPL, owner as never)).toBe(TX_HASH);
  });

  it('throws if ownerSigner has no account', async () => {
    const owner = { ...makeOwnerSigner(), account: undefined as undefined };
    await expect(delegateUser(IMPL, owner as never)).rejects.toThrow(
      'ownerSigner must have an account',
    );
  });

  it('throws if payerSigner has no account', async () => {
    const owner = makeOwnerSigner();
    const payer = { ...makePayerSigner(), account: undefined as undefined };
    await expect(delegateUser(IMPL, owner as never, payer as never)).rejects.toThrow(
      'payerSigner must have an account',
    );
  });

  it('throws if ownerSigner and payerSigner are on different chains', async () => {
    const owner = makeOwnerSigner(); // chain id 11155111
    const payer = { ...makePayerSigner(), chain: { id: 80002 } };
    await expect(delegateUser(IMPL, owner as never, payer as never)).rejects.toThrow(
      'chain mismatch',
    );
  });
});
