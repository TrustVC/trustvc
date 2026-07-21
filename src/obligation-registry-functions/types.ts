import { CHAIN_ID } from '../utils/supportedChains';
import { GasValue } from '../token-registry-functions/types';

/**
 * Mirrors contracts/interfaces/IObligationEscrow.sol's `enum Status` 1:1.
 */
export enum DocumentStatus {
  Issued = 0,
  Accepted = 1,
  Rejected = 2,
  Discharged = 3,
}

/** Escrow lifecycle write methods that advance document status. */
export const ACCEPT = 'accept' as const;
export const REJECT = 'reject' as const;
export const DISCHARGE = 'discharge' as const;

/**
 * Status-advancing escrow methods for end users (maps to `DocumentStatus` Accepted / Rejected / Discharged).
 */
export const ObligationStatusAction = {
  ACCEPT,
  REJECT,
  DISCHARGE,
} as const;

export type ObligationStatusActionName =
  (typeof ObligationStatusAction)[keyof typeof ObligationStatusAction];

/**
 * Mirrors contracts/interfaces/IObligationEscrow.sol's `enum TerminationReason` 1:1.
 */
export enum ObligationEscrowTerminationReason {
  None = 0,
  ReturnToIssuer = 1,
  Rejected = 2,
  Discharged = 3,
}

export interface ObligationRegistryContractOptions {
  obligationRegistry: string;
}

export interface ObligationRegistryTransactionOptions {
  chainId?: CHAIN_ID;
  maxFeePerGas?: GasValue;
  maxPriorityFeePerGas?: GasValue;
  id?: string;
}

export interface ObligationRegistryReadParams {
  tokenId: string | number;
}

export interface ObligationRegistryReadOptions {
  blockTag?: number;
}

export interface MintObligationRegistryParams {
  beneficiaryAddress: string;
  holderAddress: string;
  tokenId: string | number;
  remarks?: string;
}

export interface AcceptObligationRegistryParams {
  tokenId: string | number;
  remarks?: string;
}

export interface RejectObligationRegistryParams {
  tokenId: string | number;
  remarks?: string;
}

export interface DischargeObligationRegistryParams {
  tokenId: string | number;
  remarks?: string;
}

/**
 * Escrow-resolution options for the endorsement surface (nominate, transfer, rejectTransfer, returnToIssuer).
 * Either pass the escrow address directly, or the registry address + tokenId so it can be resolved.
 */
export type ObligationEscrowContractOptions =
  | {
      titleEscrowAddress: string;
      tokenId?: string | number;
      obligationRegistry?: string;
    }
  | {
      titleEscrowAddress?: undefined;
      tokenId: string | number;
      obligationRegistry: string;
    };

export interface ObligationNominateParams {
  newBeneficiaryAddress: string;
  remarks?: string;
}

export interface ObligationTransferBeneficiaryParams {
  newBeneficiaryAddress: string;
  remarks?: string;
}

export interface ObligationTransferHolderParams {
  holderAddress: string;
  remarks?: string;
}

export interface ObligationTransferOwnersParams {
  newBeneficiaryAddress: string;
  newHolderAddress: string;
  remarks?: string;
}

export interface ObligationRejectTransferParams {
  remarks?: string;
}

export interface ObligationReturnToIssuerParams {
  remarks?: string;
}

export interface ObligationAcceptReturnedOptions {
  obligationRegistry: string;
}

export interface ObligationRejectReturnedOptions {
  obligationRegistry: string;
}

export interface ObligationAcceptReturnedParams {
  tokenId: string | number;
  remarks?: string;
}

export interface ObligationRejectReturnedParams {
  tokenId: string | number;
  remarks?: string;
}
