import { isV6EthersProvider } from '../utils/ethers';
import { GasValue } from './types';
import { CHAIN_ID, SUPPORTED_CHAINS } from '@tradetrust-tt/tradetrust-utils';
import { Signer } from 'ethers';
import { Signer as SignerV6, BigNumberish } from 'ethersV6';

const getTxOptions = async (
  signer: SignerV6 | Signer,
  chainId: CHAIN_ID,
  maxFeePerGas: GasValue,
  maxPriorityFeePerGas: GasValue,
): Promise<{ maxFeePerGas?: GasValue; maxPriorityFeePerGas?: GasValue }> => {
  // If gas values are missing, query gas station if available
  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    chainId = chainId ?? ((await getChainIdSafe(signer)) as unknown as CHAIN_ID);
    const gasStation = SUPPORTED_CHAINS[chainId]?.gasStation;

    if (gasStation) {
      const gasFees = await gasStation();
      maxFeePerGas = gasFees?.maxFeePerGas ?? 0;
      maxPriorityFeePerGas = gasFees?.maxPriorityFeePerGas ?? 0;
    }
  }
  if (maxFeePerGas && maxPriorityFeePerGas) {
    if (isV6EthersProvider(signer.provider)) {
      // For ethers v6, cast gas values as BigNumberish
      return {
        maxFeePerGas: maxFeePerGas as BigNumberish,
        maxPriorityFeePerGas: maxPriorityFeePerGas as BigNumberish,
      };
    } else {
      // For ethers v5, return as is
      return { maxFeePerGas, maxPriorityFeePerGas };
    }
  }
  return {};
};

// 🔍 Handles both Ethers v5 and v6 signer types
const getChainIdSafe = async (signer: SignerV6 | Signer): Promise<bigint | number> => {
  if (isV6EthersProvider(signer.provider)) {
    const network = await (signer as SignerV6).provider?.getNetwork();
    if (!network?.chainId) throw new Error('Cannot determine chainId: provider is missing');
    return network.chainId;
  }
  return await (signer as Signer).getChainId();
};

const getSignerAddressSafe = async (signer: SignerV6 | Signer): Promise<string> => {
  if (isV6EthersProvider(signer.provider)) {
    return await (signer as SignerV6).getAddress();
  }
  return await (signer as unknown as Signer).getAddress();
};

export { getChainIdSafe, getTxOptions, getSignerAddressSafe };
