import { CHAIN_ID } from '../utils';
import { GasValue } from '../token-registry-functions/types';

export interface CommandOptions {
  chainId?: CHAIN_ID;
  maxFeePerGas?: GasValue;
  maxPriorityFeePerGas?: GasValue;
  isTransferable?: boolean;
}
