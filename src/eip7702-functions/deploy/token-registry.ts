import { encodeFunctionData } from 'viem';
import { abis } from '@trustvc/eip7702';

interface GaslessSmartAccountClient {
  sendTransaction(args: { to: `0x${string}`; value: bigint; data: `0x${string}` }): Promise<string>;
}

/**
 * Configuration options for gasless Token Registry deployment.
 */
export interface DeployTokenRegistryGaslessOptions {
  // The platform's deployed PlatformPaymaster — caller must be whitelisted on this paymaster
  paymasterAddress: `0x${string}`;
  // TDoc token registry implementation contract address to clone
  tokenRegistryImplAddress: `0x${string}`;
}

/**
 * Deploys a new Token Registry contract gaslessly via EIP-7702 + Pimlico.
 * Gas is sponsored by the PlatformPaymaster — no ETH required from the caller.
 *
 * Calls `deployRegistry(implementation, name, symbol)` on the PlatformPaymaster, which:
 * 1. Verifies the caller is whitelisted (`userWhitelist[sender] > 0`)
 * 2. Clones the implementation via TDocDeployer internally
 * 3. Emits `RegistryDeployed(user, deployed, creditsLeft)`
 *
 * Prerequisites: caller must be whitelisted on the PlatformPaymaster before calling this.
 * @param {string} registryName - The name of the token registry (e.g., "My Token Registry").
 * @param {string} registrySymbol - The symbol of the token registry (e.g., "MTR").
 * @param {GaslessSmartAccountClient} smartAccountClient - Pre-built EIP-7702 smart account client (caller must be whitelisted on the paymaster).
 * @param {DeployTokenRegistryGaslessOptions} options - Requires `paymasterAddress` and `tokenRegistryImplAddress`.
 * @throws {Error} If `paymasterAddress` or `tokenRegistryImplAddress` is missing.
 * @returns {Promise<string>} The transaction hash of the submitted UserOp.
 */
export const deployTokenRegistryGasless = async (
  registryName: string,
  registrySymbol: string,
  smartAccountClient: GaslessSmartAccountClient,
  options: DeployTokenRegistryGaslessOptions,
): Promise<string> => {
  const { paymasterAddress, tokenRegistryImplAddress } = options;

  if (!paymasterAddress) throw new Error('paymasterAddress is required');
  if (!tokenRegistryImplAddress) throw new Error('tokenRegistryImplAddress is required');

  const data = encodeFunctionData({
    abi: abis.platformPaymasterAbi,
    functionName: 'deployRegistry',
    args: [tokenRegistryImplAddress, registryName, registrySymbol],
  });

  return smartAccountClient.sendTransaction({
    to: paymasterAddress,
    value: 0n,
    data,
  });
};
