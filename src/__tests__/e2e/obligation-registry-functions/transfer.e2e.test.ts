import { expect } from 'chai';
import { network } from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import 'chai-as-promised';
import {
  acceptObligationRegistry,
  nominateObligationRegistry,
  rejectTransferHolderObligationRegistry,
  transferBeneficiaryObligationRegistry,
  transferHolderObligationRegistry,
  transferOwnersObligationRegistry,
} from '../../../obligation-registry-functions';
import {
  buildObligationE2ESetup,
  createObligationE2ESigners,
  deployObligationE2ERegistry,
  getObligationE2EEscrowAddress,
  mintObligationE2EToken,
  obligationE2EProviders,
  type ObligationE2ESetup,
} from './fixtures';
import { createObligationContract } from '../utils';

obligationE2EProviders.forEach(({ ethersVersion }) => {
  describe(`Obligation transfer E2E (ethers ${ethersVersion})`, function () {
    let setup: ObligationE2ESetup;

    before(async function () {
      await network.provider.send('evm_setAutomine', [true]);
      await network.provider.send('hardhat_reset');

      const signers = await createObligationE2ESigners(ethersVersion, 6);
      const deployed = await deployObligationE2ERegistry(signers[0]);
      setup = buildObligationE2ESetup(
        ethersVersion,
        signers,
        deployed.obligationRegistry,
        deployed.obligationEscrowFactoryAddress,
      );
    });

    it('E10: transferHolder after accept', async function () {
      const tokenId = '10';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);
      await (
        await acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          {},
          setup.txOptions,
        )
      ).wait();

      const tx = await transferHolderObligationRegistry(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.holder,
        { holderAddress: setup.other.address, remarks: 'transfer holder' },
        setup.txOptions,
      );
      await tx.wait();

      expect(tx.hash).to.be.a('string');
    });

    it('E11: non-holder cannot transferHolder', async function () {
      const tokenId = '11';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);
      await (
        await acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          {},
          setup.txOptions,
        )
      ).wait();

      await expect(
        transferHolderObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.beneficiary,
          { holderAddress: setup.other.address },
          setup.txOptions,
        ),
      ).to.be.revertedWith(/transferHolder failed/);
    });

    it('E12: nominate + transferBeneficiary', async function () {
      const tokenId = '12';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);
      await (
        await acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          {},
          setup.txOptions,
        )
      ).wait();

      await (
        await nominateObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.beneficiary,
          { newBeneficiaryAddress: setup.other.address },
          setup.txOptions,
        )
      ).wait();

      const tx = await transferBeneficiaryObligationRegistry(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.holder,
        { newBeneficiaryAddress: setup.other.address },
        setup.txOptions,
      );
      await tx.wait();

      expect(tx.hash).to.be.a('string');
    });

    it('E13: non-beneficiary cannot nominate', async function () {
      const tokenId = '13';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);
      await (
        await acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          {},
          setup.txOptions,
        )
      ).wait();

      await expect(
        nominateObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          { newBeneficiaryAddress: setup.other.address },
          setup.txOptions,
        ),
      ).to.be.rejectedWith(/nominate failed/);
    });

    it('E14: dual-role transferOwners on Issued (no accept)', async function () {
      const tokenId = '14';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.holder.address);

      const tx = await transferOwnersObligationRegistry(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.holder,
        {
          newHolderAddress: setup.other.address,
          newBeneficiaryAddress: setup.beneficiary.address,
        },
        setup.txOptions,
      );
      await tx.wait();

      expect(tx.hash).to.be.a('string');

      const escrowAddress = await getObligationE2EEscrowAddress(setup, tokenId);
      const escrow = createObligationContract(
        escrowAddress,
        'ObligationEscrow',
        ethersVersion,
        setup.deployer,
      );

      // transferOwners must apply newHolderAddress to the holder role and
      // newBeneficiaryAddress to the beneficiary role, not swapped.
      expect(await escrow.holder()).to.equal(setup.other.address);
      expect(await escrow.beneficiary()).to.equal(setup.beneficiary.address);
    });

    it('E15: transferOwners fails when not dual-role', async function () {
      const tokenId = '15';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);

      await expect(
        transferOwnersObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          {
            newHolderAddress: setup.other.address,
            newBeneficiaryAddress: setup.beneficiary.address,
          },
          setup.txOptions,
        ),
      ).to.be.rejectedWith(/transferOwners failed/);
    });

    it('E16: rejectTransferHolder fails once that holder has accepted the appointment', async function () {
      const tokenId = '16';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);

      await (
        await transferHolderObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          { holderAddress: setup.other.address, remarks: 'transfer holder' },
          setup.txOptions,
        )
      ).wait();

      await (
        await acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.other,
          {},
          setup.txOptions,
        )
      ).wait();

      await expect(
        rejectTransferHolderObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.other,
          {},
          setup.txOptions,
        ),
      ).to.be.rejectedWith(/rejectTransferHolder failed/);
    });

    it('E17: rejectTransferHolder succeeds for a holder appointed after an earlier holder accepted', async function () {
      const tokenId = '17';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);

      await (
        await acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          {},
          setup.txOptions,
        )
      ).wait();

      // The accepter transfers holdership onward — a fresh appointment, unrelated to their accept.
      await (
        await transferHolderObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          { holderAddress: setup.other.address, remarks: 'transfer holder' },
          setup.txOptions,
        )
      ).wait();

      const tx = await rejectTransferHolderObligationRegistry(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.other,
        { remarks: 'reject holdership' },
        setup.txOptions,
      );
      await tx.wait();

      const escrowAddress = await getObligationE2EEscrowAddress(setup, tokenId);
      const escrow = createObligationContract(
        escrowAddress,
        'ObligationEscrow',
        ethersVersion,
        setup.deployer,
      );

      expect(await escrow.holder()).to.equal(setup.holder.address);
    });

    it('E18: a holder reappointed via a fresh transfer can reject, even if they are the original accepter', async function () {
      const tokenId = '18';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);

      await (
        await acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          {},
          setup.txOptions,
        )
      ).wait();

      await (
        await transferHolderObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          { holderAddress: setup.other.address, remarks: 'transfer holder' },
          setup.txOptions,
        )
      ).wait();

      // A fresh transfer back to the original accepter — not a reject — re-opens their window.
      await (
        await transferHolderObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.other,
          { holderAddress: setup.holder.address, remarks: 'transfer holder back' },
          setup.txOptions,
        )
      ).wait();

      const tx = await rejectTransferHolderObligationRegistry(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.holder,
        { remarks: 'reject holdership again' },
        setup.txOptions,
      );
      await tx.wait();

      const escrowAddress = await getObligationE2EEscrowAddress(setup, tokenId);
      const escrow = createObligationContract(
        escrowAddress,
        'ObligationEscrow',
        ethersVersion,
        setup.deployer,
      );

      expect(await escrow.holder()).to.equal(setup.other.address);
    });
  });
});
