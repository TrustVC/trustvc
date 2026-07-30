import assert from 'node:assert/strict';
import { network } from 'hardhat';
import '@nomiclabs/hardhat-ethers';
import {
  acceptObligationRegistry,
  rejectObligationRegistry,
  dischargeObligationRegistry,
  getObligationRegistryStatus,
  getObligationEscrowTerminationReason,
  isObligationRegistryRegistered,
  mintObligationRegistry,
  ObligationDocumentStatus,
  ObligationEscrowTerminationReason,
} from '../../../obligation-registry-functions';
import { createObligationContract } from '../utils';
import {
  buildObligationE2ESetup,
  createObligationE2ESigners,
  deployObligationE2ERegistry,
  getObligationE2EEscrowAddress,
  mintObligationE2EToken,
  obligationE2EProviders,
  type ObligationE2ESetup,
} from './fixtures';

async function expectRejection(
  promise: Promise<unknown>,
  messageIncludes?: string | RegExp,
): Promise<void> {
  try {
    await promise;
    assert.fail('Expected promise to reject');
  } catch (error: unknown) {
    if (error instanceof assert.AssertionError && error.message === 'Expected promise to reject') {
      throw error;
    }
    if (messageIncludes === undefined) return;
    const message = error instanceof Error ? error.message : String(error);
    if (typeof messageIncludes === 'string') {
      assert.match(message, new RegExp(messageIncludes));
    } else {
      assert.match(message, messageIncludes);
    }
  }
}

obligationE2EProviders.forEach(({ ethersVersion }) => {
  describe(`Obligation status lifecycle E2E (ethers ${ethersVersion})`, function () {
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

    it('E1: mint → Issued, isRegistered true, terminationReason None', async function () {
      const tokenId = '1';

      await mintObligationE2EToken(
        setup,
        tokenId,
        setup.holder.address,
        setup.beneficiary.address,
        'issued',
      );

      const status = await getObligationRegistryStatus(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.deployer,
        { tokenId },
      );
      const registered = await isObligationRegistryRegistered(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.deployer,
        { tokenId },
      );
      const reason = await getObligationEscrowTerminationReason(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.deployer,
        { tokenId },
      );

      assert.equal(status, ObligationDocumentStatus.Issued);
      assert.equal(registered, true);
      assert.equal(reason, ObligationEscrowTerminationReason.None);
    });

    it('E2: duplicate mint fails', async function () {
      const tokenId = '2';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);

      await expectRejection(
        mintObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry },
          setup.deployer,
          {
            beneficiaryAddress: setup.beneficiary.address,
            holderAddress: setup.holder.address,
            tokenId,
          },
          setup.txOptions,
        ),
      );
    });

    it('E3: accept fails when beneficiary == holder', async function () {
      const tokenId = '3';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.holder.address);

      await expectRejection(
        acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          {},
          setup.txOptions,
        ),
        /accept failed/,
      );
    });

    it('E4: holder accept transitions Issued → Accepted', async function () {
      const tokenId = '4';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);

      await (
        await acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          { remarks: 'accepted' },
          setup.txOptions,
        )
      ).wait();

      const status = await getObligationRegistryStatus(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.deployer,
        { tokenId },
      );

      assert.equal(status, ObligationDocumentStatus.Accepted);
    });

    it('E5: non-holder cannot accept', async function () {
      const tokenId = '5';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);

      await expectRejection(
        acceptObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.beneficiary,
          {},
          setup.txOptions,
        ),
        /accept failed/,
      );
    });

    it('E6: holder reject → Rejected + terminationReason Rejected + inactive', async function () {
      const tokenId = '6';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);

      await (
        await rejectObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.holder,
          { remarks: 'rejected' },
          setup.txOptions,
        )
      ).wait();

      const status = await getObligationRegistryStatus(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.deployer,
        { tokenId },
      );
      const reason = await getObligationEscrowTerminationReason(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.deployer,
        { tokenId },
      );
      const escrowAddress = await getObligationE2EEscrowAddress(setup, tokenId);
      const escrow = createObligationContract(
        escrowAddress,
        'ObligationEscrow',
        ethersVersion,
        setup.deployer,
      );

      assert.equal(status, ObligationDocumentStatus.Rejected);
      assert.equal(reason, ObligationEscrowTerminationReason.Rejected);
      assert.equal(await escrow.active(), false);
    });

    it('E7: beneficiary discharge → Discharged + terminationReason Discharged', async function () {
      const tokenId = '7';

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
        await dischargeObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.beneficiary,
          { remarks: 'discharged' },
          setup.txOptions,
        )
      ).wait();

      const status = await getObligationRegistryStatus(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.deployer,
        { tokenId },
      );
      const reason = await getObligationEscrowTerminationReason(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.deployer,
        { tokenId },
      );

      assert.equal(status, ObligationDocumentStatus.Discharged);
      assert.equal(reason, ObligationEscrowTerminationReason.Discharged);
    });

    it('E8: discharge while Issued fails', async function () {
      const tokenId = '8';

      await mintObligationE2EToken(setup, tokenId, setup.holder.address, setup.beneficiary.address);

      await expectRejection(
        dischargeObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry, tokenId },
          setup.beneficiary,
          {},
          setup.txOptions,
        ),
        /discharge failed/,
      );
    });

    it('E9: mint with empty remarks / no encryption id', async function () {
      const tokenId = '9';

      await (
        await mintObligationRegistry(
          { obligationRegistryAddress: setup.obligationRegistry },
          setup.deployer,
          {
            beneficiaryAddress: setup.beneficiary.address,
            holderAddress: setup.holder.address,
            tokenId,
          },
          { chainId: setup.txOptions.chainId },
        )
      ).wait();

      const status = await getObligationRegistryStatus(
        { obligationRegistryAddress: setup.obligationRegistry, tokenId },
        setup.deployer,
        { tokenId },
      );

      assert.equal(status, ObligationDocumentStatus.Issued);
    });
  });
});
