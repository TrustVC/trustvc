import { expect } from 'chai';
import { Signer } from 'ethers';
import { CHAIN_ID } from '../../../utils';
import {
  acceptObligationRegistry,
  dischargeObligationRegistry,
  getObligationEscrowTerminationReason,
  getObligationRegistryStatus,
  isObligationRegistryRegistered,
  mintObligationRegistry,
  rejectObligationRegistry,
  DocumentStatus,
  ObligationEscrowTerminationReason,
} from '../../../obligation-registry-functions';
import { getSignersV5, getSignersV6Fresh } from '../fixtures';
import {
  attachObligationEscrow,
  delay,
  defaultTxOptions,
  deployObligationFixture,
  mintIssuedToken,
  waitTx,
  obligationProviders,
  resetHardhatChain,
} from '../obligationUtils';

obligationProviders.forEach(({ ethersVersion }) => {
  describe(`Obligation status lifecycle E2E - ethers ${ethersVersion}`, function () {
    let owner: any;

    let holder: any;

    let beneficiary: any;
    let obligationRegistry: string;
    let nextTokenId = 0;

    const allocateTokenId = () => {
      const id = String(nextTokenId);
      nextTokenId += 1;
      return id;
    };

    before(async function () {
      this.timeout(120000);
      await resetHardhatChain();

      const signers = ethersVersion === 'v5' ? await getSignersV5(4) : await getSignersV6Fresh(4);
      [owner, holder, beneficiary] = signers;

      const deployed = await deployObligationFixture(owner);
      obligationRegistry = deployed.obligationRegistry;
      expect(obligationRegistry).to.match(/^0x[a-fA-F0-9]{40}$/);
      await delay();
    });

    describe('mint + status readers', function () {
      it('mints to Issued and reports registered', async function () {
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: beneficiary.address,
          holderAddress: holder.address,
          tokenId,
          remarks: 'mint with remarks',
        });

        expect(escrowAddress).to.match(/^0x[a-fA-F0-9]{40}$/);

        const status = await getObligationRegistryStatus({ obligationRegistry }, owner as Signer, {
          tokenId,
        });
        expect(status).to.equal(DocumentStatus.Issued);

        const registered = await isObligationRegistryRegistered(
          { obligationRegistry },
          owner as Signer,
          { tokenId },
        );
        expect(registered).to.equal(true);

        const reason = await getObligationEscrowTerminationReason(
          { obligationRegistry },
          owner as Signer,
          { tokenId },
        );
        expect(reason).to.equal(ObligationEscrowTerminationReason.None);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.active()).to.equal(true);
      });

      it('fails duplicate token mint', async function () {
        const tokenId = allocateTokenId();
        await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: beneficiary.address,
          holderAddress: holder.address,
          tokenId,
        });

        try {
          await mintObligationRegistry(
            { obligationRegistry },
            owner as Signer,
            {
              beneficiaryAddress: beneficiary.address,
              holderAddress: holder.address,
              tokenId,
              remarks: 'duplicate',
            },
            defaultTxOptions(),
          );
          expect.fail('Expected duplicate mint to fail');
        } catch (error: unknown) {
          expect((error as Error).message).to.equal('Pre-check (callStatic) for mint failed');
        }
      });

      it('cannot accept when beneficiary equals holder', async function () {
        const tokenId = allocateTokenId();
        await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: holder.address,
          holderAddress: holder.address,
          tokenId,
        });

        try {
          await acceptObligationRegistry(
            { obligationRegistry },
            holder as Signer,
            { tokenId, remarks: 'dual role' },
            defaultTxOptions(),
          );
          expect.fail('Expected accept with dual role to fail');
        } catch (error: unknown) {
          expect((error as Error).message).to.equal('Pre-check (callStatic) for accept failed');
        }
      });
    });

    describe('accept', function () {
      it('holder transitions Issued → Accepted when roles differ', async function () {
        const tokenId = allocateTokenId();
        await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: beneficiary.address,
          holderAddress: holder.address,
          tokenId,
        });

        const tx = await acceptObligationRegistry(
          { obligationRegistry },
          holder as Signer,
          { tokenId, remarks: 'accepted' },
          defaultTxOptions(),
        );
        await waitTx(tx);

        const status = await getObligationRegistryStatus({ obligationRegistry }, owner as Signer, {
          tokenId,
        });
        expect(status).to.equal(DocumentStatus.Accepted);
      });

      it('non-holder cannot accept', async function () {
        const tokenId = allocateTokenId();
        await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: beneficiary.address,
          holderAddress: holder.address,
          tokenId,
        });

        try {
          await acceptObligationRegistry(
            { obligationRegistry },
            beneficiary as Signer,
            { tokenId, remarks: 'not holder' },
            defaultTxOptions(),
          );
          expect.fail('Expected accept by non-holder to fail');
        } catch (error: unknown) {
          expect((error as Error).message).to.equal('Pre-check (callStatic) for accept failed');
        }
      });
    });

    describe('reject (document)', function () {
      it('holder transitions Issued → Rejected and terminates', async function () {
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: beneficiary.address,
          holderAddress: holder.address,
          tokenId,
        });

        const tx = await rejectObligationRegistry(
          { obligationRegistry },
          holder as Signer,
          { tokenId, remarks: 'rejected' },
          defaultTxOptions(),
        );
        await waitTx(tx);

        const status = await getObligationRegistryStatus({ obligationRegistry }, owner as Signer, {
          tokenId,
        });
        expect(status).to.equal(DocumentStatus.Rejected);

        const reason = await getObligationEscrowTerminationReason(
          { obligationRegistry },
          owner as Signer,
          { tokenId },
        );
        expect(reason).to.equal(ObligationEscrowTerminationReason.Rejected);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.active()).to.equal(false);
      });
    });

    describe('discharge', function () {
      it('beneficiary discharges Accepted → Discharged', async function () {
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: beneficiary.address,
          holderAddress: holder.address,
          tokenId,
        });

        const acceptTx = await acceptObligationRegistry(
          { obligationRegistry },
          holder as Signer,
          { tokenId, remarks: 'accepted for discharge' },
          defaultTxOptions(),
        );
        await waitTx(acceptTx);

        const tx = await dischargeObligationRegistry(
          { obligationRegistry },
          beneficiary as Signer,
          { tokenId, remarks: 'discharged' },
          defaultTxOptions(),
        );
        await waitTx(tx);

        const status = await getObligationRegistryStatus({ obligationRegistry }, owner as Signer, {
          tokenId,
        });
        expect(status).to.equal(DocumentStatus.Discharged);

        const reason = await getObligationEscrowTerminationReason(
          { obligationRegistry },
          owner as Signer,
          { tokenId },
        );
        expect(reason).to.equal(ObligationEscrowTerminationReason.Discharged);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.active()).to.equal(false);
      });

      it('cannot discharge while still Issued', async function () {
        const tokenId = allocateTokenId();
        await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: beneficiary.address,
          holderAddress: holder.address,
          tokenId,
        });

        try {
          await dischargeObligationRegistry(
            { obligationRegistry },
            beneficiary as Signer,
            { tokenId, remarks: 'too early' },
            defaultTxOptions(),
          );
          expect.fail('Expected discharge from Issued to fail');
        } catch (error: unknown) {
          expect((error as Error).message).to.equal('Pre-check (callStatic) for discharge failed');
        }
      });
    });

    describe('remarks without encryption id', function () {
      it('mints with empty remarks and no encryption id', async function () {
        const tokenId = allocateTokenId();
        const tx = await mintObligationRegistry(
          { obligationRegistry },
          owner as Signer,
          {
            beneficiaryAddress: beneficiary.address,
            holderAddress: holder.address,
            tokenId,
            remarks: '',
          },
          { chainId: CHAIN_ID.local },
        );
        await waitTx(tx);

        const status = await getObligationRegistryStatus({ obligationRegistry }, owner as Signer, {
          tokenId,
        });
        expect(status).to.equal(DocumentStatus.Issued);
      });
    });
  });
});
