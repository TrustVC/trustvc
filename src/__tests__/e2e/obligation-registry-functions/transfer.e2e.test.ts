import { expect } from 'chai';
import { Signer } from 'ethers';
import {
  acceptObligationRegistry,
  nominateObligationRegistry,
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
  describe(`Obligation transfer E2E - ethers ${ethersVersion}`, function () {
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
        { tokenId, remarks: 'accept for transfer tests' },
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

    describe('transferHolder', function () {
      it('holder transfers holder role', async function () {
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintAccepted(tokenId);

        const tx = await transferHolderObligationRegistry(
          { obligationRegistry, tokenId },
          holder as Signer,
          { holderAddress: newHolder.address, remarks: 'transfer holder' },
          defaultTxOptions(),
        );
        await waitTx(tx);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.holder()).to.equal(newHolder.address);
        expect(await escrow.beneficiary()).to.equal(beneficiary.address);
      });

      it('non-holder cannot transfer holder', async function () {
        const tokenId = allocateTokenId();
        await mintAccepted(tokenId);

        try {
          await transferHolderObligationRegistry(
            { obligationRegistry, tokenId },
            beneficiary as Signer,
            { holderAddress: newHolder.address, remarks: 'unauthorized' },
            defaultTxOptions(),
          );
          expect.fail('Expected unauthorized transferHolder to fail');
        } catch (error: unknown) {
          expect((error as Error).message).to.equal(
            'Pre-check (callStatic) for transferHolder failed',
          );
        }
      });
    });

    describe('nominate + transferBeneficiary', function () {
      it('beneficiary nominates and holder confirms', async function () {
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintAccepted(tokenId);

        const nominateTx = await nominateObligationRegistry(
          { obligationRegistry, tokenId },
          beneficiary as Signer,
          { newBeneficiaryAddress: newBeneficiary.address, remarks: 'nominate' },
          defaultTxOptions(),
        );
        await waitTx(nominateTx);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.nominee()).to.equal(newBeneficiary.address);

        const transferTx = await transferBeneficiaryObligationRegistry(
          { obligationRegistry, tokenId },
          holder as Signer,
          { newBeneficiaryAddress: newBeneficiary.address, remarks: 'confirm beneficiary' },
          defaultTxOptions(),
        );
        await waitTx(transferTx);

        expect(await escrow.beneficiary()).to.equal(newBeneficiary.address);
      });

      it('non-beneficiary cannot nominate', async function () {
        const tokenId = allocateTokenId();
        await mintAccepted(tokenId);

        try {
          await nominateObligationRegistry(
            { obligationRegistry, tokenId },
            holder as Signer,
            { newBeneficiaryAddress: newBeneficiary.address, remarks: 'unauthorized' },
            defaultTxOptions(),
          );
          expect.fail('Expected unauthorized nominate to fail');
        } catch (error: unknown) {
          expect((error as Error).message).to.equal('Pre-check (callStatic) for nominate failed');
        }
      });
    });

    describe('transferOwners', function () {
      it('dual-role holder transfers both roles (Issued, no accept needed)', async function () {
        // Dual-role cannot accept; transfers still work while active/Issued.
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: holder.address,
          holderAddress: holder.address,
          tokenId,
        });

        const tx = await transferOwnersObligationRegistry(
          { obligationRegistry, tokenId },
          holder as Signer,
          {
            newBeneficiaryAddress: newBeneficiary.address,
            newHolderAddress: newHolder.address,
            remarks: 'transfer owners',
          },
          defaultTxOptions(),
        );
        await waitTx(tx);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.beneficiary()).to.equal(newBeneficiary.address);
        expect(await escrow.holder()).to.equal(newHolder.address);
      });

      it('fails when caller is not dual-role', async function () {
        const tokenId = allocateTokenId();
        await mintAccepted(tokenId);

        try {
          await transferOwnersObligationRegistry(
            { obligationRegistry, tokenId },
            holder as Signer,
            {
              newBeneficiaryAddress: newBeneficiary.address,
              newHolderAddress: newHolder.address,
              remarks: 'not dual role',
            },
            defaultTxOptions(),
          );
          expect.fail('Expected transferOwners without dual role to fail');
        } catch (error: unknown) {
          expect((error as Error).message).to.equal(
            'Pre-check (callStatic) for transferOwners failed',
          );
        }
      });
    });
  });
});
