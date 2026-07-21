import { ethers, Signer } from 'ethers';
import { ethers as ethersV6, ContractRunner } from 'ethersV6';
import { network } from 'hardhat';
import { CHAIN_ID } from '../../utils';
import {
  deployObligationEscrowFactory,
  deployObligationRegistry,
} from '../../deploy/obligation-registry';
import { mintObligationRegistry } from '../../obligation-registry-functions/mint';
import { getObligationEscrowAddress } from '../../obligation-registry-functions/utils';
import { obligationRegistryContracts } from '../../obligation-registry';
import { providerV5, providerV6 } from './fixtures';

export const OBLIGATION_ENCRYPTION_ID = 'test-encryption-key';

export type ObligationEthersVersion = 'v5' | 'v6';

export type ObligationProviderInfo = {
  Provider: typeof providerV5 | typeof providerV6;
  ethersVersion: ObligationEthersVersion;
};

export const obligationProviders: ObligationProviderInfo[] = [
  { Provider: providerV5, ethersVersion: 'v5' },
  { Provider: providerV6, ethersVersion: 'v6' },
];

export const delay = (ms = 500): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export type DeployObligationFixtureResult = {
  obligationRegistry: string;
  obligationEscrowFactoryAddress: string;
};

/**
 * Deploys ObligationEscrowFactory + TrustVCToken via SDK (classic TitleEscrowFactory + token path).
 * @param {Signer | ethersV6.Signer} owner - Signer that deploys the contracts.
 * @param {{ chainId?: CHAIN_ID }} [options] - Deployment options.
 * @param {CHAIN_ID} [options.chainId] - Target chain ID (defaults to local Hardhat).
 * @returns {Promise<DeployObligationFixtureResult>} Deployed registry and factory addresses.
 */
export const deployObligationFixture = async (
  owner: Signer | ethersV6.Signer,
  options: { chainId?: CHAIN_ID } = {},
): Promise<DeployObligationFixtureResult> => {
  const chainId = options.chainId ?? CHAIN_ID.local;
  const { obligationEscrowFactoryAddress } = await deployObligationEscrowFactory(owner, {
    chainId,
  });
  await delay(1000);
  const deployed = await deployObligationRegistry('Test Obligation Registry', 'TOR', owner, {
    escrowFactoryAddress: obligationEscrowFactoryAddress,
    chainId,
  });
  return {
    obligationRegistry: deployed.obligationRegistry,
    obligationEscrowFactoryAddress: deployed.obligationEscrowFactoryAddress,
  };
};

/** Reset local Hardhat state and pause so JsonRpc providers drop stale nonces. */
export const resetHardhatChain = async (): Promise<void> => {
  await network.provider.send('evm_setAutomine', [true]);
  await network.provider.send('hardhat_reset');
  await delay(1500);
};

export const attachObligationEscrow = (
  address: string,
  ethersVersion: ObligationEthersVersion,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: any,
) => {
  const abi = obligationRegistryContracts.ObligationEscrow__factory.abi;
  return ethersVersion === 'v5'
    ? new ethers.Contract(address, abi, signer as Signer)
    : new ethersV6.Contract(address, abi, signer as ContractRunner);
};

export const attachTrustVCToken = (
  address: string,
  ethersVersion: ObligationEthersVersion,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signer: any,
) => {
  const abi = obligationRegistryContracts.TrustVCToken__factory.abi;
  return ethersVersion === 'v5'
    ? new ethers.Contract(address, abi, signer as Signer)
    : new ethersV6.Contract(address, abi, signer as ContractRunner);
};

export type MintIssuedTokenParams = {
  obligationRegistry: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  owner: any;
  beneficiaryAddress: string;
  holderAddress: string;
  tokenId: string | number;
  remarks?: string;
  encryptionId?: string;
};

export type MintIssuedTokenResult = {
  tokenId: string;
  escrowAddress: string;
};

/**
 * Mints an Issued obligation token and resolves its ObligationEscrow address.
 * @param {MintIssuedTokenParams} params - Mint parameters including registry, roles, and token ID.
 * @returns {Promise<MintIssuedTokenResult>} Minted token ID and escrow address.
 */
export const mintIssuedToken = async (
  params: MintIssuedTokenParams,
): Promise<MintIssuedTokenResult> => {
  const {
    obligationRegistry,
    owner,
    beneficiaryAddress,
    holderAddress,
    tokenId,
    remarks = 'e2e mint',
    encryptionId = OBLIGATION_ENCRYPTION_ID,
  } = params;

  const tx = await mintObligationRegistry(
    { obligationRegistry },
    owner,
    {
      beneficiaryAddress,
      holderAddress,
      tokenId,
      remarks,
    },
    { chainId: CHAIN_ID.local, id: encryptionId },
  );
  await tx.wait();
  await delay(500);

  const escrowAddress = await getObligationEscrowAddress(
    obligationRegistry,
    tokenId,
    owner.provider,
  );

  return { tokenId: String(tokenId), escrowAddress };
};

/**
 * Wait for a tx and pause briefly so ethers v6 nonce tracking stays consistent.
 * @param {{ wait: () => Promise<unknown> }} tx - Transaction-like object.
 * @param {() => Promise<unknown>} tx.wait - Resolves when the transaction is mined.
 * @returns {Promise<void>} Resolves after confirmation and a short delay.
 */
export const waitTx = async (tx: { wait: () => Promise<unknown> }): Promise<void> => {
  await tx.wait();
  await delay(500);
};

export const defaultTxOptions = (encryptionId = OBLIGATION_ENCRYPTION_ID) => ({
  chainId: CHAIN_ID.local,
  id: encryptionId,
});
