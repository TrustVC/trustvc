import { vi } from 'vitest';
import { ethers as ethersV5 } from 'ethers';
import { JsonRpcProvider as JsonRpcProviderV6 } from 'ethersV6';
import * as originalModule from '../../utils/ethers';

export const MOCK_V5_ADDRESS = '0xV5TokenRegistryContract';
export const MOCK_V4_ADDRESS = '0xV4TokenRegistryContract';
export const MOCK_OWNER_ADDRESS = '0xowner';

vi.mock('../../utils/ethers', async (importOriginal) => {
  const original = (await importOriginal()) as typeof originalModule;

  return {
    ...original, // Keep all original exports
    getEthersContractFromProvider: vi.fn(() => vi.fn()), // Only mock this function
  };
});

vi.mock('src/core', () => ({
  encrypt: vi.fn(() => 'encrypted_remarks'),
  getTitleEscrowAddress: vi.fn(),
  isTitleEscrowVersion: vi.fn(() => Promise.resolve(true)),
  checkSupportsInterface: vi.fn(),

  TitleEscrowInterface: {
    V4: '0xTitleEscrowIdV4',
    V5: '0xTitleEscrowIdV5',
  },
}));

vi.mock('../../token-registry-v5', () => {
  return {
    v5Contracts: {
      TitleEscrow__factory: {
        connect: vi.fn(() => mockV5TitleEscrowContract),
        abi: 'TitleEscrow',
      },
      TradeTrustToken__factory: {
        connect: vi.fn(() => mockV5TradeTrustTokenContract),
        abi: 'TradeTrustToken',
      },
      TitleEscrowFactory__factory: {
        connect: vi.fn(() => mockV5TitleEscrowFactoryContract),
        abi: 'TitleEscrowFactory',
      },
    },
    v5SupportInterfaceIds: {
      TitleEscrow: '0xTitleEscrowIdV5',
      TradeTrustTokenMintable: '0xTradeTrustTokenMintableIdV5',
      TradeTrustTokenRestorable: '0xTradeTrustTokenRestorableIdV5',
      TradeTrustTokenBurnable: '0xTradeTrustTokenBurnableIdV5',
      SBT: '0xSBTIdV5',
    },
  };
});

vi.mock('../../token-registry-v4', () => {
  return {
    v4Contracts: {
      TitleEscrow__factory: {
        connect: vi.fn(() => mockV4TitleEscrowContract),
        abi: 'TitleEscrow',
      },
      TradeTrustToken__factory: {
        connect: vi.fn(() => mockV4TradeTrustTokenContract),
        abi: 'TradeTrustToken',
      },
      TitleEscrowFactory__factory: {
        connect: vi.fn(() => mockV4TitleEscrowFactoryContract),
        abi: 'TitleEscrowFactory',
      },
    },
    v4SupportInterfaceIds: {
      TitleEscrow: '0xTitleEscrowIdV4',
      TradeTrustTokenMintable: '0xTradeTrustTokenMintableIdV4',
      TradeTrustTokenRestorable: '0xTradeTrustTokenRestorableIdV4',
      TradeTrustTokenBurnable: '0xTradeTrustTokenBurnableIdV4',
      SBT: '0xSBTIdV4',
    },
  };
});

export const mockV5TitleEscrowFactoryContract = {
  callStatic: {
    getEscrowAddress: vi.fn(),
  },
  getEscrowAddress: vi.fn(() => Promise.resolve('0xV5titleescrow')),
};

export const mockV5TradeTrustTokenContract = {
  callStatic: {
    burn: vi.fn(),
    restore: vi.fn(),
    mint: vi.fn(),
  },
  supportsInterface: vi.fn(),
  titleEscrowFactory: vi.fn(() => Promise.resolve('0xV5titleescrowfactory')),
  burn: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_burn_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  restore: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_restore_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  mint: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_mint_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  ownerOf: vi.fn(() => Promise.resolve(MOCK_OWNER_ADDRESS)),
};

export const mockV5TitleEscrowContract = {
  supportsInterface: vi.fn(),
  callStatic: {
    transferHolder: vi.fn(),
    transferBeneficiary: vi.fn(),
    transferOwners: vi.fn(),
    nominate: vi.fn(),
    rejectTransferHolder: vi.fn(),
    rejectTransferBeneficiary: vi.fn(),
    rejectTransferOwners: vi.fn(),
    returnToIssuer: vi.fn(),
  },
  transferHolder: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_transfer_holder_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  transferBeneficiary: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_transfer_beneficiary_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  transferOwners: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_transfer_owners_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  nominate: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_nominate_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  holder: vi.fn(() => Promise.resolve('0xcurrent_holder')),
  beneficiary: vi.fn(() => Promise.resolve('0xcurrent_beneficiary')),
  rejectTransferHolder: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_reject_transfer_holder_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  rejectTransferBeneficiary: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_reject_transfer_beneficiary_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  rejectTransferOwners: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_reject_transfer_owners_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  returnToIssuer: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v5_return_to_issuer_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
};

export const mockV4TitleEscrowContract = {
  supportsInterface: vi.fn(),
  callStatic: {
    transferHolder: vi.fn(),
    transferBeneficiary: vi.fn(),
    transferOwners: vi.fn(),
    nominate: vi.fn(),
    surrender: vi.fn(),
  },
  transferHolder: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v4_transfer_holder_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  transferBeneficiary: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v4_transfer_beneficiary_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  transferOwners: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v4_transfer_owners_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  nominate: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v4_nominate_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  holder: vi.fn(() => Promise.resolve('0xcurrent_holder')),
  beneficiary: vi.fn(() => Promise.resolve('0xcurrent_beneficiary')),
  surrender: vi.fn(() => Promise.resolve('v4_surrender_tx_hash')),
};
export const mockV4TitleEscrowFactoryContract = {
  callStatic: {
    getEscrowAddress: vi.fn(),
  },
  getEscrowAddress: vi.fn(() => Promise.resolve('0xV4titleescrow')),
};

export const mockV4TradeTrustTokenContract = {
  callStatic: {
    burn: vi.fn(),
    restore: vi.fn(),
    mint: vi.fn(),
  },
  titleEscrowFactory: vi.fn(() => Promise.resolve('0xV4titleescrowfactory')),
  supportsInterface: vi.fn(),
  burn: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v4_burn_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  restore: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v4_restore_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  mint: Object.assign(
    // Direct call returns hash string
    vi.fn(() => Promise.resolve('v4_mint_tx_hash')),
    {
      // Static call returns boolean
      staticCall: vi.fn(() => Promise.resolve(true)),
    },
  ),
  ownerOf: vi.fn(() => Promise.resolve(MOCK_OWNER_ADDRESS)),
};

export const PRIVATE_KEY = '0x59c6995e998f97a5a004497e5f1ebce0c16828d44b3f8d0bfa3a89d271d5b6b9'; // random local key

export const providerV5 = new ethersV5.providers.JsonRpcProvider();
export const providerV6 = new JsonRpcProviderV6();
