import { vi } from 'vitest';
import { ethers as ethersV5 } from 'ethers';
import { JsonRpcProvider as JsonRpcProviderV6 } from 'ethersV6';
export const MOCK_V5_ADDRESS = '0xV5TokenRegistryContract';
export const MOCK_V4_ADDRESS = '0xV4TokenRegistryContract';
export const MOCK_OWNER_ADDRESS = '0xowner';

vi.mock('../../core', () => ({
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
      },
      TradeTrustToken__factory: {
        connect: vi.fn(() => mockV5TradeTrustTokenContract),
      },
      TitleEscrowFactory__factory: {
        connect: vi.fn(() => mockV5TitleEscrowFactoryContract),
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
      },
      TradeTrustToken__factory: {
        connect: vi.fn(() => mockV4TradeTrustTokenContract),
      },
      TitleEscrowFactory__factory: {
        connect: vi.fn(() => mockV4TitleEscrowFactoryContract),
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
  burn: vi.fn(() => Promise.resolve('v5_burn_tx_hash')),
  restore: vi.fn(() => Promise.resolve('v5_restore_tx_hash')),
  mint: vi.fn(() => Promise.resolve('v5_mint_tx_hash')),
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
  transferHolder: vi.fn(() => Promise.resolve('v5_transfer_holder_tx_hash')),
  transferBeneficiary: vi.fn(() => Promise.resolve('v5_transfer_beneficiary_tx_hash')),
  transferOwners: vi.fn(() => Promise.resolve('v5_transfer_owners_tx_hash')),
  nominate: vi.fn(() => Promise.resolve('v5_nominate_tx_hash')),
  holder: vi.fn(() => Promise.resolve('0xcurrent_holder')),
  beneficiary: vi.fn(() => Promise.resolve('0xcurrent_beneficiary')),
  rejectTransferHolder: vi.fn(() => Promise.resolve('v5_reject_transfer_holder_tx_hash')),
  rejectTransferBeneficiary: vi.fn(() => Promise.resolve('v5_reject_transfer_beneficiary_tx_hash')),
  rejectTransferOwners: vi.fn(() => Promise.resolve('v5_reject_transfer_owners_tx_hash')),
  returnToIssuer: vi.fn(() => Promise.resolve('v5_return_to_issuer_tx_hash')),
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
  transferHolder: vi.fn(() => Promise.resolve('v4_transfer_holder_tx_hash')),
  transferBeneficiary: vi.fn(() => Promise.resolve('v4_transfer_beneficiary_tx_hash')),
  transferOwners: vi.fn(() => Promise.resolve('v4_transfer_owners_tx_hash')),
  nominate: vi.fn(() => Promise.resolve('v4_nominate_tx_hash')),
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
  burn: vi.fn(() => Promise.resolve('v4_burn_tx_hash')),
  restore: vi.fn(() => Promise.resolve('v4_restore_tx_hash')),
  mint: vi.fn(() => Promise.resolve('v4_mint_tx_hash')),
  ownerOf: vi.fn(() => Promise.resolve(MOCK_OWNER_ADDRESS)),
};

export const PRIVATE_KEY = '0x59c6995e998f97a5a004497e5f1ebce0c16828d44b3f8d0bfa3a89d271d5b6b9'; // random local key

export const providerV5 = new ethersV5.providers.JsonRpcProvider();
export const providerV6 = new JsonRpcProviderV6();
