import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wallet as WalletV5 } from 'ethers';
import { Network, Wallet as WalletV6 } from 'ethersV6';
import {
  nominateObligationRegistry,
  transferHolderObligationRegistry,
  transferBeneficiaryObligationRegistry,
  transferOwnersObligationRegistry,
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
  'obligation transfers (ethers $ethersVersion)',
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
      Object.values(mockObligationEscrowContract.callStatic).forEach((fn) =>
        (fn as ReturnType<typeof vi.fn>).mockResolvedValue(true),
      );
      ['nominate', 'transferHolder', 'transferBeneficiary', 'transferOwners'].forEach((method) => {
        (mockObligationEscrowContract as any)[method].staticCall.mockResolvedValue(true);
      });
    });

    it('nominateObligationRegistry with remarks', async () => {
      const result = await nominateObligationRegistry(
        { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
        wallet,
        { newBeneficiaryAddress: '0xNewBeneficiary', remarks: 'nominate' },
        { chainId: mockChainId, id: 'encryption-id' },
      );

      expect(result).toEqual('nominate_tx_hash');
    });

    it('transferHolderObligationRegistry resolves escrow from registry + tokenId', async () => {
      const result = await transferHolderObligationRegistry(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS, tokenId: '1' },
        wallet,
        { holderAddress: '0xNewHolder' },
        { chainId: mockChainId },
      );

      expect(result).toEqual('transfer_holder_tx_hash');
      expect(coreModule.getObligationEscrowAddress).toHaveBeenCalled();
    });

    it('transferBeneficiaryObligationRegistry without remarks', async () => {
      const result = await transferBeneficiaryObligationRegistry(
        { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
        wallet,
        { newBeneficiaryAddress: '0xNewBeneficiary' },
        { chainId: mockChainId },
      );

      expect(result).toEqual('transfer_beneficiary_tx_hash');
    });

    it('transferOwnersObligationRegistry without remarks', async () => {
      const result = await transferOwnersObligationRegistry(
        { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
        wallet,
        { newHolderAddress: '0xNewHolder', newBeneficiaryAddress: '0xNewBeneficiary' },
        { chainId: mockChainId },
      );

      expect(result).toEqual('transfer_owners_tx_hash');
    });

    it('throws when registry and tokenId are missing', async () => {
      await expect(
        transferHolderObligationRegistry(
          { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS },
          wallet,
          { holderAddress: '0xNewHolder' },
          { chainId: mockChainId },
        ),
      ).rejects.toThrow('Token ID is required');
    });
  },
);
