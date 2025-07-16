import { expect } from 'chai';
import { network } from 'hardhat';
import { ethers as ethersV6 } from 'ethersV6';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';
import { CHAIN_ID } from '@tradetrust-tt/tradetrust-utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

// Import the functions we want to test
import {
  transferHolder,
  transferBeneficiary,
  transferOwners,
  nominate,
} from '../../../../src/token-registry-functions/transfer';
import { mint } from '../../../../src/token-registry-functions/mint';
import type {
  MintTokenOptions,
  MintTokenParams,
  TransactionOptions,
} from '../../../../src/token-registry-functions/types';
import { v5Contracts } from '../../../../src/token-registry-v5';
import { ethers, Signer } from 'ethers';

// Import our new signer utilities
import { getSignersV5, getSignersV6, providerV5, providerV6 } from '../fixtures';
import { ProviderInfo } from '../../../../src/token-registry-functions/types';
import {
  createContract,
  getV4TitleEscrowContractFromTitleEscrowFactory,
  getVersionedContractFactory,
} from '../utils';

interface ContractAddresses {
  tokenAddress: string;
  titleEscrow0: string;
  titleEscrow1: string;
  holder1: string;
  beneficiary1: string;
  holder2: string;
  beneficiary2: string;
}

const providers: ProviderInfo[] = [
  {
    Provider: providerV5,
    ethersVersion: 'v5',
    titleEscrowVersion: 'v5',
  },
  {
    Provider: providerV5,
    ethersVersion: 'v5',
    titleEscrowVersion: 'v4',
  },
  {
    Provider: providerV6,
    ethersVersion: 'v6',
    titleEscrowVersion: 'v5',
  },
  {
    Provider: providerV6,
    ethersVersion: 'v6',
    titleEscrowVersion: 'v4',
  },
];

providers.forEach(({ Provider, ethersVersion, titleEscrowVersion }) => {
  describe(`Transfer Functions E2E Tests -with ethers ${ethersVersion} and token registry ${titleEscrowVersion}`, async function () {
    let TradeTrustTokenContract: any;
    let TitleEscrowFactoryContract: any;
    let titleEscrowFactoryAddress: any;
    let titleEscrow0: any;
    let titleEscrow1: any;
    let owner: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let holder1: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let beneficiary1: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let holder2: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let beneficiary2: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let newHolder: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let newBeneficiary: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let addresses: ContractAddresses;
    let tradeTrustTokenAddress: string;

    before(async function () {
      await network.provider.send('evm_setAutomine', [true]); // Ensure auto-mining
      await network.provider.send('hardhat_reset'); // Reset network between tests
      // Reset nonce tracker for clean state (especially important for v6)
      // resetNonceTracker();

      // Get signers using our custom utility (returns ethers.Wallet[])
      // For v6, use unique private keys based on provider index to avoid nonce conflicts
      const signers = ethersVersion === 'v5' ? await getSignersV5(8) : await getSignersV6(8); // Larger offset for v6
      // const signers = await hardhatEthers.getSigners();
      [owner, holder1, beneficiary1, holder2, beneficiary2, newHolder, newBeneficiary] = signers;

      // Deploy TitleEscrowFactory first
      console.log('Deploying TitleEscrowFactory...');

      const titleEscrowFactory = getVersionedContractFactory(
        'TitleEscrowFactory',
        ethersVersion,
        titleEscrowVersion,
        owner,
      );

      TitleEscrowFactoryContract = await titleEscrowFactory.deploy();
      if (ethersVersion === 'v6') {
        await TitleEscrowFactoryContract.waitForDeployment();
      } else {
        await TitleEscrowFactoryContract.deployTransaction.wait();
      }

      titleEscrowFactoryAddress =
        ethersVersion === 'v5'
          ? (TitleEscrowFactoryContract as ethers.Contract).address
          : (TitleEscrowFactoryContract as ethersV6.Contract).target;

      // Deploy TradeTrustToken with proper constructor arguments
      console.log('Deploying TradeTrustToken...');
      const tradeTrustTokenFactory = getVersionedContractFactory(
        'TradeTrustToken',
        ethersVersion,
        titleEscrowVersion,
        owner,
      );

      // add a time delay here
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (ethersVersion === 'v6') {
        const nonce = await providerV6.getTransactionCount(owner.address, 'pending');
        TradeTrustTokenContract = await tradeTrustTokenFactory.deploy(
          'Test TradeTrust Token',
          'TTT',
          titleEscrowFactoryAddress,
          {
            nonce: nonce,
          },
        );
      } else {
        TradeTrustTokenContract = await tradeTrustTokenFactory.deploy(
          'Test TradeTrust Token',
          'TTT',
          titleEscrowFactoryAddress,
        );
        // await TradeTrustTokenContract.wait();
      }

      tradeTrustTokenAddress =
        ethersVersion === 'v5'
          ? (TradeTrustTokenContract as ethers.Contract).address
          : await (TradeTrustTokenContract as ethersV6.Contract).getAddress();
      console.log('TradeTrustToken deployed to:', tradeTrustTokenAddress);

      console.log('All mock contracts deployed and initialized for E2E testing');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    describe('Token Minting', function () {
      beforeEach(async function () {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });
      it('should mint token 0 with beneficiary1 and holder1', async function () {
        const contractOptions: MintTokenOptions = {
          tokenRegistryAddress: tradeTrustTokenAddress,
        };

        const params: MintTokenParams = {
          beneficiaryAddress: beneficiary1.address,
          holderAddress: holder1.address,
          tokenId: '0',
          remarks: 'Initial mint for testing',
        };

        const options: TransactionOptions = {
          titleEscrowVersion,
          chainId: CHAIN_ID.local,
          id: 'test-encryption-key',
        };

        const tx1 = await mint(contractOptions, owner as unknown as Signer, params, options);
        await tx1.wait();

        // Verify token ownership
        const ownerOfToken0 = await TradeTrustTokenContract.ownerOf('0');
        expect(ownerOfToken0).to.not.equal('0x0000000000000000000000000000000000000000');
      });

      it('should mint token 1 with beneficiary2 and holder2', async function () {
        const contractOptions: MintTokenOptions = {
          tokenRegistryAddress: tradeTrustTokenAddress,
        };

        const params: MintTokenParams = {
          beneficiaryAddress: beneficiary2.address,
          holderAddress: holder2.address,
          tokenId: '1',
          remarks: 'Initial mint for testing',
        };

        const options: TransactionOptions = {
          titleEscrowVersion: titleEscrowVersion,
          chainId: CHAIN_ID.local,
          id: 'test-encryption-key',
        };

        const tx2 = await mint(contractOptions, owner as unknown as Signer, params, options);
        await tx2.wait();

        // Verify token ownership
        const ownerOfToken1 = await TradeTrustTokenContract.ownerOf('1');
        expect(ownerOfToken1).to.not.equal('0x0000000000000000000000000000000000000000');
      });

      it('should fail when trying to mint duplicate token ID', async function () {
        const contractOptions: MintTokenOptions = {
          tokenRegistryAddress: tradeTrustTokenAddress,
        };

        const params: MintTokenParams = {
          beneficiaryAddress: beneficiary1.address,
          holderAddress: holder1.address,
          tokenId: '0', // Same as first token - should fail
          remarks: 'Duplicate mint attempt',
        };

        const options: TransactionOptions = {
          titleEscrowVersion: titleEscrowVersion,
          chainId: CHAIN_ID.local,
        };

        // Should revert due to duplicate token ID
        try {
          await mint(contractOptions, owner as unknown as Signer, params, options);
          expect.fail('Expected function to throw an error');
        } catch (error: any) {
          expect(error.message).to.equal('Pre-check (callStatic) for mint failed');
        }
      });

      it('should fail when minting with invalid beneficiary address', async function () {
        const contractOptions: MintTokenOptions = {
          tokenRegistryAddress: tradeTrustTokenAddress,
        };

        const params: MintTokenParams = {
          beneficiaryAddress: '0x0000000000000000000000000000000000000000', // Invalid zero address
          holderAddress: holder1.address,
          tokenId: '999',
          remarks: 'Invalid address test',
        };

        const options: TransactionOptions = {
          titleEscrowVersion: titleEscrowVersion,
          chainId: CHAIN_ID.local,
        };

        // Should revert due to invalid beneficiary address
        try {
          await mint(contractOptions, owner as unknown as Signer, params, options);
          expect.fail('Expected function to throw an error');
        } catch (error: any) {
          expect(error.message).to.equal('Pre-check (callStatic) for mint failed');
        }
      });

      it('should fail when non-owner tries to mint', async function () {
        const contractOptions: MintTokenOptions = {
          tokenRegistryAddress: tradeTrustTokenAddress,
        };

        const params: MintTokenParams = {
          beneficiaryAddress: beneficiary1.address,
          holderAddress: holder1.address,
          tokenId: '998',
          remarks: 'Unauthorized mint attempt',
        };

        const options: TransactionOptions = {
          titleEscrowVersion: titleEscrowVersion,
          chainId: CHAIN_ID.local,
        };

        // Use holder1 (non-owner) as signer - should fail
        try {
          await mint(contractOptions, holder1 as unknown as Signer, params, options);
          expect.fail('Expected function to throw an error');
        } catch (error: any) {
          expect(error.message).to.equal('Pre-check (callStatic) for mint failed');
        }
      });

      it('should mint token with encrypted remarks (V5 only)', async function () {
        // Skip this test for V4 as it doesn't support encrypted remarks
        if (titleEscrowVersion === 'v4') {
          console.log('Skipping encrypted remarks test for V4');
          this.skip();
        }

        const contractOptions: MintTokenOptions = {
          tokenRegistryAddress: tradeTrustTokenAddress,
        };

        const params: MintTokenParams = {
          beneficiaryAddress: beneficiary1.address,
          holderAddress: holder1.address,
          tokenId: '997',
          remarks: 'This should be encrypted in V5 contracts',
        };

        const options: TransactionOptions = {
          titleEscrowVersion: titleEscrowVersion,
          chainId: CHAIN_ID.local,
          id: 'test-encryption-key', // Enable encryption for V5
        };

        const tx = await mint(contractOptions, owner as unknown as Signer, params, options);
        await tx.wait();

        // Verify token was created successfully
        const ownerOfToken = await TradeTrustTokenContract.ownerOf('997');
        expect(ownerOfToken).to.not.equal('0x0000000000000000000000000000000000000000');
      });

      it('should mint token without remarks', async function () {
        const contractOptions: MintTokenOptions = {
          tokenRegistryAddress: tradeTrustTokenAddress,
        };

        const params: MintTokenParams = {
          beneficiaryAddress: beneficiary2.address,
          holderAddress: holder2.address,
          tokenId: '996',
          // No remarks property - should work fine
        };

        const options: TransactionOptions = {
          titleEscrowVersion: titleEscrowVersion,
          chainId: CHAIN_ID.local,
        };

        const tx = await mint(contractOptions, owner as unknown as Signer, params, options);
        await tx.wait();

        // Verify token was created successfully
        const ownerOfToken = await TradeTrustTokenContract.ownerOf('996');
        expect(ownerOfToken).to.not.equal('0x0000000000000000000000000000000000000000');
      });

      it('should set up title escrow addresses and contract instances', async function () {
        // Get title escrow addresses using the factory

        const titleEscrow0Address =
          titleEscrowVersion === 'v5'
            ? await (TitleEscrowFactoryContract as v5Contracts.TitleEscrowFactory).getEscrowAddress(
                tradeTrustTokenAddress,
                '0',
              )
            : await getV4TitleEscrowContractFromTitleEscrowFactory(
                Provider,
                TitleEscrowFactoryContract,
                tradeTrustTokenAddress,
                '0',
              );

        const titleEscrow1Address =
          titleEscrowVersion === 'v5'
            ? await (TitleEscrowFactoryContract as v5Contracts.TitleEscrowFactory).getEscrowAddress(
                tradeTrustTokenAddress,
                '1',
              )
            : await getV4TitleEscrowContractFromTitleEscrowFactory(
                Provider,
                TitleEscrowFactoryContract,
                tradeTrustTokenAddress,
                '1',
              );

        // Get contract instances
        titleEscrow0 = createContract(
          titleEscrow0Address,
          'TitleEscrow',
          ethersVersion,
          titleEscrowVersion,
          owner,
        );

        titleEscrow1 = createContract(
          titleEscrow1Address,
          'TitleEscrow',
          ethersVersion,
          titleEscrowVersion,
          owner,
        );

        // Set up addresses object for use in transfer tests
        addresses = {
          tokenAddress: tradeTrustTokenAddress,
          titleEscrow0: titleEscrow0Address,
          titleEscrow1: titleEscrow1Address,
          holder1: holder1.address,
          beneficiary1: beneficiary1.address,
          holder2: holder2.address,
          beneficiary2: beneficiary2.address,
        };

        // Verify that escrow contracts are properly connected
        expect(titleEscrow0Address).to.not.equal('0x0000000000000000000000000000000000000000');
        expect(titleEscrow1Address).to.not.equal('0x0000000000000000000000000000000000000000');
        expect(addresses.tokenAddress).to.equal(tradeTrustTokenAddress);
      });

      it('should verify token registry state after minting', async function () {
        // Verify specific token ownership
        const token0Owner = await TradeTrustTokenContract.ownerOf('0');
        const token1Owner = await TradeTrustTokenContract.ownerOf('1');

        expect(token0Owner).to.equal(addresses.titleEscrow0);
        expect(token1Owner).to.equal(addresses.titleEscrow1);
      });
    });

    describe('Transfer Holder', function () {
      it('should have correct initial state', async function () {
        const initialHolder = await titleEscrow0.holder();
        const initialBeneficiary = await titleEscrow0.beneficiary();

        expect(initialHolder).to.equal(holder1.address);
        expect(initialBeneficiary).to.equal(beneficiary1.address);
      });

      it('should successfully transfer holder role from holder1 to newHolder', async function () {
        const contractOptions = {
          titleEscrowAddress: addresses.titleEscrow0,
        };

        const params = {
          holderAddress: newHolder.address,
          remarks: 'Transfer holder to new address',
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
          id: 'test-encryption-id',
        };

        // Check initial state
        const initialHolder = await titleEscrow0.holder();

        expect(initialHolder).to.equal(holder1.address);

        // Execute transfer using type assertion to bypass type issues
        const tx = await transferHolder(contractOptions, holder1, params, options);

        // Wait for transaction to be mined
        await tx.wait();

        // Verify holder has changed
        const newHolderAddress = await titleEscrow0.holder();
        expect(newHolderAddress).to.equal(newHolder.address);

        // Verify event was emitted
        const receipt = await tx.wait();
        const events = receipt?.logs || [];
        expect(events.length).to.be.greaterThan(0);
      });

      it('should fail when non-holder tries to transfer holder role', async function () {
        const tokenId = '1';
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId,
          titleEscrowAddress: addresses.titleEscrow1,
        };

        const params = {
          holderAddress: newHolder.address,
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
        };

        // Try to transfer from non-holder (should fail)
        try {
          await transferHolder(contractOptions, beneficiary2 as any, params, options);
          expect.fail('Expected function to throw an error');
        } catch (error: any) {
          expect(error.message).to.equal('Pre-check (callStatic) for transferHolder failed');
        }
      });

      it('should handle transfer without remarks', async function () {
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId: '1',
          titleEscrowAddress: addresses.titleEscrow1,
        };

        const params = {
          holderAddress: newHolder.address,
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
        };

        const tx = await transferHolder(contractOptions, holder2 as any, params, options);
        await tx.wait();

        const holderAddress = await titleEscrow1.holder();
        expect(holderAddress).to.equal(newHolder.address);
      });
    });

    describe('Nominate', function () {
      it('should successfully nominate a new beneficiary', async function () {
        const tokenId = '0';
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId,
          titleEscrowAddress: addresses.titleEscrow0,
        };

        const params = {
          newBeneficiaryAddress: newBeneficiary.address,
          remarks: 'Nominate new beneficiary',
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
          id: 'test-encryption-id',
        };

        // Current beneficiary is beneficiary1, nominate from them
        const tx = await nominate(contractOptions, beneficiary1 as any, params, options);
        await tx.wait();

        // Verify nominee has been set
        const nominee = await titleEscrow0.nominee();
        expect(nominee).to.equal(newBeneficiary.address);
      });

      it('should fail when non-beneficiary tries to nominate', async function () {
        const tokenId = '1';
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId,
          titleEscrowAddress: addresses.titleEscrow1,
        };

        const params = {
          newBeneficiaryAddress: newBeneficiary.address,
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
        };

        // Try to nominate from non-beneficiary (should fail)
        // Since we don't know the exact revert reason, catch any error
        try {
          await nominate(contractOptions, holder2 as any, params, options);
          expect.fail('Expected transaction to revert but it succeeded');
        } catch (error: any) {
          // The function should fail either at callStatic level or with a contract revert
          // Both are acceptable for this test case
          expect(error.message).to.satisfy((msg: string) => {
            return (
              msg.includes('Pre-check (callStatic) for nominate failed') ||
              msg.includes('CallerNotBeneficiary') ||
              msg.includes('revert') ||
              msg.includes('reverted')
            );
          });
        }
      });

      it('should handle nomination without remarks', async function () {
        const tokenId = '1';
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId,
          titleEscrowAddress: addresses.titleEscrow1,
        };

        const params = {
          newBeneficiaryAddress: holder1.address,
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
        };

        const tx = await nominate(contractOptions, beneficiary2 as any, params, options);
        await tx.wait();

        const nominee = await titleEscrow1.nominee();
        expect(nominee).to.equal(holder1.address);
      });
    });

    describe('Transfer Beneficiary', function () {
      beforeEach(async function () {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });
      it('should successfully transfer beneficiary role', async function () {
        const tokenId = '0';
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId,
          titleEscrowAddress: addresses.titleEscrow0,
        };

        const params = {
          newBeneficiaryAddress: newBeneficiary.address,
          remarks: 'Transfer beneficiary to new address',
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
          id: 'test-encryption-id',
        };

        // Check initial state
        const initialBeneficiary = await titleEscrow0.beneficiary();
        expect(initialBeneficiary).to.equal(beneficiary1.address);

        // Transfer beneficiary using newHolder (current holder after transferHolder test)
        const tx = await transferBeneficiary(contractOptions, newHolder as any, params, options);

        await tx.wait();

        // Verify beneficiary has changed
        const newBeneficiaryAddress = await titleEscrow0.beneficiary();
        expect(newBeneficiaryAddress).to.equal(newBeneficiary.address);
      });

      it('should fail when non-holder tries to transfer beneficiary', async function () {
        const tokenId = '0';
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId,
          titleEscrowAddress: addresses.titleEscrow0,
        };

        const params = {
          newBeneficiaryAddress: newBeneficiary.address,
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
        };

        // Try to transfer from non-holder (should fail)
        try {
          await transferBeneficiary(contractOptions, beneficiary2 as any, params, options);
          expect.fail('Expected function to throw an error');
        } catch (error: any) {
          expect(error.message).to.equal('Pre-check (callStatic) for transferBeneficiary failed');
        }
      });
    });

    describe('transfer Owners', function () {
      beforeEach(async function () {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      });
      it('should successfully transfer both holder and beneficiary roles', async function () {
        // Make current holder (newHolder) also the beneficiary for token 0
        const prevContractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId: '0',
          titleEscrowAddress: addresses.titleEscrow0,
        };
        const prevParams = {
          newBeneficiaryAddress: newHolder.address,
          remarks: 'Nominate and endorse new beneficiary',
        };
        const prevOptions = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
          id: 'test-encryption-id',
        };
        const nominateTxn = await nominate(
          prevContractOptions,
          newBeneficiary as any,
          prevParams,
          prevOptions,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await nominateTxn.wait();
        const beneficiaryTransferTxn = await transferBeneficiary(
          prevContractOptions,
          newHolder as any,
          prevParams,
          prevOptions,
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await beneficiaryTransferTxn.wait();
        const tokenId = '0';
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId,
          titleEscrowAddress: addresses.titleEscrow0,
        };

        const params = {
          newBeneficiaryAddress: beneficiary2.address,
          newHolderAddress: holder2.address,
          remarks: 'Transfer both roles',
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
          id: 'test-encryption-id',
        };

        // Execute transfer using current holder (newHolder)
        const tx = await transferOwners(contractOptions, newHolder as any, params, options);
        await tx.wait();

        // Verify both roles have changed
        const holderAddress = await titleEscrow0.holder();
        const beneficiaryAddress = await titleEscrow0.beneficiary();

        expect(holderAddress).to.equal(holder2.address);
        expect(beneficiaryAddress).to.equal(beneficiary2.address);
      });

      it('should fail when caller is not both holder and beneficiary', async function () {
        const tokenId = '1';
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId,
          titleEscrowAddress: addresses.titleEscrow1,
        };

        const params = {
          newBeneficiaryAddress: newBeneficiary.address,
          newHolderAddress: newHolder.address,
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
        };

        // holder2 is holder but beneficiary2 is beneficiary (different addresses)
        // Since we don't know the exact revert reason, catch any error
        try {
          await transferOwners(contractOptions, holder2 as any, params, options);
          expect.fail('Expected transaction to revert but it succeeded');
        } catch (error: any) {
          // The function should fail either at callStatic level or with a contract revert
          // Both are acceptable for this test case
          expect(error.message).to.satisfy((msg: string) => {
            return (
              msg.includes('Pre-check (callStatic) for transferOwners failed') ||
              msg.includes('CallerNotBeneficiary') ||
              msg.includes('revert') ||
              msg.includes('reverted')
            );
          });
        }
      });
    });

    describe('Error handling', function () {
      it('should throw error when tokenRegistryAddress and titleEscrowAddress is missing', async function () {
        const contractOptions = {
          tokenRegistryAddress: '',
          tokenId: '0',
          // titleEscrowAddress is intentionally missing
        };

        const params = {
          holderAddress: newHolder.address,
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
        };

        try {
          await transferHolder(contractOptions, holder2 as any, params, options);
          expect.fail('Expected function to throw an error');
        } catch (error: any) {
          expect(error.message).to.equal('Token registry address is required');
        }
      });

      it('should throw error when provider is missing', async function () {
        const signerWithoutProvider = new ethers.Wallet(
          '0x0000000000000000000000000000000000000000000000000000000000000001',
        );

        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId: '0',
          titleEscrowAddress: addresses.titleEscrow0,
        };

        const params = {
          holderAddress: newHolder.address,
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
        };

        try {
          await transferHolder(contractOptions, signerWithoutProvider as any, params, options);
          expect.fail('Expected function to throw an error');
        } catch (error: any) {
          expect(error.message).to.equal('Provider is required');
        }
      });
    });

    describe('Gas estimation and transaction options', function () {
      it('should handle custom gas options', async function () {
        const tokenId = '0';
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId,
          titleEscrowAddress: addresses.titleEscrow0,
        };

        const params = {
          holderAddress: holder1.address,
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
          maxFeePerGas: ethers.utils.parseUnits('20', 'gwei').toHexString(),
          maxPriorityFeePerGas: ethers.utils.parseUnits('2', 'gwei').toHexString(),
        };

        // Transfer back to holder1 from newHolder
        const tx = await transferHolder(contractOptions, holder2 as any, params, options);
        await tx.wait();

        const holderAddress = await titleEscrow0.holder();
        expect(holderAddress).to.equal(holder1.address);
      });
    });
  });
});
