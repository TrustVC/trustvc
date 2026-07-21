import { expect } from 'chai';
import { Signer } from 'ethers';
import {
  acceptObligationRegistry,
  acceptReturnedObligationRegistry,
  getObligationEscrowTerminationReason,
  rejectReturnedObligationRegistry,
  returnToIssuerObligationRegistry,
  transferHolderObligationRegistry,
  ObligationEscrowTerminationReason,
} from '../../../obligation-registry-functions';
import { getSignersV5, getSignersV6Fresh } from '../fixtures';
import {
  attachObligationEscrow,
  attachTrustVCToken,
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
  describe(`Obligation return-to-issuer E2E - ethers ${ethersVersion}`, function () {
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

    /**
     * Accept requires split roles; returnToIssuer requires dual role.
     * Flow: mint split → accept → transferHolder to beneficiary → dual beneficiary returns.
     * @param {string} tokenId - Token ID to mint, accept, and consolidate.
     * @returns {Promise<MintIssuedTokenResult>} Mint result including escrow address.
     */
    const mintAcceptedThenConsolidateDual = async (tokenId: string) => {
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
        { tokenId, remarks: 'accept for return' },
        defaultTxOptions(),
      );
      await waitTx(acceptTx);

      const consolidateTx = await transferHolderObligationRegistry(
        { obligationRegistry, tokenId },
        holder as Signer,
        { holderAddress: beneficiary.address, remarks: 'consolidate dual role' },
        defaultTxOptions(),
      );
      await waitTx(consolidateTx);

      return minted;
    };

    before(async function () {
      this.timeout(120000);
      await resetHardhatChain();

      const signers = ethersVersion === 'v5' ? await getSignersV5(4) : await getSignersV6Fresh(4);
      [owner, holder, beneficiary] = signers;

      const deployed = await deployObligationFixture(owner);
      obligationRegistry = deployed.obligationRegistry;
      await delay();
    });

    describe('returnToIssuer', function () {
      it('dual-role returns token to registry (Issued, no accept)', async function () {
        const tokenId = allocateTokenId();
        await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: beneficiary.address,
          holderAddress: beneficiary.address,
          tokenId,
        });

        const tx = await returnToIssuerObligationRegistry(
          { obligationRegistry, tokenId },
          beneficiary as Signer,
          { remarks: 'return to issuer' },
          defaultTxOptions(),
        );
        await waitTx(tx);

        const token = attachTrustVCToken(obligationRegistry, ethersVersion, owner);
        expect(await token.ownerOf(tokenId)).to.equal(obligationRegistry);

        // terminationReason is set on shred/burn, not on return alone
        const reason = await getObligationEscrowTerminationReason(
          { obligationRegistry },
          owner as Signer,
          { tokenId },
        );
        expect(reason).to.equal(ObligationEscrowTerminationReason.None);
      });

      it('dual-role returns after accept + consolidate', async function () {
        const tokenId = allocateTokenId();
        await mintAcceptedThenConsolidateDual(tokenId);

        const tx = await returnToIssuerObligationRegistry(
          { obligationRegistry, tokenId },
          beneficiary as Signer,
          { remarks: 'return after accept' },
          defaultTxOptions(),
        );
        await waitTx(tx);

        const token = attachTrustVCToken(obligationRegistry, ethersVersion, owner);
        expect(await token.ownerOf(tokenId)).to.equal(obligationRegistry);
      });
    });

    describe('rejectReturned (restore)', function () {
      it('registry owner restores a returned token', async function () {
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintAcceptedThenConsolidateDual(tokenId);

        const returnTx = await returnToIssuerObligationRegistry(
          { obligationRegistry, tokenId },
          beneficiary as Signer,
          { remarks: 'return then restore' },
          defaultTxOptions(),
        );
        await waitTx(returnTx);

        const restoreTx = await rejectReturnedObligationRegistry(
          { obligationRegistry },
          owner as Signer,
          { tokenId, remarks: 'restore' },
          defaultTxOptions(),
        );
        await waitTx(restoreTx);

        const token = attachTrustVCToken(obligationRegistry, ethersVersion, owner);
        expect(await token.ownerOf(tokenId)).to.equal(escrowAddress);

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.active()).to.equal(true);

        const reason = await getObligationEscrowTerminationReason(
          { obligationRegistry },
          owner as Signer,
          { tokenId },
        );
        expect(reason).to.equal(ObligationEscrowTerminationReason.None);
      });
    });

    describe('acceptReturned (burn)', function () {
      it('registry owner burns a returned token', async function () {
        const tokenId = allocateTokenId();
        const { escrowAddress } = await mintAcceptedThenConsolidateDual(tokenId);

        const returnTx = await returnToIssuerObligationRegistry(
          { obligationRegistry, tokenId },
          beneficiary as Signer,
          { remarks: 'return then burn' },
          defaultTxOptions(),
        );
        await waitTx(returnTx);

        const burnTx = await acceptReturnedObligationRegistry(
          { obligationRegistry },
          owner as Signer,
          { tokenId, remarks: 'burn' },
          defaultTxOptions(),
        );
        await waitTx(burnTx);

        const token = attachTrustVCToken(obligationRegistry, ethersVersion, owner);
        try {
          await token.ownerOf(tokenId);
          expect.fail('Expected ownerOf to revert after burn');
        } catch {
          // burned
        }

        const escrow = attachObligationEscrow(escrowAddress, ethersVersion, owner);
        expect(await escrow.active()).to.equal(false);

        const reason = await getObligationEscrowTerminationReason(
          { obligationRegistry },
          owner as Signer,
          { tokenId },
        );
        expect(reason).to.equal(ObligationEscrowTerminationReason.ReturnToIssuer);
      });
    });

    describe('error handling', function () {
      it('split roles cannot returnToIssuer', async function () {
        const tokenId = allocateTokenId();
        await mintIssuedToken({
          obligationRegistry,
          owner,
          beneficiaryAddress: beneficiary.address,
          holderAddress: holder.address,
          tokenId,
        });
        const acceptTx = await acceptObligationRegistry(
          { obligationRegistry },
          holder as Signer,
          { tokenId, remarks: 'accept split roles' },
          defaultTxOptions(),
        );
        await waitTx(acceptTx);

        try {
          await returnToIssuerObligationRegistry(
            { obligationRegistry, tokenId },
            holder as Signer,
            { remarks: 'not dual role' },
            defaultTxOptions(),
          );
          expect.fail('Expected returnToIssuer without dual role to fail');
        } catch (error: unknown) {
          expect((error as Error).message).to.equal(
            'Pre-check (callStatic) for returnToIssuer failed',
          );
        }
      });
    });
  });
});
