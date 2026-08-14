import './fixtures.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wallet as WalletV5 } from 'ethers';
import { Network, Wallet as WalletV6 } from 'ethersV6';
import {
  getObligationRegistryStatus,
  isObligationRegistryRegistered,
  getObligationEscrowTerminationReason,
  ObligationDocumentStatus,
  ObligationEscrowTerminationReason,
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

const providers = [
  { Provider: providerV5, ethersVersion: 'v5' as const },
  { Provider: providerV6, ethersVersion: 'v6' as const },
];

describe.each(providers)(
  'obligation status reads (ethers $ethersVersion)',
  ({ Provider, ethersVersion }) => {
    let wallet: WalletV5 | WalletV6;

    beforeEach(() => {
      vi.clearAllMocks();
      if (ethersVersion === 'v5') {
        wallet = new WalletV5(PRIVATE_KEY, Provider as any);
      } else {
        wallet = new WalletV6(PRIVATE_KEY, Provider as any);
        vi.spyOn(Provider, 'getNetwork').mockResolvedValue({ chainId: 1 } as unknown as Network);
      }

      vi.spyOn(coreModule, 'getTitleEscrowAddress').mockResolvedValue(
        MOCK_OBLIGATION_ESCROW_ADDRESS,
      );
      mockObligationEscrowContract.status.mockResolvedValue(ObligationDocumentStatus.Accepted);
      mockObligationEscrowContract.isRegistered.mockResolvedValue(true);
      mockObligationEscrowContract.terminationReason.mockResolvedValue(
        ObligationEscrowTerminationReason.None,
      );
    });

    it('getObligationRegistryStatus returns enum value', async () => {
      const status = await getObligationRegistryStatus(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS, tokenId: '1' },
        wallet,
        { tokenId: '1' },
      );

      expect(status).toBe(ObligationDocumentStatus.Accepted);
    });

    it('isObligationRegistryRegistered returns boolean', async () => {
      const registered = await isObligationRegistryRegistered(
        { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
        wallet,
        { tokenId: '1' },
      );

      expect(registered).toBe(true);
    });

    it('getObligationEscrowTerminationReason returns enum value', async () => {
      const reason = await getObligationEscrowTerminationReason(
        { obligationRegistryAddress: MOCK_OBLIGATION_REGISTRY_ADDRESS, tokenId: '1' },
        wallet,
        { tokenId: '1' },
      );

      expect(reason).toBe(ObligationEscrowTerminationReason.None);
    });

    it('throws when provider is missing', async () => {
      const signerWithoutProvider = new WalletV5(PRIVATE_KEY);

      await expect(
        getObligationRegistryStatus(
          { obligationEscrowAddress: MOCK_OBLIGATION_ESCROW_ADDRESS },
          signerWithoutProvider,
          { tokenId: '1' },
        ),
      ).rejects.toThrow('Provider is required');
    });
  },
);
