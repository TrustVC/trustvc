import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wallet as WalletV5 } from 'ethers';
import { Network, Wallet as WalletV6 } from 'ethersV6';
import {
  rejectTransferHolderObligationRegistry,
  rejectTransferBeneficiaryObligationRegistry,
  rejectTransferOwnersObligationRegistry,
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

const providers = [
  { Provider: providerV5, ethersVersion: 'v5' as const },
  { Provider: providerV6, ethersVersion: 'v6' as const },
];

describe.each(providers)(
  'obligation reject transfers (ethers $ethersVersion)',
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
      mockObligationEscrowContract.callStatic.rejectTransferHolder.mockResolvedValue(true);
      mockObligationEscrowContract.callStatic.rejectTransferBeneficiary.mockResolvedValue(true);
      mockObligationEscrowContract.callStatic.rejectTransferOwners.mockResolvedValue(true);
      mockObligationEscrowContract.rejectTransferHolder.staticCall.mockResolvedValue(true);
      mockObligationEscrowContract.rejectTransferBeneficiary.staticCall.mockResolvedValue(true);
      mockObligationEscrowContract.rejectTransferOwners.staticCall.mockResolvedValue(true);
    });

    it('rejectTransferHolderObligationRegistry with remarks', async () => {
      const result = await rejectTransferHolderObligationRegistry(
        { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
        wallet,
        { remarks: 'reject' },
        { chainId: mockChainId, id: 'encryption-id' },
      );

      expect(result).toEqual('reject_transfer_holder_tx_hash');
    });

    it('rejectTransferBeneficiaryObligationRegistry resolves escrow', async () => {
      const result = await rejectTransferBeneficiaryObligationRegistry(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS, tokenId: '1' },
        wallet,
        {},
        { chainId: mockChainId },
      );

      expect(result).toEqual('reject_transfer_beneficiary_tx_hash');
      expect(coreModule.getObligationEscrowAddress).toHaveBeenCalled();
    });

    it('rejectTransferOwnersObligationRegistry without remarks', async () => {
      const result = await rejectTransferOwnersObligationRegistry(
        { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
        wallet,
        {},
        { chainId: mockChainId },
      );

      expect(result).toEqual('reject_transfer_owners_tx_hash');
    });
  },
);
