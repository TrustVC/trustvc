import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wallet as WalletV5 } from 'ethers';
import { Network, Wallet as WalletV6 } from 'ethersV6';
import * as coreModule from '../../core';
import { mintObligationRegistry } from '../../obligation-registry-functions';
import {
  MOCK_OBLIGATION_REGISTRY_ADDRESS,
  mockTrustVCTokenContract,
  PRIVATE_KEY,
  providerV5,
  providerV6,
} from './fixtures.js';
import { getEthersContractFromProvider } from '../../utils/ethers';
import { CHAIN_ID } from '../../utils';

const providers = [
  { Provider: providerV5, ethersVersion: 'v5' as const },
  { Provider: providerV6, ethersVersion: 'v6' as const },
];

describe.each(providers)(
  'mintObligationRegistry (ethers $ethersVersion)',
  ({ Provider, ethersVersion }) => {
    const mockChainId = CHAIN_ID.local;
    let wallet: WalletV5 | WalletV6;

    beforeEach(() => {
      vi.clearAllMocks();
      if (ethersVersion === 'v5') {
        wallet = new WalletV5(PRIVATE_KEY, Provider as any);
        vi.spyOn(wallet, 'getChainId').mockResolvedValue(mockChainId as unknown as number);
      } else {
        wallet = new WalletV6(PRIVATE_KEY, Provider as any);
        vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
          chainId: mockChainId,
        } as unknown as Network);
      }

      vi.mocked(getEthersContractFromProvider).mockReturnValue(
        vi.fn(() => mockTrustVCTokenContract) as any,
      );
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(true);
      mockTrustVCTokenContract.callStatic.mint.mockResolvedValue(true);
      mockTrustVCTokenContract.mint.staticCall.mockResolvedValue(true);
    });

    it('mints with remarks', async () => {
      const result = await mintObligationRegistry(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS },
        wallet,
        {
          beneficiaryAddress: '0xBeneficiary',
          holderAddress: '0xHolder',
          tokenId: '1',
          remarks: 'issued',
        },
        { chainId: mockChainId, id: 'encryption-id' },
      );

      expect(result).toEqual('mint_tx_hash');
      expect(coreModule.encrypt).toHaveBeenCalledWith('issued', 'encryption-id');
    });

    it('mints without remarks', async () => {
      const result = await mintObligationRegistry(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS },
        wallet,
        {
          beneficiaryAddress: '0xBeneficiary',
          holderAddress: '0xHolder',
          tokenId: '1',
        },
        { chainId: mockChainId },
      );

      expect(result).toEqual('mint_tx_hash');
      expect(coreModule.encrypt).not.toHaveBeenCalled();
    });

    it('throws when callStatic fails', async () => {
      mockTrustVCTokenContract.callStatic.mint.mockRejectedValue(new Error('fail'));
      mockTrustVCTokenContract.mint.staticCall.mockRejectedValue(new Error('fail'));

      await expect(
        mintObligationRegistry(
          { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS },
          wallet,
          {
            beneficiaryAddress: '0xBeneficiary',
            holderAddress: '0xHolder',
            tokenId: '1',
          },
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Pre-check (callStatic) for mint failed');
    });

    it('throws when obligation registry address is missing', async () => {
      await expect(
        mintObligationRegistry(
          { obligationRegistryAddress: '' },
          wallet,
          {
            beneficiaryAddress: '0xBeneficiary',
            holderAddress: '0xHolder',
            tokenId: '1',
          },
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Obligation registry address is required');
    });

    it('throws when provider is missing', async () => {
      const signerWithoutProvider = new WalletV5(PRIVATE_KEY);

      await expect(
        mintObligationRegistry(
          { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS },
          signerWithoutProvider,
          {
            beneficiaryAddress: '0xBeneficiary',
            holderAddress: '0xHolder',
            tokenId: '1',
          },
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Provider is required');
    });

    it('throws when registry is unsupported', async () => {
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(false);

      await expect(
        mintObligationRegistry(
          { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS },
          wallet,
          {
            beneficiaryAddress: '0xBeneficiary',
            holderAddress: '0xHolder',
            tokenId: '1',
          },
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Only TrustVCToken obligation registry is supported');
    });
  },
);
