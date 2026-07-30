import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wallet as WalletV5 } from 'ethers';
import { Network, Wallet as WalletV6 } from 'ethersV6';
import * as coreModule from '../../core';
import {
  returnToIssuerObligationRegistry,
  acceptReturnedObligationRegistry,
  rejectReturnedObligationRegistry,
} from '../../obligation-registry-functions';
import {
  MOCK_OBLIGATION_ESCROW_ADDRESS,
  MOCK_OBLIGATION_REGISTRY_ADDRESS,
  mockObligationEscrowContract,
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
  'obligation return token (ethers $ethersVersion)',
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
        vi.spyOn(Provider, 'getNetwork').mockResolvedValue({ chainId: mockChainId } as Network);
      }

      vi.spyOn(coreModule, 'getObligationEscrowAddress').mockResolvedValue(
        MOCK_OBLIGATION_ESCROW_ADDRESS,
      );
      vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(true);
      mockObligationEscrowContract.callStatic.returnToIssuer.mockResolvedValue(true);
      mockObligationEscrowContract.returnToIssuer.staticCall.mockResolvedValue(true);
      mockTrustVCTokenContract.callStatic.burn.mockResolvedValue(true);
      mockTrustVCTokenContract.callStatic.restore.mockResolvedValue(true);
      mockTrustVCTokenContract.burn.staticCall.mockResolvedValue(true);
      mockTrustVCTokenContract.restore.staticCall.mockResolvedValue(true);

      vi.mocked(getEthersContractFromProvider).mockReturnValue(
        vi.fn((address: string) =>
          address === MOCK_OBLIGATION_REGISTRY_ADDRESS
            ? mockTrustVCTokenContract
            : mockObligationEscrowContract,
        ) as any,
      );
    });

    it('returnToIssuerObligationRegistry with remarks', async () => {
      const result = await returnToIssuerObligationRegistry(
        { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
        wallet,
        { remarks: 'return' },
        { chainId: mockChainId, id: 'encryption-id' },
      );

      expect(result).toEqual('return_to_issuer_tx_hash');
    });

    it('acceptReturnedObligationRegistry burns token', async () => {
      const result = await acceptReturnedObligationRegistry(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS },
        wallet,
        { tokenId: '1', remarks: 'burn' },
        { chainId: mockChainId, id: 'encryption-id' },
      );

      expect(result).toEqual('burn_tx_hash');
    });

    it('rejectReturnedObligationRegistry restores token', async () => {
      const result = await rejectReturnedObligationRegistry(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS },
        wallet,
        { tokenId: '1' },
        { chainId: mockChainId },
      );

      expect(result).toEqual('restore_tx_hash');
    });

    it('throws when registry address is missing for acceptReturned', async () => {
      await expect(
        acceptReturnedObligationRegistry(
          { obligationRegistryAddress: '' },
          wallet,
          { tokenId: '1' },
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Obligation registry address is required');
    });
  },
);
