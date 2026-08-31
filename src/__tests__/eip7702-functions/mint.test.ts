import { vi, describe, beforeEach, it, expect } from 'vitest';

vi.mock('../../core', () => ({
  encrypt: vi.fn(() => 'encrypted_remarks'),
}));

vi.mock('viem', () => ({
  encodeFunctionData: vi.fn(() => '0xencodeddata'),
}));

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

import { encrypt } from '../../core';
import { mintGasless } from '../../eip7702-functions';

const PAYMASTER_ADDRESS = '0xabcdef1234567890123456789012345678901234';
const TOKEN_REGISTRY_ADDRESS = '0x1234567890123456789012345678901234567890';
const TX_HASH = '0xtxhash';

const makeMockClient = () => ({
  sendTransaction: vi.fn(() => Promise.resolve(TX_HASH as `0x${string}`)),
});

describe('mintGasless', () => {
  let mockClient: ReturnType<typeof makeMockClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = makeMockClient();
  });

  it('throws if paymasterAddress is missing', async () => {
    await expect(
      mintGasless(
        { paymasterAddress: '', tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
        mockClient,
        { beneficiaryAddress: '0xbeneficiary', holderAddress: '0xholder', tokenId: '0x1' },
        { id: 'doc-id' },
      ),
    ).rejects.toThrow('paymasterAddress is required');
  });

  it('throws if tokenRegistryAddress is missing', async () => {
    await expect(
      mintGasless(
        { paymasterAddress: PAYMASTER_ADDRESS, tokenRegistryAddress: '' },
        mockClient,
        { beneficiaryAddress: '0xbeneficiary', holderAddress: '0xholder', tokenId: '0x1' },
        { id: 'doc-id' },
      ),
    ).rejects.toThrow('tokenRegistryAddress is required');
  });

  it('calls sendTransaction targeting the paymasterAddress', async () => {
    await mintGasless(
      { paymasterAddress: PAYMASTER_ADDRESS, tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
      mockClient,
      { beneficiaryAddress: '0xbeneficiary', holderAddress: '0xholder', tokenId: '0x1' },
      { id: 'doc-id' },
    );
    expect(mockClient.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ to: PAYMASTER_ADDRESS, value: 0n }),
    );
  });

  it('encrypts remarks when provided', async () => {
    await mintGasless(
      { paymasterAddress: PAYMASTER_ADDRESS, tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
      mockClient,
      {
        beneficiaryAddress: '0xbeneficiary',
        holderAddress: '0xholder',
        tokenId: '0x1',
        remarks: 'mint remarks',
      },
      { id: 'doc-id' },
    );
    expect(encrypt).toHaveBeenCalledWith('mint remarks', 'doc-id');
  });

  it('does not call encrypt when remarks are absent', async () => {
    await mintGasless(
      { paymasterAddress: PAYMASTER_ADDRESS, tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
      mockClient,
      { beneficiaryAddress: '0xbeneficiary', holderAddress: '0xholder', tokenId: '0x1' },
      { id: 'doc-id' },
    );
    expect(encrypt).not.toHaveBeenCalled();
  });

  it('returns the transaction hash', async () => {
    const result = await mintGasless(
      { paymasterAddress: PAYMASTER_ADDRESS, tokenRegistryAddress: TOKEN_REGISTRY_ADDRESS },
      mockClient,
      { beneficiaryAddress: '0xbeneficiary', holderAddress: '0xholder', tokenId: '0x1' },
      { id: 'doc-id' },
    );
    expect(result).toBe(TX_HASH);
  });
});
