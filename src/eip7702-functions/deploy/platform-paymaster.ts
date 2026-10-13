import { WalletClient, PublicClient, parseEventLogs } from 'viem';
import { Signer as SignerV6, Contract as ContractV6 } from 'ethersV6';
import { Signer as SignerV5, Contract as ContractV5 } from 'ethers';
import { abis, constants } from '@trustvc/eip7702';
import { getEthersContractFromProvider, isV6EthersProvider } from '../../utils/ethers';

/**
 * Options for deploying a PlatformPaymaster clone.
 */
export interface DeployPlatformPaymasterOptions {
  // Chain ID — defaults to Sepolia
  chainId?: number;
  // PlatformAccountFactory address — defaults to the deployed address for the given chainId
  factoryAddress?: `0x${string}`;
  // EOA that will own the paymaster (defaults to the signer/wallet account address)
  platformAddress?: `0x${string}`;
  // Per-user daily gas spend limit in wei (0n = unlimited)
  dailyLimit?: bigint;
  // bytes32 CREATE2 salt — must be unique per platform; generate with crypto.randomBytes(32) if unsure
  salt: `0x${string}`;
}

/**
 * Result returned after a successful paymaster deployment.
 */
export interface DeployPlatformPaymasterResult {
  txHash: `0x${string}`;
  paymasterAddress: `0x${string}`;
}

/**
 * Deploys a PlatformPaymaster clone via the PlatformAccountFactory contract.
 *
 * Supports both viem WalletClient and ethers v5/v6 signers. Each paymaster is a cheap
 * minimal-proxy clone sharing the implementation's logic but with its own state
 * (owner, daily limit, registry whitelist). The deployed address is deterministic
 * based on the salt.
 *
 * Prerequisites: `PlatformAccountFactory` must already be deployed on the target chain.
 * @param {SignerV5 | SignerV6 | WalletClient} signer - Ethers signer (v5 or v6) or viem WalletClient connected to the deployer account.
 * @param {DeployPlatformPaymasterOptions} options - Deployment options including `salt` (required), optional `chainId`, `factoryAddress`, `platformAddress`, and `dailyLimit`.
 * @param {PublicClient} [publicClient] - viem PublicClient required when `signer` is a WalletClient.
 * @throws {Error} If no factory address is available for the given chain.
 * @throws {Error} If `signer` is a WalletClient but no `publicClient` is provided.
 * @throws {Error} If the transaction succeeds but no paymaster address is found in the logs.
 * @returns {Promise<DeployPlatformPaymasterResult>} Transaction hash and the deployed paymaster address.
 */
export const deployPlatformPaymaster = async (
  signer: SignerV5 | SignerV6 | WalletClient,
  options: DeployPlatformPaymasterOptions,
  publicClient?: PublicClient,
): Promise<DeployPlatformPaymasterResult> => {
  const { chainId = constants.ChainId.Sepolia, dailyLimit = 0n, salt } = options;

  const factoryAddress =
    options.factoryAddress ??
    (constants.contractAddress.PlatformAccountFactory as Record<number, `0x${string}`>)[chainId];

  if (!factoryAddress) {
    throw new Error(
      `No PlatformAccountFactory address found for chainId ${chainId}. Supply factoryAddress in options.`,
    );
  }

  // === viem WalletClient path ===
  if ('writeContract' in signer) {
    if (!publicClient) throw new Error('publicClient is required when signer is a WalletClient');

    const platformAddress = options.platformAddress ?? (signer.account?.address as `0x${string}`);

    const txHash = await signer.writeContract({
      address: factoryAddress,
      abi: abis.platformAccountFactoryAbi,
      functionName: 'deployPlatformPaymaster',
      args: [platformAddress, dailyLimit, salt],
      chain: signer.chain,
      account: signer.account!,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

    const logs = parseEventLogs({
      abi: abis.platformAccountFactoryAbi,
      logs: receipt.logs,
      eventName: 'PlatformOnboarded',
    });

    const paymasterAddress = logs[0]?.args?.paymaster;
    if (!paymasterAddress)
      throw new Error('Deployment failed — PlatformOnboarded event not found in transaction logs');

    return { txHash, paymasterAddress };
  }

  // === Ethers v5 / v6 path ===
  const ethSigner = signer as SignerV5 | SignerV6;
  const platformAddress =
    options.platformAddress ?? ((await ethSigner.getAddress()) as `0x${string}`);

  const Contract = getEthersContractFromProvider(ethSigner.provider);
  const contract: ContractV5 | ContractV6 = new Contract(
    factoryAddress,
    abis.platformAccountFactoryAbi,
    ethSigner as any, // eslint-disable-line @typescript-eslint/no-explicit-any
  );

  const isV6 = isV6EthersProvider(ethSigner.provider);

  let txHash: `0x${string}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let logs: any[];

  if (isV6) {
    const tx = await (contract as ContractV6).deployPlatformPaymaster(
      platformAddress,
      dailyLimit,
      salt,
    );
    const receipt = await tx.wait();
    txHash = receipt.hash as `0x${string}`;
    logs = receipt.logs;
  } else {
    const tx = await (contract as ContractV5).deployPlatformPaymaster(
      platformAddress,
      dailyLimit,
      salt,
    );
    const receipt = await tx.wait();
    txHash = receipt.transactionHash as `0x${string}`;
    logs = receipt.logs;
  }

  // Parse PlatformOnboarded event from receipt logs
  for (const log of logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === 'PlatformOnboarded') {
        return { txHash, paymasterAddress: parsed.args.paymaster as `0x${string}` };
      }
    } catch {
      // skip unrecognised logs
    }
  }

  throw new Error('Deployment failed — PlatformOnboarded event not found in transaction logs');
};
