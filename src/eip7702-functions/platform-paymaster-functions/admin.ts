import { WalletClient } from 'viem';
import { Signer as SignerV6, Contract as ContractV6 } from 'ethersV6';
import { Signer as SignerV5, Contract as ContractV5 } from 'ethers';
import { abis } from '@trustvc/eip7702';
import { getEthersContractFromProvider, isV6EthersProvider } from '../../utils/ethers';

type AdminSigner = SignerV5 | SignerV6 | WalletClient;

// Sends an admin write to the paymaster via viem or ethers
async function sendAdminTx(
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  functionName: string,
  args: unknown[],
): Promise<string> {
  if ('writeContract' in signer) {
    return signer.writeContract({
      address: paymasterAddress,
      abi: abis.platformPaymasterAbi,
      functionName: functionName as never,
      args: args as never,
      chain: signer.chain,
      account: signer.account!,
    });
  }

  const ethSigner = signer as SignerV5 | SignerV6;
  const Contract = getEthersContractFromProvider(ethSigner.provider);
  const contract: ContractV5 | ContractV6 = new Contract(
    paymasterAddress,
    abis.platformPaymasterAbi,
    ethSigner as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );
  const isV6 = isV6EthersProvider(ethSigner.provider);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tx = await (contract as any)[functionName](...args);
  if (isV6) {
    return tx.hash as `0x${string}`;
  }
  const receipt = await tx.wait();
  return receipt.transactionHash as `0x${string}`;
}

/**
 * Whitelists a user on the PlatformPaymaster and sets their gas credit allowance.
 * Credits must be between 0 and 3 (enforced on-chain by the contract).
 * @param {AdminSigner} signer - Owner ethers signer (v5/v6) or viem WalletClient.
 * @param {string} paymasterAddress - Address of the deployed PlatformPaymaster.
 * @param {string} user - User address to whitelist.
 * @param {bigint} credits - Credit allowance (0–3).
 * @returns {Promise<string>} Transaction hash.
 */
export const setUserWhitelist = async (
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  user: `0x${string}`,
  credits: bigint,
): Promise<string> => sendAdminTx(signer, paymasterAddress, 'setUserWhitelist', [user, credits]);

/**
 * Removes a user from the PlatformPaymaster whitelist (sets credits to 0).
 * @param {AdminSigner} signer - Owner ethers signer (v5/v6) or viem WalletClient.
 * @param {string} paymasterAddress - Address of the deployed PlatformPaymaster.
 * @param {string} user - User address to remove.
 * @returns {Promise<string>} Transaction hash.
 */
export const removeUserFromWhitelist = async (
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  user: `0x${string}`,
): Promise<string> => sendAdminTx(signer, paymasterAddress, 'removeUserFromWhitelist', [user]);

/**
 * Adds a Token Registry to the PlatformPaymaster's authorized registries list.
 * Only authorized registries can have documents minted through the paymaster.
 * @param {AdminSigner} signer - Owner ethers signer (v5/v6) or viem WalletClient.
 * @param {string} paymasterAddress - Address of the deployed PlatformPaymaster.
 * @param {string} registry - Registry contract address to authorize.
 * @returns {Promise<string>} Transaction hash.
 */
export const addRegistry = async (
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  registry: `0x${string}`,
): Promise<string> => sendAdminTx(signer, paymasterAddress, 'addRegistry', [registry]);

/**
 * Removes a Token Registry from the PlatformPaymaster's authorized registries list.
 * @param {AdminSigner} signer - Owner ethers signer (v5/v6) or viem WalletClient.
 * @param {string} paymasterAddress - Address of the deployed PlatformPaymaster.
 * @param {string} registry - Registry contract address to deauthorize.
 * @returns {Promise<string>} Transaction hash.
 */
export const removeRegistry = async (
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  registry: `0x${string}`,
): Promise<string> => sendAdminTx(signer, paymasterAddress, 'removeRegistry', [registry]);

/**
 * Adds a Title Escrow to the PlatformPaymaster's authorized title escrows list.
 * @param {AdminSigner} signer - Owner ethers signer (v5/v6) or viem WalletClient.
 * @param {string} paymasterAddress - Address of the deployed PlatformPaymaster.
 * @param {string} titleEscrow - Title Escrow contract address to authorize.
 * @returns {Promise<string>} Transaction hash.
 */
export const addTitleEscrow = async (
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  titleEscrow: `0x${string}`,
): Promise<string> => sendAdminTx(signer, paymasterAddress, 'addTitleEscrow', [titleEscrow]);

/**
 * Removes a Title Escrow from the PlatformPaymaster's authorized title escrows list.
 * @param {AdminSigner} signer - Owner ethers signer (v5/v6) or viem WalletClient.
 * @param {string} paymasterAddress - Address of the deployed PlatformPaymaster.
 * @param {string} titleEscrow - Title Escrow contract address to deauthorize.
 * @returns {Promise<string>} Transaction hash.
 */
export const removeTitleEscrow = async (
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  titleEscrow: `0x${string}`,
): Promise<string> => sendAdminTx(signer, paymasterAddress, 'removeTitleEscrow', [titleEscrow]);

/**
 * Adds an address to the PlatformPaymaster's authorized callers list.
 * @param {AdminSigner} signer - Owner ethers signer (v5/v6) or viem WalletClient.
 * @param {string} paymasterAddress - Address of the deployed PlatformPaymaster.
 * @param {string} caller - Address to authorize as a caller.
 * @returns {Promise<string>} Transaction hash.
 */
export const addAuthorizedCaller = async (
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  caller: `0x${string}`,
): Promise<string> => sendAdminTx(signer, paymasterAddress, 'addAuthorizedCaller', [caller]);

/**
 * Removes an address from the PlatformPaymaster's authorized callers list.
 * @param {AdminSigner} signer - Owner ethers signer (v5/v6) or viem WalletClient.
 * @param {string} paymasterAddress - Address of the deployed PlatformPaymaster.
 * @param {string} caller - Address to remove from authorized callers.
 * @returns {Promise<string>} Transaction hash.
 */
export const removeAuthorizedCaller = async (
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  caller: `0x${string}`,
): Promise<string> => sendAdminTx(signer, paymasterAddress, 'removeAuthorizedCaller', [caller]);

/**
 * Sets the global daily gas spend limit per user on the PlatformPaymaster.
 * @param {AdminSigner} signer - Owner ethers signer (v5/v6) or viem WalletClient.
 * @param {string} paymasterAddress - Address of the deployed PlatformPaymaster.
 * @param {bigint} dailyLimit - New daily limit in wei (0n = unlimited).
 * @returns {Promise<string>} Transaction hash.
 */
export const setDailyLimit = async (
  signer: AdminSigner,
  paymasterAddress: `0x${string}`,
  dailyLimit: bigint,
): Promise<string> => sendAdminTx(signer, paymasterAddress, 'setDailyLimit', [dailyLimit]);
