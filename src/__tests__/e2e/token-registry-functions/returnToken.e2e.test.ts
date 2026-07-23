import { expect } from 'chai';
import { ethers as ethersV6, ZeroAddress } from 'ethersV6';
import { CHAIN_ID } from '../../../utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

// Import the functions we want to test
import {
  transferBeneficiary,
  transferOwners,
  nominate,
  mint,
  rejectReturned,
  rejectTransferBeneficiary,
  rejectTransferHolder,
  rejectTransferOwners,
  returnToIssuer,
} from '../../../token-registry-functions';
import type {
  MintTokenOptions,
  MintTokenParams,
  TransactionOptions,
  ProviderInfo,
} from '../../../token-registry-functions/types';
import { ethers, Signer } from 'ethers';

// Import our new signer utilities
import { getSignersV5, getSignersV6, providerV5, providerV6 } from '../fixtures';
import { createContract, getVersionedContractFactory } from '../utils';
interface ContractAddresses {
  tokenAddress: string;
  titleEscrow: string;
  holder: string;
  beneficiary: string;
  newHolder: string;
  newBeneficiary: string;
  owner: string;
  newOwner: string;
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

providers.forEach(({ ethersVersion, titleEscrowVersion }) => {
  describe(`Return Token Functions E2E Tests -with ethers ${ethersVersion} and token registry ${titleEscrowVersion}`, async function () {
    let TradeTrustTokenContract: any;
    let TitleEscrowFactoryContract: any;
    let titleEscrowFactoryAddress: any;
    let titleEscrow: any;
    let deployer: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let owner: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let newOwner: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let holder: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let beneficiary: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let newHolder: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let newBeneficiary: ethers.Wallet | ethersV6.Wallet | SignerWithAddress;
    let addresses: ContractAddresses;
    let tradeTrustTokenAddress: string;

    before(async function () {
      // Reset nonce tracker for clean state (especially important for v6)

      // Get signers using our custom utility (returns ethers.Wallet[])
      // For v6, use unique private keys based on provider index to avoid nonce conflicts
      const signers = ethersVersion === 'v5' ? await getSignersV5(11) : await getSignersV6(11); // Larger offset for v6
      // const signers = await hardhatEthers.getSigners();
      [deployer, owner, newOwner, holder, beneficiary, newHolder, newBeneficiary] = signers;

      // Deploy TitleEscrowFactory first
      console.log('Deploying TitleEscrowFactory...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const titleEscrowFactory = getVersionedContractFactory(
        'TitleEscrowFactory',
        ethersVersion,
        titleEscrowVersion,
        deployer,
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const tradeTrustTokenFactory = getVersionedContractFactory(
        'TradeTrustToken',
        ethersVersion,
        titleEscrowVersion,
        deployer,
      );

      // add a time delay here

      if (ethersVersion === 'v6') {
        const nonce = await providerV6.getTransactionCount(deployer.address, 'pending');
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
      console.log('Minting token...');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const contractOptions: MintTokenOptions = {
        tokenRegistryAddress: tradeTrustTokenAddress,
      };

      const params: MintTokenParams = {
        beneficiaryAddress: holder.address, //keeping both initial holder and beneficiary same
        holderAddress: holder.address,
        tokenId: '0',
        remarks: 'Initial mint for testing',
      };

      const options: TransactionOptions = {
        titleEscrowVersion,
        chainId: CHAIN_ID.local,
        id: 'test-encryption-key',
      };

      const tx0 = await mint(contractOptions, deployer as unknown as Signer, params, options);
      await tx0.wait();
      await new Promise((resolve) => setTimeout(resolve, 1000));

      titleEscrow = createContract(
        await TradeTrustTokenContract.ownerOf('0'),
        'TitleEscrow',
        ethersVersion,
        titleEscrowVersion,
        deployer,
      );

      addresses = {
        tokenAddress: tradeTrustTokenAddress,
        titleEscrow: titleEscrow.address || titleEscrow.target,
        holder: holder.address,
        beneficiary: beneficiary.address,
        newHolder: newHolder.address,
        newBeneficiary: newBeneficiary.address,
        owner: owner.address,
        newOwner: newOwner.address,
      };
    });
    describe('returnToIssuer', () => {
      describe.only('Successful Return to Issuer', () => {
        beforeEach(async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
          };

          const params = {
            tokenId: '0',
            remarks: 'Reject Returned Document',
          };

          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };
          const ownerOfToken = await TradeTrustTokenContract.ownerOf('0');
          if (ownerOfToken !== addresses.titleEscrow) {
            const tx = await rejectReturned(contractOptions, deployer, params, options);
            await tx.wait();
          }
        });
        it('should have correct initial state', async function () {
          const currentHolder = await titleEscrow.holder();
          const currentBeneficiary = await titleEscrow.beneficiary();

          expect(currentHolder).to.equal(holder.address);
          expect(currentBeneficiary).to.equal(holder.address);
        });
        it('should return to issuer successfully with remarks provided', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: 'Transfer holder to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };
          // Execute transfer using type assertion to bypass type issues
          const tx = await returnToIssuer(contractOptions, holder, params, options);

          // Wait for transaction to be mined
          await tx.wait();

          // Verify token owner has changed
          const ownerOfToken = await TradeTrustTokenContract.ownerOf('0');
          expect(ownerOfToken).to.equal(addresses.tokenAddress);

          // Verify event was emitted
          const receipt = await tx.wait();
          const events = receipt?.logs || [];
          expect(events.length).to.be.greaterThan(0);
        });
        it('should return to issue successfully without remarks', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: '',
          };

          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          const tx = await returnToIssuer(contractOptions, holder, params, options);

          // Wait for transaction to be mined
          await tx.wait();

          // Verify token owner has changed
          const ownerOfToken = await TradeTrustTokenContract.ownerOf('0');
          expect(ownerOfToken).to.equal(addresses.tokenAddress);

          // Verify event was emitted
          const receipt = await tx.wait();
          const events = receipt?.logs || [];
          expect(events.length).to.be.greaterThan(0);
        });
        it('should detect version v5 automatically when titleEscrowVersion is not passed', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: 'Transfer holder to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          const tx = await returnToIssuer(contractOptions, holder, params, options);

          // Wait for transaction to be mined
          await tx.wait();

          // Verify owner has changed
          const ownerOfToken = await TradeTrustTokenContract.ownerOf('0');
          expect(ownerOfToken).to.equal(addresses.tokenAddress);
        });
        it('should handle undefined/empty options object without crashing (safeguards)', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '0',
          };

          const params = {};

          const options = {
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues

          const tx = await returnToIssuer(contractOptions, holder, params, options);
          await tx.wait();

          // Verify owner has changed
          const ownerOfToken = await TradeTrustTokenContract.ownerOf('0');
          expect(ownerOfToken).to.equal(addresses.tokenAddress);
        });
      });
      describe('Error Handling', () => {
        it('should fail if titleEscrowAddress is not derivable from tokenRegistryAddress and tokenId', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '2', //invalid token ID
          };

          const params = {
            remarks: 'Transfer both roles',
          };
          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };

          try {
            await rejectTransferHolder(contractOptions, holder as any, params, options);
            expect.fail('Expected transaction to revert but it succeeded');
          } catch (error: any) {
            // The function should fail either at callStatic level or with a contract revert
            // Both are acceptable for this test case
            expect(error.message).to.include('ERC721: owner query for nonexistent token');
          }
        });

        it('should throw error if signer has no provider', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };
          const params = {
            remarks: 'Transfer both roles',
          };
          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };
          const signerWithoutProvider = new ethers.Wallet(
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          );

          try {
            await rejectTransferHolder(
              contractOptions,
              signerWithoutProvider as any,
              params,
              options,
            );
          } catch (error: any) {
            expect(error.message).to.equal('Provider is required');
          }
        });

        it('should throw error if titleEscrow contract is not version v5', async () => {
          const titleEscrowFactoryV4 = getVersionedContractFactory(
            'TitleEscrowFactory',
            ethersVersion,
            'v4',
            deployer,
          );

          const TitleEscrowFactoryContractV4 = await titleEscrowFactoryV4.deploy();
          if (ethersVersion === 'v6') {
            await TitleEscrowFactoryContractV4.waitForDeployment();
          }

          const titleEscrowFactoryAddressV4 =
            ethersVersion === 'v5'
              ? (TitleEscrowFactoryContractV4 as ethers.Contract).address
              : (TitleEscrowFactoryContractV4 as ethersV6.Contract).target;

          // Deploy TradeTrustToken with proper constructor arguments
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const tradeTrustTokenFactoryV4 = getVersionedContractFactory(
            'TradeTrustToken',
            ethersVersion,
            'v4',
            deployer,
          );

          // add a time delay here
          let TradeTrustTokenContractV4: any;
          if (ethersVersion === 'v6') {
            const nonce = await providerV6.getTransactionCount(deployer.address, 'pending');
            TradeTrustTokenContractV4 = await tradeTrustTokenFactoryV4.deploy(
              'Test TradeTrust Token',
              'TTT',
              titleEscrowFactoryAddressV4,
              {
                nonce: nonce,
              },
            );
          } else {
            TradeTrustTokenContractV4 = await tradeTrustTokenFactoryV4.deploy(
              'Test TradeTrust Token',
              'TTT',
              titleEscrowFactoryAddressV4,
            );
            // await TradeTrustTokenContract.wait();
          }

          const tradeTrustTokenAddressV4 =
            ethersVersion === 'v5'
              ? (TradeTrustTokenContractV4 as ethers.Contract).address
              : await (TradeTrustTokenContractV4 as ethersV6.Contract).getAddress();
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const contractOptions: MintTokenOptions = {
            tokenRegistryAddress: tradeTrustTokenAddressV4,
          };

          const params: MintTokenParams = {
            beneficiaryAddress: holder.address, //keeping both initial holder and beneficiary same
            holderAddress: holder.address,
            tokenId: '0',
            remarks: 'Initial mint for testing',
          };

          const options: TransactionOptions = {
            titleEscrowVersion: 'v4',
            chainId: CHAIN_ID.local,
            id: 'test-encryption-key',
          };

          const txV4 = await mint(contractOptions, deployer as unknown as Signer, params, options);
          await txV4.wait();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const titleEscrowv4 = createContract(
            await TradeTrustTokenContractV4.ownerOf('0'),
            'TitleEscrow',
            ethersVersion,
            'v4',
            deployer,
          );
          const contractOptionsV4 = {
            titleEscrowAddress: (titleEscrowv4.address || titleEscrowv4.target) as string,
          };

          const paramsV4 = {
            newBeneficiaryAddress: addresses.newBeneficiary,
            newHolderAddress: addresses.newHolder,
            remarks: 'Transfer both roles',
          };

          const optionsV4 = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion: 'v4' as const,
            id: 'test-encryption-id',
          };

          // Execute transfer using current holder (newHolder)
          const tx = await transferOwners(contractOptionsV4, holder as any, paramsV4, optionsV4);
          await tx.wait();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const contractOptionsV4Reject = {
            titleEscrowAddress: titleEscrowv4.address || titleEscrowv4.target,
          };

          const paramsV4Reject = {
            remarks: 'Reject transfer holder to new address',
          };

          const optionsV4Reject = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion: 'v4' as const,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferHolder(
              contractOptionsV4Reject,
              newHolder,
              paramsV4Reject,
              optionsV4Reject,
            );
          } catch (error: any) {
            expect(error.message).to.equal('Only Token Registry V5 is supported');
          }
        });

        it('should throw error when callStatic rejectTransferHolder fails', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: 'Transfer holder to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferHolder(contractOptions, newHolder, params, options); //reject is invalid
          } catch (error: any) {
            expect(error.message).to.equal(
              'Pre-check (callStatic) for rejectTransferHolder failed',
            );
          }
        });

        it('should fail if tokenRegistryAddress is not provided when titleEscrowAddress is undefined', async () => {
          const contractOptions = {
            tokenRegistryAddress: '',
            tokenId: '0',
          };

          const params = {
            remarks: 'Transfer holder to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferHolder(contractOptions, newHolder, params, options);
          } catch (error: any) {
            expect(error.message).to.equal('Token registry address is required');
          }
        });

        it('should fail if tokenId is missing when titleEscrowAddress is undefined', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '',
          };

          const params = {
            remarks: 'Transfer holder to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferHolder(contractOptions, newHolder, params, options);
          } catch (error: any) {
            expect(error.message).to.equal('Token ID is required');
          }
        });

        it('should throw error if `encrypt` function throws (invalid remarks or id)', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '0',
          };

          const params = {
            remarks: 'Transfer holder to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferHolder(contractOptions, newHolder, params, options);
          } catch (error: any) {
            expect(error.message).to.equal(
              `Cannot read properties of undefined (reading 'length')`,
            );
          }
        });
        //   it('should allow retrying the transaction if it fails due to nonce issues');
      });
    });
    describe('rejectTransferBeneficiary', () => {
      describe('Successful Rejection of Beneficiary', () => {
        beforeEach(async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '0',
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            newBeneficiaryAddress: addresses.newBeneficiary,
            remarks: 'Transfer Beneficiary',
          };

          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };
          const prevBeneficiary = await titleEscrow.prevBeneficiary();
          // Execute transfer using current holder (newHolder)
          if (prevBeneficiary == ZeroAddress) {
            const tx0 = await nominate(contractOptions, beneficiary, params, options);
            await tx0.wait();
            const tx1 = await transferBeneficiary(contractOptions, holder, params, options);
            await tx1.wait();
          }
        });
        it('should have correct initial state', async function () {
          const currentHolder = await titleEscrow.holder();
          const currentBeneficiary = await titleEscrow.beneficiary();
          const prevHolder = await titleEscrow.prevHolder();
          const prevBeneficiary = await titleEscrow.prevBeneficiary();

          expect(currentHolder).to.equal(holder.address);
          expect(currentBeneficiary).to.equal(newBeneficiary.address);
          expect(prevHolder).to.equal(ZeroAddress);
          expect(prevBeneficiary).to.equal(beneficiary.address);
        });
        it('should reject beneficiary transfer successfully with remarks provided', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: 'Transfer beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          const tx = await rejectTransferBeneficiary(
            contractOptions,
            newBeneficiary,
            params,
            options,
          );

          // Wait for transaction to be mined
          await tx.wait();

          // Verify holder has changed
          const newHolderAddress = await titleEscrow.holder();
          expect(newHolderAddress).to.equal(holder.address);
          const newBeneficiaryAddress = await titleEscrow.beneficiary();
          expect(newBeneficiaryAddress).to.equal(beneficiary.address);
          const prevHolder = await titleEscrow.prevHolder();
          expect(prevHolder).to.equal(ZeroAddress);
          const prevBeneficiary = await titleEscrow.prevBeneficiary();
          expect(prevBeneficiary).to.equal(ZeroAddress);

          // Verify event was emitted
          const receipt = await tx.wait();
          const events = receipt?.logs || [];
          expect(events.length).to.be.greaterThan(0);
        });

        it('should reject holder transfer successfully without remarks', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: '',
          };

          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          const tx = await rejectTransferBeneficiary(
            contractOptions,
            newBeneficiary,
            params,
            options,
          );

          // Wait for transaction to be mined
          await tx.wait();

          // Verify beneficiary has changed
          const newBeneficiaryAddress = await titleEscrow.beneficiary();
          expect(newBeneficiaryAddress).to.equal(beneficiary.address);

          // Verify event was emitted
          const receipt = await tx.wait();
          const events = receipt?.logs || [];
          expect(events.length).to.be.greaterThan(0);
        });

        it('should detect version v5 automatically when titleEscrowVersion is not passed', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: 'Transfer beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          const tx = await rejectTransferBeneficiary(
            contractOptions,
            newBeneficiary,
            params,
            options,
          );

          // Wait for transaction to be mined
          await tx.wait();

          // Verify beneficiary has changed
          const newBeneficiaryAddress = await titleEscrow.beneficiary();
          expect(newBeneficiaryAddress).to.equal(beneficiary.address);
          const prevBeneficiary = await titleEscrow.prevBeneficiary();
          expect(prevBeneficiary).to.equal(ZeroAddress);
        });

        it('should handle undefined/empty options object without crashing (safeguards)', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '0',
          };

          const params = {};

          const options = {
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues

          const tx = await rejectTransferBeneficiary(
            contractOptions,
            newBeneficiary,
            params,
            options,
          );
          await tx.wait();

          // Verify beneficiary has changed
          const newBeneficiaryAddress = await titleEscrow.beneficiary();
          expect(newBeneficiaryAddress).to.equal(beneficiary.address);
          const prevBeneficiary = await titleEscrow.prevBeneficiary();
          expect(prevBeneficiary).to.equal(ZeroAddress);
        });
      });
      describe('Error Handling', () => {
        it('should fail if titleEscrowAddress is not derivable from tokenRegistryAddress and tokenId', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '2', //invalid token ID
          };

          const params = {
            remarks: 'Transfer both roles',
          };
          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };

          try {
            await rejectTransferBeneficiary(contractOptions, newBeneficiary, params, options);
            expect.fail('Expected transaction to revert but it succeeded');
          } catch (error: any) {
            // The function should fail either at callStatic level or with a contract revert
            // Both are acceptable for this test case
            expect(error.message).to.include('ERC721: owner query for nonexistent token');
          }
        });

        it('should throw error if signer has no provider', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };
          const params = {
            remarks: 'Transfer both roles',
          };
          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };
          const signerWithoutProvider = new ethers.Wallet(
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          );

          try {
            await rejectTransferBeneficiary(
              contractOptions,
              signerWithoutProvider as any,
              params,
              options,
            );
          } catch (error: any) {
            expect(error.message).to.equal('Provider is required');
          }
        });

        it('should throw error if titleEscrow contract is not version v5', async () => {
          const titleEscrowFactoryV4 = getVersionedContractFactory(
            'TitleEscrowFactory',
            ethersVersion,
            'v4',
            deployer,
          );

          const TitleEscrowFactoryContractV4 = await titleEscrowFactoryV4.deploy();
          if (ethersVersion === 'v6') {
            await TitleEscrowFactoryContractV4.waitForDeployment();
          }

          const titleEscrowFactoryAddressV4 =
            ethersVersion === 'v5'
              ? (TitleEscrowFactoryContractV4 as ethers.Contract).address
              : (TitleEscrowFactoryContractV4 as ethersV6.Contract).target;

          // Deploy TradeTrustToken with proper constructor arguments
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const tradeTrustTokenFactoryV4 = getVersionedContractFactory(
            'TradeTrustToken',
            ethersVersion,
            'v4',
            deployer,
          );

          // add a time delay here
          let TradeTrustTokenContractV4: any;
          if (ethersVersion === 'v6') {
            const nonce = await providerV6.getTransactionCount(deployer.address, 'pending');
            TradeTrustTokenContractV4 = await tradeTrustTokenFactoryV4.deploy(
              'Test TradeTrust Token',
              'TTT',
              titleEscrowFactoryAddressV4,
              {
                nonce: nonce,
              },
            );
          } else {
            TradeTrustTokenContractV4 = await tradeTrustTokenFactoryV4.deploy(
              'Test TradeTrust Token',
              'TTT',
              titleEscrowFactoryAddressV4,
            );
            // await TradeTrustTokenContract.wait();
          }

          const tradeTrustTokenAddressV4 =
            ethersVersion === 'v5'
              ? (TradeTrustTokenContractV4 as ethers.Contract).address
              : await (TradeTrustTokenContractV4 as ethersV6.Contract).getAddress();

          await new Promise((resolve) => setTimeout(resolve, 1000));

          const contractOptions: MintTokenOptions = {
            tokenRegistryAddress: tradeTrustTokenAddressV4,
          };

          const params: MintTokenParams = {
            beneficiaryAddress: holder.address, //keeping both initial holder and beneficiary same
            holderAddress: holder.address,
            tokenId: '0',
            remarks: 'Initial mint for testing',
          };

          const options: TransactionOptions = {
            titleEscrowVersion: 'v4',
            chainId: CHAIN_ID.local,
            id: 'test-encryption-key',
          };

          const txV4 = await mint(contractOptions, deployer as unknown as Signer, params, options);
          await txV4.wait();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const titleEscrowv4 = createContract(
            await TradeTrustTokenContractV4.ownerOf('0'),
            'TitleEscrow',
            ethersVersion,
            'v4',
            deployer,
          );
          const contractOptionsV4 = {
            titleEscrowAddress: (titleEscrowv4.address || titleEscrowv4.target) as string,
          };

          const paramsV4 = {
            newBeneficiaryAddress: addresses.newBeneficiary,
            newHolderAddress: addresses.newHolder,
            remarks: 'Transfer both roles',
          };

          const optionsV4 = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion: 'v4' as const,
            id: 'test-encryption-id',
          };

          // Execute transfer using current holder (newHolder)
          const tx = await transferOwners(contractOptionsV4, holder as any, paramsV4, optionsV4);
          await tx.wait();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const contractOptionsV4Reject = {
            titleEscrowAddress: titleEscrowv4.address || titleEscrowv4.target,
          };

          const paramsV4Reject = {
            remarks: 'Reject transfer beneficiary to new address',
          };

          const optionsV4Reject = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion: 'v4' as const,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferBeneficiary(
              contractOptionsV4Reject,
              newHolder,
              paramsV4Reject,
              optionsV4Reject,
            );
          } catch (error: any) {
            expect(error.message).to.equal('Only Token Registry V5 is supported');
          }
        });

        it('should throw error when callStatic rejectTransferHolder fails', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: 'Transfer Beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferBeneficiary(contractOptions, newHolder, params, options); //reject is invalid
          } catch (error: any) {
            expect(error.message).to.equal(
              'Pre-check (callStatic) for rejectTransferBeneficiary failed',
            );
          }
        });

        it('should fail if tokenRegistryAddress is not provided when titleEscrowAddress is undefined', async () => {
          const contractOptions = {
            tokenRegistryAddress: '',
            tokenId: '0',
          };

          const params = {
            remarks: 'Transfer Beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferBeneficiary(contractOptions, newHolder, params, options);
          } catch (error: any) {
            expect(error.message).to.equal('Token registry address is required');
          }
        });

        it('should fail if tokenId is missing when titleEscrowAddress is undefined', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '',
          };

          const params = {
            remarks: 'Transfer Beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferBeneficiary(contractOptions, newHolder, params, options);
          } catch (error: any) {
            expect(error.message).to.equal('Token ID is required');
          }
        });

        it('should throw error if `encrypt` function throws (invalid remarks or id)', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '0',
          };

          const params = {
            remarks: 'Transfer Beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferBeneficiary(contractOptions, newHolder, params, options);
          } catch (error: any) {
            expect(error.message).to.equal(
              `Cannot read properties of undefined (reading 'length')`,
            );
          }
        });
        //   it('should allow retrying the transaction if it fails due to nonce issues');
      });
    });
    describe('rejectTransferOwners', () => {
      before(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const contractOptions = {
          tokenRegistryAddress: addresses.tokenAddress,
          tokenId: '0',
          titleEscrowAddress: addresses.titleEscrow,
        };

        const params = {
          newBeneficiaryAddress: addresses.holder,
          remarks: 'Transfer Beneficiary',
        };

        const options = {
          chainId: CHAIN_ID.local,
          titleEscrowVersion,
          id: 'test-encryption-id',
        };
        // Execute transfer using current holder (newHolder)
        const tx0 = await nominate(contractOptions, beneficiary, params, options);
        await tx0.wait();
        const tx1 = await transferBeneficiary(contractOptions, holder, params, options);
        await tx1.wait();
      });
      describe('Successful Rejection of Owners', () => {
        beforeEach(async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '0',
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            newBeneficiaryAddress: addresses.newHolder, //keeping both beneficiary and holder same
            newHolderAddress: addresses.newHolder,
            remarks: 'Transfer Owners',
          };

          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };
          const prevBeneficiary = await titleEscrow.prevBeneficiary();
          const prevHolder = await titleEscrow.prevHolder();

          // Execute transfer using current holder (newHolder)
          if (prevBeneficiary == ZeroAddress || prevHolder == ZeroAddress) {
            const tx1 = await transferOwners(contractOptions, holder, params, options);
            await tx1.wait();
          }
        });
        it('should have correct initial state', async function () {
          const currentHolder = await titleEscrow.holder();
          const currentBeneficiary = await titleEscrow.beneficiary();

          const prevHolder = await titleEscrow.prevHolder();
          const prevBeneficiary = await titleEscrow.prevBeneficiary();

          expect(currentHolder).to.equal(newHolder.address);
          expect(currentBeneficiary).to.equal(newHolder.address);

          expect(prevHolder).to.equal(holder.address);
          expect(prevBeneficiary).to.equal(holder.address);
        });
        it('should reject Owners transfer successfully with remarks provided', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: 'Reject transfer owners',
          };

          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          const tx = await rejectTransferOwners(contractOptions, newHolder, params, options);

          // Wait for transaction to be mined
          await tx.wait();

          // Verify Owners has changed
          const newHolderAddress = await titleEscrow.holder();
          const newBeneficiaryAddress = await titleEscrow.beneficiary();
          const prevHolder = await titleEscrow.prevHolder();
          const prevBeneficiary = await titleEscrow.prevBeneficiary();

          expect(newHolderAddress).to.equal(holder.address);
          expect(newBeneficiaryAddress).to.equal(holder.address);
          expect(prevBeneficiary).to.equal(ZeroAddress);
          expect(prevHolder).to.equal(ZeroAddress);

          // Verify event was emitted
          const receipt = await tx.wait();
          const events = receipt?.logs || [];
          expect(events.length).to.be.greaterThan(0);
        });

        it('should reject holder transfer successfully without remarks', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: '',
          };

          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          const tx = await rejectTransferOwners(contractOptions, newHolder, params, options);

          // Wait for transaction to be mined
          await tx.wait();

          // Verify Owners has changed
          const newHolderAddress = await titleEscrow.holder();
          const newBeneficiaryAddress = await titleEscrow.beneficiary();
          const prevHolder = await titleEscrow.prevHolder();
          const prevBeneficiary = await titleEscrow.prevBeneficiary();

          expect(newHolderAddress).to.equal(holder.address);
          expect(newBeneficiaryAddress).to.equal(holder.address);
          expect(prevBeneficiary).to.equal(ZeroAddress);
          expect(prevHolder).to.equal(ZeroAddress);

          // Verify event was emitted
          const receipt = await tx.wait();
          const events = receipt?.logs || [];
          expect(events.length).to.be.greaterThan(0);
        });

        it('should detect version v5 automatically when titleEscrowVersion is not passed', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: 'Reject Transfer Owners to Previous address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          const tx = await rejectTransferOwners(contractOptions, newHolder, params, options);

          // Wait for transaction to be mined
          await tx.wait();

          // Verify Owners has changed
          const newHolderAddress = await titleEscrow.holder();
          const newBeneficiaryAddress = await titleEscrow.beneficiary();
          const prevHolder = await titleEscrow.prevHolder();
          const prevBeneficiary = await titleEscrow.prevBeneficiary();

          expect(newHolderAddress).to.equal(holder.address);
          expect(newBeneficiaryAddress).to.equal(holder.address);
          expect(prevBeneficiary).to.equal(ZeroAddress);
          expect(prevHolder).to.equal(ZeroAddress);

          // Verify event was emitted
          const receipt = await tx.wait();
          const events = receipt?.logs || [];
          expect(events.length).to.be.greaterThan(0);
        });

        it('should handle undefined/empty options object without crashing (safeguards)', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '0',
          };

          const params = {};

          const options = {
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues

          const tx = await rejectTransferOwners(contractOptions, newHolder, params, options);
          await tx.wait();

          // Verify Owners has changed
          const newHolderAddress = await titleEscrow.holder();
          const newBeneficiaryAddress = await titleEscrow.beneficiary();
          const prevHolder = await titleEscrow.prevHolder();
          const prevBeneficiary = await titleEscrow.prevBeneficiary();

          expect(newHolderAddress).to.equal(holder.address);
          expect(newBeneficiaryAddress).to.equal(holder.address);
          expect(prevBeneficiary).to.equal(ZeroAddress);
          expect(prevHolder).to.equal(ZeroAddress);

          // Verify event was emitted
          const receipt = await tx.wait();
          const events = receipt?.logs || [];
          expect(events.length).to.be.greaterThan(0);
        });
      });
      describe('Error Handling', () => {
        it('should fail if titleEscrowAddress is not derivable from tokenRegistryAddress and tokenId', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '2', //invalid token ID
          };

          const params = {
            remarks: 'Transfer both roles',
          };
          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };

          try {
            await rejectTransferOwners(contractOptions, newHolder, params, options);
            expect.fail('Expected transaction to revert but it succeeded');
          } catch (error: any) {
            // The function should fail either at callStatic level or with a contract revert
            expect(error.message).to.include('ERC721: owner query for nonexistent token');
          }
        });

        it('should throw error if signer has no provider', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };
          const params = {
            remarks: 'Transfer both roles',
          };
          const options = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion,
            id: 'test-encryption-id',
          };
          const signerWithoutProvider = new ethers.Wallet(
            '0x0000000000000000000000000000000000000000000000000000000000000001',
          );

          try {
            await rejectTransferOwners(
              contractOptions,
              signerWithoutProvider as any,
              params,
              options,
            );
          } catch (error: any) {
            expect(error.message).to.equal('Provider is required');
          }
        });

        it('should throw error if titleEscrow contract is not version v5', async () => {
          const titleEscrowFactoryV4 = getVersionedContractFactory(
            'TitleEscrowFactory',
            ethersVersion,
            'v4',
            deployer,
          );

          const TitleEscrowFactoryContractV4 = await titleEscrowFactoryV4.deploy();
          if (ethersVersion === 'v6') {
            await TitleEscrowFactoryContractV4.waitForDeployment();
          }

          const titleEscrowFactoryAddressV4 =
            ethersVersion === 'v5'
              ? (TitleEscrowFactoryContractV4 as ethers.Contract).address
              : (TitleEscrowFactoryContractV4 as ethersV6.Contract).target;

          // Deploy TradeTrustToken with proper constructor arguments
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const tradeTrustTokenFactoryV4 = getVersionedContractFactory(
            'TradeTrustToken',
            ethersVersion,
            'v4',
            deployer,
          );

          // add a time delay here
          let TradeTrustTokenContractV4: any;
          if (ethersVersion === 'v6') {
            const nonce = await providerV6.getTransactionCount(deployer.address, 'pending');
            TradeTrustTokenContractV4 = await tradeTrustTokenFactoryV4.deploy(
              'Test TradeTrust Token',
              'TTT',
              titleEscrowFactoryAddressV4,
              {
                nonce: nonce,
              },
            );
          } else {
            TradeTrustTokenContractV4 = await tradeTrustTokenFactoryV4.deploy(
              'Test TradeTrust Token',
              'TTT',
              titleEscrowFactoryAddressV4,
            );
            // await TradeTrustTokenContract.wait();
          }

          const tradeTrustTokenAddressV4 =
            ethersVersion === 'v5'
              ? (TradeTrustTokenContractV4 as ethers.Contract).address
              : await (TradeTrustTokenContractV4 as ethersV6.Contract).getAddress();
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const contractOptions: MintTokenOptions = {
            tokenRegistryAddress: tradeTrustTokenAddressV4,
          };

          const params: MintTokenParams = {
            beneficiaryAddress: holder.address, //keeping both initial holder and beneficiary same
            holderAddress: holder.address,
            tokenId: '0',
            remarks: 'Initial mint for testing',
          };

          const options: TransactionOptions = {
            titleEscrowVersion: 'v4',
            chainId: CHAIN_ID.local,
            id: 'test-encryption-key',
          };

          const txV4 = await mint(contractOptions, deployer as unknown as Signer, params, options);
          await txV4.wait();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const titleEscrowv4 = createContract(
            await TradeTrustTokenContractV4.ownerOf('0'),
            'TitleEscrow',
            ethersVersion,
            'v4',
            deployer,
          );
          const contractOptionsV4 = {
            titleEscrowAddress: (titleEscrowv4.address || titleEscrowv4.target) as string,
          };

          const paramsV4 = {
            newBeneficiaryAddress: addresses.newBeneficiary,
            newHolderAddress: addresses.newHolder,
            remarks: 'Transfer both roles',
          };

          const optionsV4 = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion: 'v4' as const,
            id: 'test-encryption-id',
          };

          // Execute transfer using current holder (newHolder)
          const tx = await transferOwners(contractOptionsV4, holder as any, paramsV4, optionsV4);
          await tx.wait();
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const contractOptionsV4Reject = {
            titleEscrowAddress: titleEscrowv4.address || titleEscrowv4.target,
          };

          const paramsV4Reject = {
            remarks: 'Reject transfer beneficiary to new address',
          };

          const optionsV4Reject = {
            chainId: CHAIN_ID.local,
            titleEscrowVersion: 'v4' as const,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferOwners(
              contractOptionsV4Reject,
              newHolder,
              paramsV4Reject,
              optionsV4Reject,
            );
          } catch (error: any) {
            expect(error.message).to.equal('Only Token Registry V5 is supported');
          }
        });

        it('should throw error when callStatic rejectTransferHolder fails', async () => {
          const contractOptions = {
            titleEscrowAddress: addresses.titleEscrow,
          };

          const params = {
            remarks: 'Transfer Beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferOwners(contractOptions, newHolder, params, options); //reject is invalid
          } catch (error: any) {
            expect(error.message).to.equal(
              'Pre-check (callStatic) for rejectTransferOwners failed',
            );
          }
        });

        it('should fail if tokenRegistryAddress is not provided when titleEscrowAddress is undefined', async () => {
          const contractOptions = {
            tokenRegistryAddress: '',
            tokenId: '0',
          };

          const params = {
            remarks: 'Transfer Beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferOwners(contractOptions, newHolder, params, options);
          } catch (error: any) {
            expect(error.message).to.equal('Token registry address is required');
          }
        });

        it('should fail if tokenId is missing when titleEscrowAddress is undefined', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '',
          };

          const params = {
            remarks: 'Transfer Beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
            id: 'test-encryption-id',
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferOwners(contractOptions, newHolder, params, options);
          } catch (error: any) {
            expect(error.message).to.equal('Token ID is required');
          }
        });

        it('should throw error if `encrypt` function throws (invalid remarks or id)', async () => {
          const contractOptions = {
            tokenRegistryAddress: addresses.tokenAddress,
            tokenId: '0',
          };

          const params = {
            remarks: 'Transfer Beneficiary to new address',
          };

          const options = {
            chainId: CHAIN_ID.local,
          };

          // Execute transfer using type assertion to bypass type issues
          try {
            await rejectTransferOwners(contractOptions, newHolder, params, options);
          } catch (error: any) {
            expect(error.message).to.equal(
              `Cannot read properties of undefined (reading 'length')`,
            );
          }
        });
        //   it('should allow retrying the transaction if it fails due to nonce issues');
      });
    });
  });
});
