import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wallet as WalletV5 } from 'ethers';
import { Network, Wallet as WalletV6 } from 'ethersV6';
import {
  acceptObligationRegistry,
  rejectObligationRegistry,
  dischargeObligationRegistry,
} from '../../obligation-registry-functions';
import {
  MOCK_OBLIGATION_ESCROW_ADDRESS,
  MOCK_OBLIGATION_REGISTRY_ADDRESS,
  mockObligationEscrowContract,
  PRIVATE_KEY,
  providerV5,
  providerV6,
} from './fixtures.js';
import * as coreModule from '../../core';
import { CHAIN_ID } from '../../utils';
import { ObligationContractOptions } from '../../obligation-registry-functions/types';

const providers = [
  { Provider: providerV5, ethersVersion: 'v5' as const },
  { Provider: providerV6, ethersVersion: 'v6' as const },
];

describe.each(providers)(
  'obligation lifecycle (ethers $ethersVersion)',
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

      vi.spyOn(coreModule, 'getObligationEscrowAddress').mockResolvedValue(
        MOCK_OBLIGATION_ESCROW_ADDRESS,
      );
      mockObligationEscrowContract.callStatic.accept.mockResolvedValue(true);
      mockObligationEscrowContract.callStatic.reject.mockResolvedValue(true);
      mockObligationEscrowContract.callStatic.discharge.mockResolvedValue(true);
      mockObligationEscrowContract.accept.staticCall.mockResolvedValue(true);
      mockObligationEscrowContract.reject.staticCall.mockResolvedValue(true);
      mockObligationEscrowContract.discharge.staticCall.mockResolvedValue(true);
    });

    it('acceptObligationRegistry with remarks', async () => {
      const result = await acceptObligationRegistry(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS, tokenId: '1' },
        wallet,
        { remarks: 'accepted' },
        { chainId: mockChainId, id: 'encryption-id' },
      );

      expect(result).toEqual('accept_tx_hash');
      expect(coreModule.encrypt).toHaveBeenCalledWith('accepted', 'encryption-id');
    });

    it('rejectObligationRegistry without remarks', async () => {
      const result = await rejectObligationRegistry(
        { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
        wallet,
        {},
        { chainId: mockChainId },
      );

      expect(result).toEqual('reject_tx_hash');
    });

    it('dischargeObligationRegistry without remarks', async () => {
      const result = await dischargeObligationRegistry(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS, tokenId: '1' },
        wallet,
        {},
        { chainId: mockChainId },
      );

      expect(result).toEqual('discharge_tx_hash');
    });

    it('throws when escrow cannot be resolved', async () => {
      await expect(
        acceptObligationRegistry(
          {
            obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS,
          } as ObligationContractOptions,
          wallet,
          {},
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Token ID is required');
    });

    it('throws when callStatic fails', async () => {
      mockObligationEscrowContract.callStatic.accept.mockRejectedValue(new Error('fail'));
      mockObligationEscrowContract.accept.staticCall.mockRejectedValue(new Error('fail'));

      await expect(
        acceptObligationRegistry(
          { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
          wallet,
          {},
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Pre-check (callStatic) for accept failed');
    });
  },
);
