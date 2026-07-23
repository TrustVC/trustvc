import { expect } from 'chai';
import { Signer } from 'ethers';
import { fetchObligationEndorsementChain } from '../../../core/obligation-endorsement-chain';
import {
  acceptObligationRegistry,
  returnToIssuerObligationRegistry,
  transferHolderObligationRegistry,
} from '../../../obligation-registry-functions';
import { getSignersV5, getSignersV6, providerV5 } from '../fixtures';
import {
  delay,
  defaultTxOptions,
  deployObligationFixture,
  mintIssuedToken,
  waitTx,
  obligationProviders,
  resetHardhatChain,
} from '../obligationUtils';

obligationProviders.forEach(({ ethersVersion }) => {
  describe(`Obligation endorsement-chain E2E - ethers ${ethersVersion}`, function () {
    let owner: any;

    let holder: any;

    let beneficiary: any;
    let obligationRegistry: string;

    let readProvider: any;

    before(async function () {
      this.timeout(120000);
      await resetHardhatChain();

      const signers = ethersVersion === 'v5' ? await getSignersV5(4) : await getSignersV6(4);
      [owner, holder, beneficiary] = signers;
      readProvider = ethersVersion === 'v5' ? providerV5 : owner.provider;

      const deployed = await deployObligationFixture(owner);
      obligationRegistry = deployed.obligationRegistry;
      await delay();
    });

    it('builds ordered chain for mint → accept → transferHolder → return', async function () {
      this.timeout(120000);
      const tokenId = '0';

      // Accept requires split roles; return requires dual — consolidate via transferHolder.
      const { escrowAddress } = await mintIssuedToken({
        obligationRegistry,
        owner,
        beneficiaryAddress: beneficiary.address,
        holderAddress: holder.address,
        tokenId,
        remarks: 'chain mint',
      });

      const acceptTx = await acceptObligationRegistry(
        { obligationRegistry },
        holder as Signer,
        { tokenId, remarks: 'chain accept' },
        defaultTxOptions(),
      );
      await waitTx(acceptTx);

      const transferHolderTx = await transferHolderObligationRegistry(
        { obligationRegistry, tokenId },
        holder as Signer,
        { holderAddress: beneficiary.address, remarks: 'chain consolidate dual' },
        defaultTxOptions(),
      );
      await waitTx(transferHolderTx);

      const returnTx = await returnToIssuerObligationRegistry(
        { obligationRegistry, tokenId },
        beneficiary as Signer,
        { remarks: 'chain return' },
        defaultTxOptions(),
      );
      await waitTx(returnTx);

      const chain = await fetchObligationEndorsementChain(
        obligationRegistry,
        tokenId,
        readProvider,
        {
          keyId: 'test-encryption-key',
          titleEscrowAddress: escrowAddress,
          maxBlockRange: 50,
          rpcConcurrency: 2,
        },
      );

      expect(chain.length).to.be.greaterThan(0);
      const types = chain.map((event) => event.type);

      // Mint tx merges TokenReceived + StatusInitialized (+ role sets) into one event.
      expect(types.some((t) => t === 'INITIAL' || t === 'STATUS_INITIALIZED')).to.equal(true);
      expect(types).to.include('STATUS_ACCEPTED');
      expect(types).to.include('TRANSFER_HOLDER');
      expect(types).to.include('RETURNED_TO_ISSUER');

      const mintIdx = types.findIndex((t) => t === 'INITIAL' || t === 'STATUS_INITIALIZED');
      const acceptIdx = types.indexOf('STATUS_ACCEPTED');
      const returnIdx = types.indexOf('RETURNED_TO_ISSUER');
      expect(mintIdx).to.be.lessThan(acceptIdx);
      expect(acceptIdx).to.be.lessThan(returnIdx);

      for (const event of chain) {
        expect(event.transactionHash).to.match(/^0x[a-fA-F0-9]+$/);
        expect(event.timestamp).to.be.a('number');
      }
    });

    it('works with default RPC options', async function () {
      this.timeout(60000);
      const tokenId = '1';

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
        { tokenId, remarks: 'accept defaults' },
        defaultTxOptions(),
      );
      await waitTx(acceptTx);

      const chain = await fetchObligationEndorsementChain(
        obligationRegistry,
        tokenId,
        readProvider,
      );

      const types = chain.map((event) => event.type);
      expect(types.some((t) => t === 'INITIAL' || t === 'STATUS_INITIALIZED')).to.equal(true);
      expect(types).to.include('STATUS_ACCEPTED');
    });
  });
});
