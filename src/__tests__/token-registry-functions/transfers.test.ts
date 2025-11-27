import './fixtures.js';
import { vi, describe, beforeAll, it, expect } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { ethers as ethersV6, Network, Wallet as WalletV6 } from 'ethersV6';
import * as coreModule from '../../core';
import { encrypt } from '../../core';
import { CHAIN_ID, SUPPORTED_CHAINS } from '../../utils/supportedChains';
import {
  nominate,
  transferBeneficiary,
  transferHolder,
  transferOwners,
} from '../../token-registry-functions';

import {
  mockV4TitleEscrowContract,
  mockV5TitleEscrowContract,
  PRIVATE_KEY,
  providerV5,
  providerV6,
} from './fixtures.js';
import { getEthersContractFromProvider } from '../../utils/ethers/index.js';

// Mock core module
vi.mock('../../core', () => ({
  __esModule: true,
  ...vi.importActual('../../core'),
  encrypt: vi.fn(() => 'encrypted_remarks'),
}));

// Mock gas station
vi.mock('../../core/gas-station', () => ({
  getGasStation: vi.fn(),
}));

// Mock gas station options
vi.mock('../../core/gas-station/mock', () => ({
  getGasOptions: vi.fn(),
}));

const providers: any[] = [
  {
    Provider: providerV5,
    ethersVersion: 'v5',
    titleEscrowVersion: 'v5',
  },
  {
    Provider: providerV6,
    ethersVersion: 'v6',
    titleEscrowVersion: 'v5',
  },
  {
    Provider: providerV5,
    ethersVersion: 'v5',
    titleEscrowVersion: 'v4',
  },
  {
    Provider: providerV6,
    ethersVersion: 'v6',
    titleEscrowVersion: 'v4',
  },
];
describe.each(providers)('Transfers', async ({ Provider, ethersVersion, titleEscrowVersion }) => {
  let wallet: ethersV5.Wallet | ethersV6.Wallet;
  if (ethersVersion === 'v5') {
    wallet = new WalletV5(PRIVATE_KEY, Provider as any) as ethersV5.Wallet;
    vi.spyOn(wallet, 'getChainId').mockResolvedValue(CHAIN_ID.mainnet as unknown as number);
  } else {
    wallet = new WalletV6(PRIVATE_KEY, Provider as any);
    vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
      chainId: CHAIN_ID.mainnet,
    } as unknown as Network);
  }
  const isV5TT = titleEscrowVersion === 'v5';
  const mockTitleEscrowContract = isV5TT ? mockV5TitleEscrowContract : mockV4TitleEscrowContract;
  const titleEscrowAddress = isV5TT ? '0xv5contract' : '0xv4contract';

  // Handle both v5 and v6 contract constructors
  beforeAll(() => {
    // Clear any existing mocks first
    vi.clearAllMocks();
    const mockContractConstructor = (mockContract: any) => vi.fn(() => mockContract);
    // Only set up the mock if it hasn't been set up yet
    vi.mocked(getEthersContractFromProvider).mockReturnValue(
      mockContractConstructor(mockTitleEscrowContract),
    );
  });
  describe(`transfer holder with TR Version ${titleEscrowVersion} and ethers version ${ethersVersion}`, () => {
    const params = isV5TT
      ? {
          holderAddress: '0xholder',
          remarks: '0xencrypted_remarks',
          tokenId: 1,
        }
      : {
          holderAddress: '0xholder',
          tokenId: 1,
        };
    const txHash = isV5TT ? 'v5_transfer_holder_tx_hash' : 'v4_transfer_holder_tx_hash';

    it('throws error if titleEscrowAddress is missing ', async () => {
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockImplementation(() => Promise.resolve(''));

      await expect(
        transferHolder(
          {
            titleEscrowAddress: '',
          },
          wallet,
          params,
          { titleEscrowVersion },
        ),
      ).rejects.toThrow('Token registry address is required');
    });

    it('handles both v5 and v4 contracts when TR version is not provided', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.transferHolder.mockResolvedValue(true);

      const tx = await transferHolder(
        {
          titleEscrowAddress: titleEscrowAddress,
        },
        wallet,
        params,
        { id: 'doc-id', chainId: CHAIN_ID.mainnet },
      );
      if (isV5TT) expect(encrypt).toHaveBeenCalledWith('0xencrypted_remarks', 'doc-id');

      const resultOptions = isV5TT ? ['0xholder', '0xencrypted_remarks', {}] : ['0xholder', {}];

      expect(mockTitleEscrowContract.transferHolder).toHaveBeenCalledWith(...resultOptions);
      expect(tx).toBe(txHash);
    });

    it(`detects version automatically via supportsInterface for ${titleEscrowAddress}`, async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.transferHolder.mockResolvedValue(true);

      const tx = await transferHolder(
        {
          titleEscrowAddress: '0xauto',
        },
        wallet,
        params,
        {}, // no isV5TT provided
      );

      expect(coreModule.isTitleEscrowVersion).toHaveBeenCalledWith({
        provider: wallet.provider,
        titleEscrowAddress: '0xauto',
        versionInterface: isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4',
      });
      expect(tx).toBe(txHash);
    });

    it('calls gas station when gas options are missing', async () => {
      const gasStationMock = vi.fn().mockResolvedValue({
        maxFeePerGas: 100,
        maxPriorityFeePerGas: 50,
      });

      const mockChainId = CHAIN_ID.mainnet;

      const originalChainData = SUPPORTED_CHAINS[mockChainId].gasStation;
      SUPPORTED_CHAINS[mockChainId] = {
        ...SUPPORTED_CHAINS[mockChainId],
        gasStation: gasStationMock,
      };

      mockTitleEscrowContract.callStatic.transferHolder.mockResolvedValue(true);

      await transferHolder(
        {
          titleEscrowAddress: '0xv5contract',
        },
        wallet,
        params,
        { id: 'doc-id', titleEscrowVersion },
      );
      const resultOptions = isV5TT ? ['0xholder', '0xencrypted_remarks'] : ['0xholder'];

      expect(gasStationMock).toHaveBeenCalled();
      expect(mockTitleEscrowContract.transferHolder).toHaveBeenCalledWith(...resultOptions, {
        maxFeePerGas: 100,
        maxPriorityFeePerGas: 50,
      });

      SUPPORTED_CHAINS[mockChainId] = {
        ...SUPPORTED_CHAINS[mockChainId],
        gasStation: originalChainData,
      };
    });

    it('throws error when callStatic fails', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.transferHolder.mockRejectedValue(
        new Error('Simulated failure'),
      );
      mockTitleEscrowContract.transferHolder.staticCall.mockRejectedValue(
        new Error('Simulated failure'),
      );

      await expect(
        transferHolder(
          {
            titleEscrowAddress: '0xv5contract',
          },
          wallet,
          params,
          { id: 'doc-id', titleEscrowVersion },
        ),
      ).rejects.toThrow('Pre-check (callStatic) for transferHolder failed');
      mockTitleEscrowContract.transferHolder.staticCall.mockResolvedValue(true);
    });

    it('handles both v5 and v4 contracts when tokenId and tokenRegistry is provided', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockImplementation(() =>
        Promise.resolve(titleEscrowAddress),
      );
      mockTitleEscrowContract.callStatic.transferHolder.mockResolvedValue(true);

      const tx = await transferHolder(
        {
          tokenId: 1,
          tokenRegistryAddress: '0xtokenregistry',
        },
        wallet,
        params,
        { id: 'doc-id', chainId: CHAIN_ID.mainnet },
      );
      if (isV5TT) expect(encrypt).toHaveBeenCalledWith('0xencrypted_remarks', 'doc-id');

      const resultOptions = isV5TT
        ? [
            '0xholder',
            '0xencrypted_remarks',
            {
              maxFeePerGas: 100,
              maxPriorityFeePerGas: 50,
            },
          ]
        : [
            '0xholder',
            {
              maxFeePerGas: 100,
              maxPriorityFeePerGas: 50,
            },
          ];

      expect(mockTitleEscrowContract.transferHolder).toHaveBeenCalledWith(...resultOptions);
      expect(tx).toBe(txHash);
    });
  });

  describe(`transfer beneficiary with TR Version ${titleEscrowVersion} and ethers version ${ethersVersion}`, () => {
    const params = isV5TT
      ? { newBeneficiaryAddress: '0xbeneficiary', remarks: '0xencrypted_remarks', tokenId: 1 }
      : { newBeneficiaryAddress: '0xbeneficiary', tokenId: 1 };

    const txHash = isV5TT ? 'v5_transfer_beneficiary_tx_hash' : 'v4_transfer_beneficiary_tx_hash';

    it('throws error if titleEscrowAddress is missing ', async () => {
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockImplementation(() => Promise.resolve(''));

      await expect(
        transferBeneficiary(
          {
            titleEscrowAddress: '',
          },
          wallet,
          params,
          { titleEscrowVersion },
        ),
      ).rejects.toThrow('Token registry address is required');
    });

    it('handles both v5 and v4 contracts when TR version is not provided', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.transferBeneficiary.mockResolvedValue(true);

      const tx = await transferBeneficiary(
        {
          titleEscrowAddress: titleEscrowAddress,
        },
        wallet,
        params,
        { id: 'doc-id', chainId: CHAIN_ID.mainnet },
      );
      if (isV5TT) expect(encrypt).toHaveBeenCalledWith('0xencrypted_remarks', 'doc-id');

      const resultOptions = isV5TT
        ? ['0xbeneficiary', '0xencrypted_remarks', {}]
        : ['0xbeneficiary', {}];

      expect(mockTitleEscrowContract.transferBeneficiary).toHaveBeenCalledWith(...resultOptions);
      expect(tx).toBe(txHash);
    });

    it(`detects version automatically via supportsInterface for ${titleEscrowVersion}`, async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.transferBeneficiary.mockResolvedValue(true);

      const tx = await transferBeneficiary(
        {
          titleEscrowAddress: '0xauto',
        },
        wallet,
        params,
        {}, // no isV5TT provided
      );

      expect(coreModule.isTitleEscrowVersion).toHaveBeenCalledWith({
        provider: wallet.provider,
        titleEscrowAddress: '0xauto',
        versionInterface: isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4',
      });
      expect(tx).toBe(txHash);
    });

    it('calls gas station when gas options are missing', async () => {
      const gasStationMock = vi.fn().mockResolvedValue({
        maxFeePerGas: 100,
        maxPriorityFeePerGas: 50,
      });

      const mockChainId = CHAIN_ID.mainnet;
      if (ethersVersion === 'v5') {
        wallet = new WalletV5(PRIVATE_KEY, Provider as any);
        vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);
      } else {
        vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
          chainId: mockChainId,
        } as unknown as Network);
      }

      const originalChainData = SUPPORTED_CHAINS[mockChainId].gasStation;
      SUPPORTED_CHAINS[mockChainId] = {
        ...SUPPORTED_CHAINS[mockChainId],
        gasStation: gasStationMock,
      };

      mockTitleEscrowContract.callStatic.transferBeneficiary.mockResolvedValue(true);

      await transferBeneficiary(
        {
          titleEscrowAddress: '0xv5contract',
        },
        wallet,
        params,
        { id: 'doc-id', titleEscrowVersion },
      );
      const resultOptions = isV5TT ? ['0xbeneficiary', '0xencrypted_remarks'] : ['0xbeneficiary'];

      expect(gasStationMock).toHaveBeenCalled();
      expect(mockTitleEscrowContract.transferBeneficiary).toHaveBeenCalledWith(...resultOptions, {
        maxFeePerGas: 100,
        maxPriorityFeePerGas: 50,
      });

      SUPPORTED_CHAINS[mockChainId] = {
        ...SUPPORTED_CHAINS[mockChainId],
        gasStation: originalChainData,
      };
    });

    it('throws error when callStatic fails', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.transferBeneficiary.mockRejectedValue(
        new Error('Simulated failure'),
      );
      mockTitleEscrowContract.transferBeneficiary.staticCall.mockRejectedValue(
        new Error('Simulated failure'),
      );

      await expect(
        transferBeneficiary(
          {
            titleEscrowAddress: '0xv5contract',
          },
          wallet,
          params,
          { id: 'doc-id', titleEscrowVersion },
        ),
      ).rejects.toThrow('Pre-check (callStatic) for transferBeneficiary failed');
      mockTitleEscrowContract.transferBeneficiary.staticCall.mockResolvedValue(true);
    });

    it('handles both v5 and v4 contracts when tokenId and tokenregistry is provided', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockImplementation(() =>
        Promise.resolve(titleEscrowAddress),
      );
      mockTitleEscrowContract.callStatic.transferBeneficiary.mockResolvedValue(true);

      const tx = await transferBeneficiary(
        {
          tokenId: 1,
          tokenRegistryAddress: '0xtokenregistry',
        },
        wallet,
        params,
        { id: 'doc-id', chainId: CHAIN_ID.mainnet },
      );
      if (isV5TT) expect(encrypt).toHaveBeenCalledWith('0xencrypted_remarks', 'doc-id');

      const resultOptions = isV5TT
        ? ['0xbeneficiary', '0xencrypted_remarks', {}]
        : ['0xbeneficiary', {}];

      expect(mockTitleEscrowContract.transferBeneficiary).toHaveBeenCalledWith(...resultOptions);
      expect(tx).toBe(txHash);
    });
  });

  describe(`transfer owners with TR Version ${titleEscrowVersion} and ethers version ${ethersVersion}`, () => {
    const params = isV5TT
      ? {
          newBeneficiaryAddress: '0xbeneficiary',
          newHolderAddress: '0xholder',
          remarks: '0xencrypted_remarks',
        }
      : { newBeneficiaryAddress: '0xbeneficiary', newHolderAddress: '0xholder' };
    const txHash = isV5TT ? 'v5_transfer_owners_tx_hash' : 'v4_transfer_owners_tx_hash';

    it('throws error if titleEscrowAddress is missing ', async () => {
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockImplementation(() => Promise.resolve(''));

      await expect(
        transferOwners(
          {
            titleEscrowAddress: '',
          },
          wallet,
          params,
          { titleEscrowVersion },
        ),
      ).rejects.toThrow('Token registry address is required');
    });

    it('handles both v5 and v4 contracts when TR version is not provided', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockImplementation(() =>
        Promise.resolve(titleEscrowAddress),
      );
      mockTitleEscrowContract.callStatic.transferBeneficiary.mockResolvedValue(true);

      const tx = await transferOwners(
        {
          titleEscrowAddress: titleEscrowAddress,
        },
        wallet,
        params,
        { id: 'doc-id', chainId: CHAIN_ID.mainnet },
      );
      if (isV5TT) expect(encrypt).toHaveBeenCalledWith('0xencrypted_remarks', 'doc-id');

      const resultOptions = isV5TT
        ? ['0xbeneficiary', '0xholder', '0xencrypted_remarks', {}]
        : ['0xbeneficiary', '0xholder', {}];

      expect(mockTitleEscrowContract.transferOwners).toHaveBeenCalledWith(...resultOptions);
      expect(tx).toBe(txHash);
    });

    it(`detects version automatically via supportsInterface for ${titleEscrowVersion}`, async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.transferOwners.mockResolvedValue(true);

      const tx = await transferOwners(
        {
          titleEscrowAddress: '0xauto',
        },
        wallet,
        params,
        {}, // no isV5TT provided
      );

      expect(coreModule.isTitleEscrowVersion).toHaveBeenCalledWith({
        provider: wallet.provider,
        titleEscrowAddress: '0xauto',
        versionInterface: isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4',
      });
      expect(tx).toBe(txHash);
    });

    it('calls gas station when gas options are missing', async () => {
      const gasStationMock = vi.fn().mockResolvedValue({
        maxFeePerGas: 100,
        maxPriorityFeePerGas: 50,
      });

      const mockChainId = CHAIN_ID.mainnet;
      if (ethersVersion === 'v5') {
        wallet = new WalletV5(PRIVATE_KEY, Provider as any);
        vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);
      } else {
        vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
          chainId: mockChainId,
        } as unknown as Network);
      }

      const originalChainData = SUPPORTED_CHAINS[mockChainId].gasStation;
      SUPPORTED_CHAINS[mockChainId] = {
        ...SUPPORTED_CHAINS[mockChainId],
        gasStation: gasStationMock,
      };

      mockTitleEscrowContract.callStatic.transferOwners.mockResolvedValue(true);

      await transferOwners(
        {
          titleEscrowAddress: '0xv5contract',
        },
        wallet,
        params,
        { id: 'doc-id', titleEscrowVersion },
      );
      const resultOptions = isV5TT
        ? ['0xbeneficiary', '0xholder', '0xencrypted_remarks']
        : ['0xbeneficiary', '0xholder'];

      expect(gasStationMock).toHaveBeenCalled();
      expect(mockTitleEscrowContract.transferOwners).toHaveBeenCalledWith(...resultOptions, {
        maxFeePerGas: 100,
        maxPriorityFeePerGas: 50,
      });

      SUPPORTED_CHAINS[mockChainId] = {
        ...SUPPORTED_CHAINS[mockChainId],
        gasStation: originalChainData,
      };
    });

    it('throws error when callStatic fails', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.transferOwners.mockRejectedValue(
        new Error('Simulated failure'),
      );
      mockTitleEscrowContract.transferOwners.staticCall.mockRejectedValue(
        new Error('Simulated failure'),
      );

      await expect(
        transferOwners(
          {
            titleEscrowAddress: '0xv5contract',
          },
          wallet,
          params,
          { id: 'doc-id', titleEscrowVersion },
        ),
      ).rejects.toThrow('Pre-check (callStatic) for transferOwners failed');
      mockTitleEscrowContract.transferOwners.staticCall.mockResolvedValue(true);
    });

    it('handles both v5 and v4 contracts when tokenId and tokenregistry is provided', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockImplementation(() =>
        Promise.resolve(titleEscrowAddress),
      );
      mockTitleEscrowContract.callStatic.transferOwners.mockResolvedValue(true);

      const tx = await transferOwners(
        {
          tokenId: 1,
          tokenRegistryAddress: '0xtokenregistry',
        },
        wallet,
        params,
        { id: 'doc-id', chainId: CHAIN_ID.mainnet },
      );
      if (isV5TT) expect(encrypt).toHaveBeenCalledWith('0xencrypted_remarks', 'doc-id');

      const resultOptions = isV5TT
        ? ['0xbeneficiary', '0xholder', '0xencrypted_remarks', {}]
        : ['0xbeneficiary', '0xholder', {}];

      expect(mockTitleEscrowContract.transferOwners).toHaveBeenCalledWith(...resultOptions);
      expect(tx).toBe(txHash);
    });
  });

  describe(`nominate with TR Version ${titleEscrowVersion} and ethers version ${ethersVersion}`, () => {
    const params = isV5TT
      ? { newBeneficiaryAddress: '0xbeneficiary', remarks: '0xencrypted_remarks', tokenId: 1 }
      : { newBeneficiaryAddress: '0xbeneficiary', tokenId: 1 };

    const txHash = isV5TT ? 'v5_nominate_tx_hash' : 'v4_nominate_tx_hash';

    it('throws error if titleEscrowAddress is missing ', async () => {
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockImplementation(() => Promise.resolve(''));

      await expect(
        nominate(
          {
            titleEscrowAddress: '',
          },
          wallet,
          params,
          { titleEscrowVersion },
        ),
      ).rejects.toThrow('Token registry address is required');
    });

    it('handles both v5 and v4 contracts when TR version is not provided', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.nominate.mockResolvedValue(true);

      const tx = await nominate(
        {
          titleEscrowAddress: titleEscrowAddress,
        },
        wallet,
        params,
        { id: 'doc-id', chainId: CHAIN_ID.mainnet },
      );
      if (isV5TT) expect(encrypt).toHaveBeenCalledWith('0xencrypted_remarks', 'doc-id');

      const resultOptions = isV5TT
        ? ['0xbeneficiary', '0xencrypted_remarks', {}]
        : ['0xbeneficiary', {}];

      expect(mockTitleEscrowContract.nominate).toHaveBeenCalledWith(...resultOptions);
      expect(tx).toBe(txHash);
    });

    it(`detects version automatically via supportsInterface for ${titleEscrowVersion}`, async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.nominate.mockResolvedValue(true);

      const tx = await nominate(
        {
          titleEscrowAddress: '0xauto',
        },
        wallet,
        params,
        {}, // no isV5TT provided
      );

      expect(coreModule.isTitleEscrowVersion).toHaveBeenCalledWith({
        provider: wallet.provider,
        titleEscrowAddress: '0xauto',
        versionInterface: isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4',
      });
      expect(tx).toBe(txHash);
    });

    it('calls gas station when gas options are missing', async () => {
      const gasStationMock = vi.fn().mockResolvedValue({
        maxFeePerGas: 100,
        maxPriorityFeePerGas: 50,
      });

      const mockChainId = CHAIN_ID.mainnet;
      if (ethersVersion === 'v5') {
        wallet = new WalletV5(PRIVATE_KEY, Provider as any);
        vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);
      } else {
        vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
          chainId: mockChainId,
        } as unknown as Network);
      }

      const originalChainData = SUPPORTED_CHAINS[mockChainId].gasStation;
      SUPPORTED_CHAINS[mockChainId] = {
        ...SUPPORTED_CHAINS[mockChainId],
        gasStation: gasStationMock,
      };

      mockTitleEscrowContract.callStatic.nominate.mockResolvedValue(true);

      await nominate(
        {
          titleEscrowAddress: '0xv5contract',
        },
        wallet,
        params,
        { id: 'doc-id', titleEscrowVersion },
      );
      const resultOptions = isV5TT ? ['0xbeneficiary', '0xencrypted_remarks'] : ['0xbeneficiary'];

      expect(gasStationMock).toHaveBeenCalled();
      expect(mockTitleEscrowContract.nominate).toHaveBeenCalledWith(...resultOptions, {
        maxFeePerGas: 100,
        maxPriorityFeePerGas: 50,
      });

      SUPPORTED_CHAINS[mockChainId] = {
        ...SUPPORTED_CHAINS[mockChainId],
        gasStation: originalChainData,
      };
    });

    it('throws error when callStatic fails', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      mockTitleEscrowContract.callStatic.nominate.mockRejectedValue(new Error('Simulated failure'));
      mockTitleEscrowContract.nominate.staticCall.mockRejectedValue(new Error('Simulated failure'));

      await expect(
        nominate(
          {
            titleEscrowAddress: '0xv5contract',
          },
          wallet,
          params,
          { id: 'doc-id', titleEscrowVersion },
        ),
      ).rejects.toThrow('Pre-check (callStatic) for nominate failed');
      mockTitleEscrowContract.nominate.staticCall.mockResolvedValue(true);
    });

    it('handles both v5 and v4 contracts when tokenId and tokenregistry is provided', async () => {
      vi.spyOn(coreModule, 'isTitleEscrowVersion').mockImplementation(
        async ({ versionInterface }) =>
          versionInterface === (isV5TT ? '0xTitleEscrowIdV5' : '0xTitleEscrowIdV4'),
      );
      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockImplementation(() =>
        Promise.resolve(titleEscrowAddress),
      );
      mockTitleEscrowContract.callStatic.nominate.mockResolvedValue(true);

      const tx = await nominate(
        {
          tokenId: 1,
          tokenRegistryAddress: '0xtokenregistry',
        },
        wallet,
        params,
        { id: 'doc-id', chainId: CHAIN_ID.mainnet },
      );
      if (isV5TT) expect(encrypt).toHaveBeenCalledWith('0xencrypted_remarks', 'doc-id');

      const resultOptions = isV5TT
        ? ['0xbeneficiary', '0xencrypted_remarks', {}]
        : ['0xbeneficiary', {}];

      expect(mockTitleEscrowContract.nominate).toHaveBeenCalledWith(...resultOptions);
      expect(tx).toBe(txHash);
    });
  });
});
