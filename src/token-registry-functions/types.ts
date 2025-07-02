import { CHAIN_ID } from '@tradetrust-tt/tradetrust-utils';
import { BigNumber } from 'ethers';
import { BigNumberish } from 'ethersV6';
import { providerV5, providerV6 } from 'src/__tests__/token-registry-functions/fixtures';

export type GasValue = BigNumber | BigNumberish | string | number;

export interface RejectTransferParams {
  remarks?: string;
}
export interface ReturnToIssuerParams {
  remarks?: string;
}

export interface AcceptReturnedParams {
  tokenId: string | number;
  remarks?: string;
}
export interface RejectReturnedParams {
  tokenId: string | number;
  remarks?: string;
}

export interface TransactionOptions {
  chainId?: CHAIN_ID;
  titleEscrowVersion?: 'v4' | 'v5';
  maxFeePerGas?: BigNumberish | string | number | BigNumber;
  maxPriorityFeePerGas?: BigNumberish | string | number | BigNumber;
  id?: string;
}

export type ContractOptions =
  | {
      titleEscrowAddress: string; // Present — no restrictions on the rest
      tokenId?: string | number;
      tokenRegistryAddress?: string;
    }
  | {
      titleEscrowAddress?: undefined; // Absent — must provide both below
      tokenId: string | number;
      tokenRegistryAddress: string;
    };

export type AcceptReturnedOptions = {
  tokenRegistryAddress: string;
};
export type RejectReturnedOptions = {
  tokenRegistryAddress: string;
};

export interface TransferHolderParams {
  holderAddress: string;
  remarks?: string;
}
export interface TransferBeneficiaryParams {
  newBeneficiaryAddress: string;
  remarks?: string;
}
export interface NominateParams {
  newBeneficiaryAddress: string;
  remarks?: string;
}
export interface TransferOwnersParams {
  newHolderAddress: string;
  newBeneficiaryAddress: string;
  remarks?: string;
}
export interface ProviderInfo {
  Provider: typeof providerV5 | typeof providerV6;
  ethersVersion: 'v5' | 'v6';
  titleEscrowVersion: 'v4' | 'v5';
}
