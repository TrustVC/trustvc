import { ContractOptions, TransactionOptions } from '../token-registry-functions/types';

export type { ContractOptions, TransactionOptions };

export interface StatusActionParams {
  remarks?: string;
}

export type StatusOptions = ContractOptions;

/**
 * Lifecycle status of a TitleEscrow. Mirrors the `Status` enum on `TitleEscrow.sol` —
 * every TitleEscrow carries this field.
 */
export const Status = {
  Issued: 0,
  Accepted: 1,
  Rejected: 2,
  Discharged: 3,
} as const;

export type Status = (typeof Status)[keyof typeof Status];

export const StatusLabel: Record<Status, string> = {
  [Status.Issued]: 'Issued',
  [Status.Accepted]: 'Accepted',
  [Status.Rejected]: 'Rejected',
  [Status.Discharged]: 'Discharged',
};
