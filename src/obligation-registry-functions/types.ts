import { CHAIN_ID } from '../utils';
import { BigNumber, providers as providersV5 } from 'ethers';
import { BigNumberish, Provider as ProviderV6 } from 'ethersV6';

export interface GasPriceScale {
  maxPriorityFeePerGasScale: number;
}

export interface GasOption extends GasPriceScale {
  dryRun: boolean;
}

export type GasValue = BigNumber | BigNumberish | string | number;

export interface ObligationRemarkParams {
  remarks?: string;
}

export interface MintObligationTokenParams {
  beneficiaryAddress: string;
  holderAddress: string;
  tokenId: string | number;
  remarks?: string;
}

export interface OwnerOfObligationTokenParams {
  tokenId: string | number;
}

export interface ObligationTokenIdParams {
  tokenId: string | number;
}

export interface AcceptReturnedObligationParams {
  tokenId: string | number;
  remarks?: string;
}

export interface RejectReturnedObligationParams {
  tokenId: string | number;
  remarks?: string;
}

export interface TransactionOptions {
  chainId?: CHAIN_ID;
  maxFeePerGas?: BigNumberish | string | number | BigNumber;
  maxPriorityFeePerGas?: BigNumberish | string | number | BigNumber;
  id?: string;
}

export type ObligationContractOptions =
  | {
      obligationEscrowAddress: string;
      obligationRegistryAddress?: string;
      tokenId?: string | number;
    }
  | {
      obligationEscrowAddress?: undefined;
      obligationRegistryAddress: string;
      tokenId: string | number;
    };

export type MintObligationTokenOptions = {
  obligationRegistryAddress: string;
};

export type OwnerOfObligationTokenOptions = {
  obligationRegistryAddress: string;
};

export type AcceptReturnedObligationOptions = {
  obligationRegistryAddress: string;
};

export type RejectReturnedObligationOptions = {
  obligationRegistryAddress: string;
};

export type ObligationStatusReadOptions = {
  blockTag?: number | string;
};

export enum ObligationDocumentStatus {
  Issued = 0,
  Accepted = 1,
  Rejected = 2,
  Discharged = 3,
}

export enum ObligationEscrowTerminationReason {
  None = 0,
  ReturnToIssuer = 1,
  Rejected = 2,
  Discharged = 3,
}

export interface TransferObligationHolderParams {
  holderAddress: string;
  remarks?: string;
}

export interface TransferObligationBeneficiaryParams {
  newBeneficiaryAddress: string;
  remarks?: string;
}

export interface NominateObligationParams {
  newBeneficiaryAddress: string;
  remarks?: string;
}

export interface TransferObligationOwnersParams {
  newHolderAddress: string;
  newBeneficiaryAddress: string;
  remarks?: string;
}

export interface ProviderInfo {
  Provider: providersV5.Provider | ProviderV6;
  ethersVersion: 'v5' | 'v6';
}
