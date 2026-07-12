import '../token-registry-functions/fixtures.js';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import * as coreModule from '../../core';
import { accept } from '../../status/accept';
import { reject } from '../../status/reject';
import { discharge } from '../../status/discharge';
import { getStatus } from '../../status/status';
import { Status } from '../../status/types';
import { mockV5TitleEscrowContract } from '../token-registry-functions/fixtures';
import {
  configureSignerAsBeneficiary,
  configureSignerAsHolder,
  installStatusMockContract,
  MOCK_CHAIN_ID,
  MOCK_ENCRYPTION_ID,
  MOCK_REMARKS,
  MOCK_TITLE_ESCROW_ADDRESS,
  MOCK_TOKEN_ID,
  MOCK_TOKEN_REGISTRY_ADDRESS,
  providers,
  setupStatusTestContext,
} from './fixtures';

describe.each(providers)(
  'TitleEscrow status with ethers version $ethersVersion',
  ({ Provider, ethersVersion }) => {
    let wallet: ReturnType<typeof setupStatusTestContext>['wallet'];

    beforeAll(() => {
      installStatusMockContract();
    });

    beforeEach(() => {
      ({ wallet } = setupStatusTestContext(Provider, ethersVersion));
      configureSignerAsHolder(wallet);
    });

    const options = { chainId: MOCK_CHAIN_ID, id: MOCK_ENCRYPTION_ID };
    const contractOptions = {
      tokenRegistryAddress: MOCK_TOKEN_REGISTRY_ADDRESS,
      tokenId: MOCK_TOKEN_ID,
    };

    describe('accept', () => {
      it('should accept with signer and all required parameters', async () => {
        const result = await accept(contractOptions, wallet, { remarks: MOCK_REMARKS }, options);
        expect(result).toEqual('v5_accept_tx_hash');
      });

      it.each([undefined, ''] as const)(
        'should accept empty remarks (%j) by sending 0x to the contract',
        async (remarks) => {
          const result = await accept(contractOptions, wallet, { remarks }, options);
          expect(result).toEqual('v5_accept_tx_hash');
          expect(coreModule.encrypt).not.toHaveBeenCalled();
          if (ethersVersion === 'v6') {
            expect(mockV5TitleEscrowContract.accept.staticCall).toHaveBeenCalledWith('0x');
          } else {
            expect(mockV5TitleEscrowContract.callStatic.accept).toHaveBeenCalledWith('0x');
          }
          expect(mockV5TitleEscrowContract.accept).toHaveBeenCalledWith('0x', expect.anything());
        },
      );

      it('should accept when titleEscrowAddress is provided directly', async () => {
        const result = await accept(
          { titleEscrowAddress: MOCK_TITLE_ESCROW_ADDRESS },
          wallet,
          { remarks: MOCK_REMARKS },
          options,
        );
        expect(result).toEqual('v5_accept_tx_hash');
        expect(coreModule.getTitleEscrowAddress).not.toHaveBeenCalled();
      });

      it('should throw when tokenRegistryAddress is missing', async () => {
        vi.mocked(coreModule.getTitleEscrowAddress).mockResolvedValue(undefined);
        await expect(
          accept({ tokenId: MOCK_TOKEN_ID } as any, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Token registry address is required');
      });

      it('should throw when provider is missing', async () => {
        const { Wallet: WalletV5 } = await import('ethers');
        const signerWithoutProvider = new WalletV5('0x'.padEnd(66, '1'));
        await expect(
          accept(contractOptions, signerWithoutProvider, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Provider is required');
      });

      it('should throw when title escrow is not V5', async () => {
        vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(false);
        await expect(
          accept(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Only Token Registry V5 is supported');
      });

      it('should throw when callStatic fails', async () => {
        mockV5TitleEscrowContract.callStatic.accept.mockRejectedValue(
          new Error('Simulated failure'),
        );
        mockV5TitleEscrowContract.accept.staticCall.mockRejectedValue(
          new Error('Simulated failure'),
        );
        await expect(
          accept(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Pre-check (callStatic) for accept failed');
        mockV5TitleEscrowContract.callStatic.accept = vi.fn();
        mockV5TitleEscrowContract.accept.staticCall = vi.fn();
      });
    });

    describe('reject', () => {
      it('should reject with signer and all required parameters', async () => {
        const result = await reject(contractOptions, wallet, { remarks: MOCK_REMARKS }, options);
        expect(result).toEqual('v5_reject_tx_hash');
      });

      it.each([undefined, ''] as const)(
        'should reject empty remarks (%j) by sending 0x to the contract',
        async (remarks) => {
          const result = await reject(contractOptions, wallet, { remarks }, options);
          expect(result).toEqual('v5_reject_tx_hash');
          expect(coreModule.encrypt).not.toHaveBeenCalled();
          if (ethersVersion === 'v6') {
            expect(mockV5TitleEscrowContract.reject.staticCall).toHaveBeenCalledWith('0x');
          } else {
            expect(mockV5TitleEscrowContract.callStatic.reject).toHaveBeenCalledWith('0x');
          }
          expect(mockV5TitleEscrowContract.reject).toHaveBeenCalledWith('0x', expect.anything());
        },
      );

      it('should throw when callStatic fails', async () => {
        mockV5TitleEscrowContract.callStatic.reject.mockRejectedValue(
          new Error('Simulated failure'),
        );
        mockV5TitleEscrowContract.reject.staticCall.mockRejectedValue(
          new Error('Simulated failure'),
        );
        await expect(
          reject(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Pre-check (callStatic) for reject failed');
        mockV5TitleEscrowContract.callStatic.reject = vi.fn();
        mockV5TitleEscrowContract.reject.staticCall = vi.fn();
      });
    });

    describe('discharge', () => {
      beforeEach(() => {
        configureSignerAsBeneficiary(wallet);
      });

      it('should discharge with signer and all required parameters', async () => {
        const result = await discharge(contractOptions, wallet, { remarks: MOCK_REMARKS }, options);
        expect(result).toEqual('v5_discharge_tx_hash');
      });

      it.each([undefined, ''] as const)(
        'should discharge empty remarks (%j) by sending 0x to the contract',
        async (remarks) => {
          const result = await discharge(contractOptions, wallet, { remarks }, options);
          expect(result).toEqual('v5_discharge_tx_hash');
          expect(coreModule.encrypt).not.toHaveBeenCalled();
          if (ethersVersion === 'v6') {
            expect(mockV5TitleEscrowContract.discharge.staticCall).toHaveBeenCalledWith('0x');
          } else {
            expect(mockV5TitleEscrowContract.callStatic.discharge).toHaveBeenCalledWith('0x');
          }
          expect(mockV5TitleEscrowContract.discharge).toHaveBeenCalledWith('0x', expect.anything());
        },
      );

      it('should throw when callStatic fails', async () => {
        mockV5TitleEscrowContract.callStatic.discharge.mockRejectedValue(
          new Error('Simulated failure'),
        );
        mockV5TitleEscrowContract.discharge.staticCall.mockRejectedValue(
          new Error('Simulated failure'),
        );
        await expect(
          discharge(contractOptions, wallet, { remarks: MOCK_REMARKS }, options),
        ).rejects.toThrow('Pre-check (callStatic) for discharge failed');
        mockV5TitleEscrowContract.callStatic.discharge = vi.fn();
        mockV5TitleEscrowContract.discharge.staticCall = vi.fn();
      });
    });

    describe('getStatus', () => {
      it('should return the current status', async () => {
        mockV5TitleEscrowContract.status.mockResolvedValue(Status.Accepted);
        const result = await getStatus(contractOptions, wallet, {});
        expect(result).toEqual(Status.Accepted);
      });

      it('should throw when title escrow is not V5', async () => {
        vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(false);
        await expect(getStatus(contractOptions, wallet, {})).rejects.toThrow(
          'Only Token Registry V5 is supported',
        );
      });

      it('should throw a friendly error when status() reverts', async () => {
        mockV5TitleEscrowContract.status.mockRejectedValue(new Error('no such function'));
        await expect(getStatus(contractOptions, wallet, {})).rejects.toThrow(
          'does not support the status lifecycle',
        );
      });
    });
  },
);
