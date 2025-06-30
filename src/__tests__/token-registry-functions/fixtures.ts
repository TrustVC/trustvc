import { vi } from 'vitest';
import { ethers as ethersV5 } from 'ethers';
import { JsonRpcProvider as JsonRpcProviderV6 } from 'ethersV6';

vi.mock('src/core', () => ({
  encrypt: vi.fn(() => 'encrypted_remarks'),
  getTitleEscrowAddress: vi.fn(() => Promise.resolve('0xv5contract')),
  isTitleEscrowVersion: vi.fn(() => Promise.resolve(true)),
  TitleEscrowInterface: {
    V4: '0xTitleEscrowIdV4',
    V5: '0xTitleEscrowIdV5',
  },
}));

vi.mock('src/token-registry-v5', () => {
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
    },
  };
});

vi.mock('src/token-registry-v4', () => {
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
      v4SupportInterfaceIds: {
        TitleEscrow: '0xTitleEscrowIdV4',
        TradeTrustTokenMintable: '0xTradeTrustTokenMintableIdV4',
      },
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
  supportsInterface: vi.fn(),
  titleEscrowFactory: vi.fn(() => Promise.resolve('0xV5titleescrowfactory')),
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
};

export const mockV4TitleEscrowContract = {
  callStatic: {
    transferHolder: vi.fn(),
    transferBeneficiary: vi.fn(),
    transferOwners: vi.fn(),
    nominate: vi.fn(),
  },
  transferHolder: vi.fn(() => Promise.resolve('v4_transfer_holder_tx_hash')),
  transferBeneficiary: vi.fn(() => Promise.resolve('v4_transfer_beneficiary_tx_hash')),
  transferOwners: vi.fn(() => Promise.resolve('v4_transfer_owners_tx_hash')),
  nominate: vi.fn(() => Promise.resolve('v4_nominate_tx_hash')),
  holder: vi.fn(() => Promise.resolve('0xcurrent_holder')),
  beneficiary: vi.fn(() => Promise.resolve('0xcurrent_beneficiary')),
};
export const mockV4TitleEscrowFactoryContract = {
  callStatic: {
    getEscrowAddress: vi.fn(),
  },
  getAddress: vi.fn(() => Promise.resolve('0xV4titleescrow')),
};

export const mockV4TradeTrustTokenContract = {
  titleEscrowFactory: vi.fn(() => Promise.resolve('0xV4titleescrowfactory')),
};

export const PRIVATE_KEY = '0x59c6995e998f97a5a004497e5f1ebce0c16828d44b3f8d0bfa3a89d271d5b6b9'; // random local key

export const providerV5 = new ethersV5.providers.JsonRpcProvider();
export const providerV6 = new JsonRpcProviderV6();
