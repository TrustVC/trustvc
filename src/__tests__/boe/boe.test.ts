import '../token-registry-functions/fixtures.js';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import * as coreModule from '../../core';
import { acceptBillOfExchange } from '../../boe/accept';
import { rejectBillOfExchange } from '../../boe/reject';
import { dischargeBillOfExchange } from '../../boe/discharge';
import { getBillOfExchangeStatus } from '../../boe/status';
import { BillOfExchangeStatus } from '../../boe/types';
import { mockV5TitleEscrowContract } from '../token-registry-functions/fixtures';
import {
  configureSignerAsBeneficiary,
  configureSignerAsHolder,
  installBoeMockContract,
  MOCK_CHAIN_ID,
  MOCK_ENCRYPTION_ID,
  MOCK_REMARKS,
  MOCK_TITLE_ESCROW_ADDRESS,
  MOCK_TOKEN_ID,
  MOCK_TOKEN_REGISTRY_ADDRESS,
  providers,
  setupBoeTestContext,
} from './fixtures';

describe.each(providers)(
  'Bill of Exchange with ethers version $ethersVersion',
  ({ Provider, ethersVersion }) => {
    let wallet: ReturnType<typeof setupBoeTestContext>['wallet'];

    beforeAll(() => {
      installBoeMockContract();
    });

    beforeEach(() => {
      ({ wallet } = setupBoeTestContext(Provider, ethersVersion));
      configureSignerAsHolder(wallet);
    });

    const options = { chainId: MOCK_CHAIN_ID, id: MOCK_ENCRYPTION_ID };
    const contractOptions = {
      tokenRegistryAddress: MOCK_TOKEN_REGISTRY_ADDRESS,
      tokenId: MOCK_TOKEN_ID,
    };

    describe('acceptBillOfExchange', () => {
      it('should accept with signer and all required parameters', async () => {
        const result = await acceptBillOfExchange(
          contractOptions,
          wallet,
          { remarks: MOCK_REMARKS },
          options,
        );
        expect(result).toEqual('v5_accept_bill_of_exchange_tx_hash');
      });

      it('should accept when titleEscrowAddress is provided directly', async () => {
        const result = await acceptBillOfExchange(
          { titleEscrowAddress: MOCK_TITLE_ESCROW_ADDRESS },
          wallet,
          { remarks: MOCK_REMARKS },
          options,
        );
        expect(result).toEqual('v5_accept_bill_of_exchange_tx_hash');
        expect(coreModule.getTitleEscrowAddress).not.toHaveBeenCalled();
      });

      it('should throw when tokenRegistryAddress is missing', async () => {
        vi.mocked(coreModule.getTitleEscrowAddress).mockResolvedValue(undefined);
        await expect(
          acceptBillOfExchange(
            { tokenId: MOCK_TOKEN_ID } as any,
            wallet,
            { remarks: MOCK_REMARKS },
            options,
          ),
        ).rejects.toThrow('Token registry address is required');
      });

      it('should throw when provider is missing', async () => {
        const { Wallet: WalletV5 } = await import('ethers');
        const signerWithoutProvider = new WalletV5('0x'.padEnd(66, '1'));
        await expect(
          acceptBillOfExchange(
            contractOptions,
            signerWithoutProvider,
            { remarks: MOCK_REMARKS },
            options,
          ),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw when title escrow is not V5', async () => {
        vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(false);
        await expect(
          acceptBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Only Token Registry V5 is supported');
      });

      it('should throw a friendly error when the TitleEscrow predates the Bill of Exchange lifecycle', async () => {
        mockV5TitleEscrowContract.status.mockRejectedValue(new Error('no such function'));
        await expect(
          acceptBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('does not support the Bill of Exchange lifecycle');
      });

      it('should throw when the signer is not the current holder', async () => {
        mockV5TitleEscrowContract.holder.mockResolvedValue('0xsomeone_else');
        await expect(
          acceptBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Only the current holder can accept this Bill of Exchange');
      });

      it('should throw when owner and holder are the same address', async () => {
        mockV5TitleEscrowContract.beneficiary.mockResolvedValue(wallet.address);
        await expect(
          acceptBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Owner and holder must be different addresses');
      });

      it.each([
        BillOfExchangeStatus.Accepted,
        BillOfExchangeStatus.Rejected,
        BillOfExchangeStatus.Discharged,
      ])('should throw when status is already %i', async (status) => {
        mockV5TitleEscrowContract.status.mockResolvedValue(status);
        await expect(
          acceptBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow(/already been|cannot be accepted or rejected again/);
      });

      it('should throw when callStatic fails', async () => {
        mockV5TitleEscrowContract.callStatic.acceptBillOfExchange.mockRejectedValue(
          new Error('Simulated failure'),
        );
        mockV5TitleEscrowContract.acceptBillOfExchange.staticCall.mockRejectedValue(
          new Error('Simulated failure'),
        );
        await expect(
          acceptBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Pre-check (callStatic) for acceptBillOfExchange failed');
        mockV5TitleEscrowContract.callStatic.acceptBillOfExchange = vi.fn();
        mockV5TitleEscrowContract.acceptBillOfExchange.staticCall = vi.fn();
      });
    });

    describe('rejectBillOfExchange', () => {
      it('should reject with signer and all required parameters', async () => {
        const result = await rejectBillOfExchange(
          contractOptions,
          wallet,
          { remarks: MOCK_REMARKS },
          options,
        );
        expect(result).toEqual('v5_reject_bill_of_exchange_tx_hash');
      });

      it('should throw when the signer is not the current holder', async () => {
        mockV5TitleEscrowContract.holder.mockResolvedValue('0xsomeone_else');
        await expect(
          rejectBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Only the current holder can reject this Bill of Exchange');
      });

      it('should throw when owner and holder are the same address', async () => {
        mockV5TitleEscrowContract.beneficiary.mockResolvedValue(wallet.address);
        await expect(
          rejectBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Owner and holder must be different addresses');
      });

      it.each([BillOfExchangeStatus.Rejected, BillOfExchangeStatus.Discharged])(
        'should throw when status is already %i',
        async (status) => {
          mockV5TitleEscrowContract.status.mockResolvedValue(status);
          await expect(
            rejectBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
          ).rejects.toThrow('cannot be accepted or rejected again');
        },
      );

      it('should throw when callStatic fails', async () => {
        mockV5TitleEscrowContract.callStatic.rejectBillOfExchange.mockRejectedValue(
          new Error('Simulated failure'),
        );
        mockV5TitleEscrowContract.rejectBillOfExchange.staticCall.mockRejectedValue(
          new Error('Simulated failure'),
        );
        await expect(
          rejectBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Pre-check (callStatic) for rejectBillOfExchange failed');
        mockV5TitleEscrowContract.callStatic.rejectBillOfExchange = vi.fn();
        mockV5TitleEscrowContract.rejectBillOfExchange.staticCall = vi.fn();
      });
    });

    describe('dischargeBillOfExchange', () => {
      beforeEach(() => {
        configureSignerAsBeneficiary(wallet);
      });

      it('should discharge with signer and all required parameters', async () => {
        const result = await dischargeBillOfExchange(
          contractOptions,
          wallet,
          { remarks: MOCK_REMARKS },
          options,
        );
        expect(result).toEqual('v5_discharge_bill_of_exchange_tx_hash');
      });

      it('should throw when the signer is not the current beneficiary', async () => {
        mockV5TitleEscrowContract.beneficiary.mockResolvedValue('0xsomeone_else');
        await expect(
          dischargeBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow(
          'Only the current beneficiary (owner) can discharge this Bill of Exchange',
        );
      });

      it('should throw when owner and holder are the same address', async () => {
        mockV5TitleEscrowContract.holder.mockResolvedValue(wallet.address);
        await expect(
          dischargeBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Owner and holder must be different addresses');
      });

      it('should throw a specific message when status is Rejected', async () => {
        mockV5TitleEscrowContract.status.mockResolvedValue(BillOfExchangeStatus.Rejected);
        await expect(
          dischargeBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('was rejected and can never be discharged');
      });

      it('should throw a specific message when status is still Issued', async () => {
        mockV5TitleEscrowContract.status.mockResolvedValue(BillOfExchangeStatus.Issued);
        await expect(
          dischargeBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('has not been accepted yet');
      });

      it('should throw a specific message when already Discharged', async () => {
        mockV5TitleEscrowContract.status.mockResolvedValue(BillOfExchangeStatus.Discharged);
        await expect(
          dischargeBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('This Bill of Exchange has already been discharged.');
      });

      it('should throw when callStatic fails', async () => {
        mockV5TitleEscrowContract.callStatic.dischargeBillOfExchange.mockRejectedValue(
          new Error('Simulated failure'),
        );
        mockV5TitleEscrowContract.dischargeBillOfExchange.staticCall.mockRejectedValue(
          new Error('Simulated failure'),
        );
        await expect(
          dischargeBillOfExchange(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Pre-check (callStatic) for dischargeBillOfExchange failed');
        mockV5TitleEscrowContract.callStatic.dischargeBillOfExchange = vi.fn();
        mockV5TitleEscrowContract.dischargeBillOfExchange.staticCall = vi.fn();
      });
    });

    describe('getBillOfExchangeStatus', () => {
      it('should return the current status', async () => {
        mockV5TitleEscrowContract.status.mockResolvedValue(BillOfExchangeStatus.Accepted);
        const result = await getBillOfExchangeStatus(contractOptions, wallet, {});
        expect(result).toEqual(BillOfExchangeStatus.Accepted);
      });

      it('should throw when title escrow is not V5', async () => {
        vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(false);
        await expect(getBillOfExchangeStatus(contractOptions, wallet, {})).rejects.toThrow(
          'Only Token Registry V5 is supported',
        );
      });

      it('should throw a friendly error when status() reverts', async () => {
        mockV5TitleEscrowContract.status.mockRejectedValue(new Error('no such function'));
        await expect(getBillOfExchangeStatus(contractOptions, wallet, {})).rejects.toThrow(
          'does not support the Bill of Exchange lifecycle',
        );
      });
    });
  },
);
