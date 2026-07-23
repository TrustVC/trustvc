import { expect } from 'chai';
import { Signer } from 'ethers';
import {
  acceptObligationRegistry,
  nominateObligationRegistry,
  rejectTransferBeneficiaryObligationRegistry,
  rejectTransferHolderObligationRegistry,
  rejectTransferOwnersObligationRegistry,
  transferBeneficiaryObligationRegistry,
  transferHolderObligationRegistry,
  transferOwnersObligationRegistry,
} from '../../../obligation-registry-functions';
import { getSignersV5, getSignersV6 } from '../fixtures';
import {
  attachObligationEscrow,
  delay,
  defaultTxOptions,
  deployObligationFixture,
  mintIssuedToken,
  MintIssuedTokenResult,
  waitTx,
  obligationProviders,
  resetHardhatChain,
} from '../obligationUtils';

obligationProviders.forEach(({ ethersVersion }) => {
  describe(`Obligation reject-transfer E2E - ethers ${ethersVersion}`, function () {
    let owner: any;

    let holder: any;

    let beneficiary: any;

    let newHolder: any;

    let newBeneficiary: any;
    let obligationRegistry: string;
    let nextTokenId = 0;

    const allocateTokenId = () => {
      const id = String(nextTokenId);
      nextTokenId += 1;
      return id;
    };

    /**
     * Mint split roles then accept (accept requires beneficiary != holder).
     * @param {string} tokenId - Token ID to mint and accept.
     * @returns {Promise<MintIssuedTokenResult>} Mint result including escrow address.
     */
    const mintAccepted = async (tokenId: string) => {
      const minted = await mintIssuedToken({
        obligationRegistry,
        owner,
        beneficiaryAddress: beneficiary.address,
        holderAddress: holder.address,
        tokenId,
      });
      const acceptTx = await acceptObligationRegistry(
        { obligationRegistry },
        holder as Signer,
        { tokenId, remarks: 'accept for reject-transfer' },
        defaultTxOptions(),
      );
      await waitTx(acceptTx);
      return minted;
    };

    before(async function () {
      this.timeout(120000);
      await resetHardhatChain();

      const signers = ethersVersion === 'v5' ? await getSignersV5(6) : await getSignersV6(6);
      [owner, holder, beneficiary, newHolder, newBeneficiary] = signers;

      const deployed = await deployObligationFixture(owner);
      obligationRegistry = deployed.obligationRegistry;
      await delay();
    });

    describe('rejectTransferHolder', function () {
      it('new holder rejects pending holder transfer', async function () {
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintAccepted(tokenId);

        const transferTx = await transferHolderObligationRegistry(
          { obligationRegistry, tokenId },
          holder as Signer,
          { holderAddress: newHolder.address, remarks: 'pending holder' },
          defaultTxOptions(),
        );
        await waitTx(transferTx);

        const rejectTx = await rejectTransferHolderObligationRegistry(
          { obligationRegistry, tokenId },
          newHolder as Signer,
          { remarks: 'reject holder transfer' },
          defaultTxOptions(),
        );
        await waitTx(rejectTx);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.holder()).to.equal(holder.address);
      });
    });

    describe('rejectTransferBeneficiary', function () {
      it('new beneficiary rejects pending beneficiary transfer', async function () {
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintAccepted(tokenId);

        const nominateTx = await nominateObligationRegistry(
          { obligationRegistry, tokenId },
          beneficiary as Signer,
          { newBeneficiaryAddress: newBeneficiary.address, remarks: 'nominate' },
          defaultTxOptions(),
        );
        await waitTx(nominateTx);

        const transferTx = await transferBeneficiaryObligationRegistry(
          { obligationRegistry, tokenId },
          holder as Signer,
          { newBeneficiaryAddress: newBeneficiary.address, remarks: 'confirm' },
          defaultTxOptions(),
        );
        await waitTx(transferTx);

        const rejectTx = await rejectTransferBeneficiaryObligationRegistry(
          { obligationRegistry, tokenId },
          newBeneficiary as Signer,
          { remarks: 'reject beneficiary transfer' },
          defaultTxOptions(),
        );
        await waitTx(rejectTx);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.beneficiary()).to.equal(beneficiary.address);
      });
    });

    describe('rejectTransferOwners', function () {
      it('dual-role recipient rejects owners transfer', async function () {
        // Dual mint (no accept) — transferOwners requires dual role; accept forbids it.
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: holder.address,
          holderAddress: holder.address,
          tokenId,
        });

        const transferTx = await transferOwnersObligationRegistry(
          { obligationRegistry, tokenId },
          holder as Signer,
          {
            newBeneficiaryAddress: newHolder.address,
            newHolderAddress: newHolder.address,
            remarks: 'transfer owners dual',
          },
          defaultTxOptions(),
        );
        await waitTx(transferTx);

        const rejectTx = await rejectTransferOwnersObligationRegistry(
          { obligationRegistry, tokenId },
          newHolder as Signer,
          { remarks: 'reject owners' },
          defaultTxOptions(),
        );
        await waitTx(rejectTx);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.holder()).to.equal(holder.address);
        expect(await escrow.beneficiary()).to.equal(holder.address);
      });

      it('fails when there is no pending owners transfer', async function () {
        const tokenId = allocateTokenId();
        await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: holder.address,
          holderAddress: holder.address,
          tokenId,
        });

        try {
          await rejectTransferOwnersObligationRegistry(
            { obligationRegistry, tokenId },
            holder as Signer,
            { remarks: 'nothing to reject' },
            defaultTxOptions(),
          );
          expect.fail('Expected rejectTransferOwners with no pending transfer to fail');
        } catch (error: unknown) {
          expect((error as Error).message).to.equal(
            'Pre-check (callStatic) for rejectTransferOwners failed',
          );
        }
      });
    });
  });
});
