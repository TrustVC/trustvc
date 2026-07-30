import { vi } from 'vitest';
import { ethers as ethersV5 } from 'ethers';
import { JsonRpcProvider as JsonRpcProviderV6 } from 'ethersV6';
import * as originalModule from '../../utils/ethers';
import * as tokenRegistryFunctions from '../../token-registry-functions/utils';

export const MOCK_OBLIGATION_REGISTRY_ADDRESS = '0xObligationRegistryContract';
export const MOCK_OBLIGATION_ESCROW_ADDRESS = '0xObligationEscrowContract';
export const MOCK_OWNER_ADDRESS = '0xowner';

vi.mock('../../token-registry-functions/utils', async (importOriginal) => {
  const original = (await importOriginal()) as typeof tokenRegistryFunctions;
  return {
    ...original,
    getChainIdSafe: vi.fn().mockResolvedValue(1),
    getTxOptions: vi.fn().mockResolvedValue({}),
  };
});

vi.mock('../../utils/ethers', async (importOriginal) => {
  const original = (await importOriginal()) as typeof originalModule;

  const MockContractConstructor = vi.fn((address: string) => {
    if (address === MOCK_OBLIGATION_REGISTRY_ADDRESS) {
      return mockTrustVCTokenContract;
    }
    return mockObligationEscrowContract;
  });

  return {
    ...original,
    getEthersContractFromProvider: vi.fn(() => MockContractConstructor),
    getEthersContractFactoryFromProvider: vi.fn(() => vi.fn()),
    isV6EthersProvider: vi.fn().mockImplementation(original.isV6EthersProvider),
  };
});

vi.mock('../../core', () => ({
  encrypt: vi.fn(() => 'encrypted_remarks'),
  getObligationEscrowAddress: vi.fn(),
  checkSupportsInterface: vi.fn(),
}));

vi.mock('../../token-registry-v5', async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;
  return {
    ...original,
    v5Contracts: {
      TrustVCToken__factory: {
        abi: 'TrustVCToken',
        bytecode: '0x60806040',
      },
      ObligationEscrow__factory: {
        abi: 'ObligationEscrow',
        bytecode: '0x60806040',
      },
      ObligationEscrowFactory__factory: {
        abi: 'ObligationEscrowFactory',
        bytecode: '0x60806040',
      },
    },
    v5SupportInterfaceIds: {
      TradeTrustTokenMintable: '0xTradeTrustTokenMintableIdV5',
      TradeTrustTokenRestorable: '0xTradeTrustTokenRestorableIdV5',
      TradeTrustTokenBurnable: '0xTradeTrustTokenBurnableIdV5',
      SBT: '0xSBTIdV5',
    },
  };
});

const assignTxMethod = (hash: string) =>
  Object.assign(
    vi.fn(() => Promise.resolve(hash)),
    {
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  );

export const mockTrustVCTokenContract = {
  callStatic: {
    burn: vi.fn(),
    restore: vi.fn(),
    mint: vi.fn(),
  },
  mint: assignTxMethod('mint_tx_hash'),
  burn: assignTxMethod('burn_tx_hash'),
  restore: assignTxMethod('restore_tx_hash'),
  ownerOf: vi.fn(() => Promise.resolve(MOCK_OWNER_ADDRESS)),
};

export const mockObligationEscrowContract = {
  callStatic: {
    accept: vi.fn(),
    reject: vi.fn(),
    discharge: vi.fn(),
    transferHolder: vi.fn(),
    transferBeneficiary: vi.fn(),
    transferOwners: vi.fn(),
    nominate: vi.fn(),
    rejectTransferHolder: vi.fn(),
    rejectTransferBeneficiary: vi.fn(),
    rejectTransferOwners: vi.fn(),
    returnToIssuer: vi.fn(),
  },
  accept: assignTxMethod('accept_tx_hash'),
  reject: assignTxMethod('reject_tx_hash'),
  discharge: assignTxMethod('discharge_tx_hash'),
  transferHolder: assignTxMethod('transfer_holder_tx_hash'),
  transferBeneficiary: assignTxMethod('transfer_beneficiary_tx_hash'),
  transferOwners: assignTxMethod('transfer_owners_tx_hash'),
  nominate: assignTxMethod('nominate_tx_hash'),
  rejectTransferHolder: assignTxMethod('reject_transfer_holder_tx_hash'),
  rejectTransferBeneficiary: assignTxMethod('reject_transfer_beneficiary_tx_hash'),
  rejectTransferOwners: assignTxMethod('reject_transfer_owners_tx_hash'),
  returnToIssuer: assignTxMethod('return_to_issuer_tx_hash'),
  status: vi.fn(() => Promise.resolve(1)),
  isRegistered: vi.fn(() => Promise.resolve(true)),
  terminationReason: vi.fn(() => Promise.resolve(0)),
};

export const PRIVATE_KEY = '0x59c6995e998f97a5a004497e5f1ebce0c16828d44b3f8d0bfa3a89d271d5b6b9';

export const providerV5 = new ethersV5.providers.JsonRpcProvider();
vi.spyOn(providerV5, 'getNetwork').mockResolvedValue({
  name: 'mainnet',
  chainId: 1,
});

export const providerV6 = new JsonRpcProviderV6();
