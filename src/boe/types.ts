import { ContractOptions, TransactionOptions } from '../token-registry-functions/types';

export type { ContractOptions, TransactionOptions };

export interface BillOfExchangeActionParams {
  remarks?: string;
}

export type BillOfExchangeStatusOptions = ContractOptions;

/**
 * Lifecycle status of a TitleEscrow's Bill of Exchange status field. Mirrors the `Status` enum on
 * `TitleEscrow.sol` — every TitleEscrow carries this field, not just ones used as a Bill of Exchange.
 */
export const BillOfExchangeStatus = {
  Issued: 0,
  Accepted: 1,
  Rejected: 2,
  Discharged: 3,
} as const;

export type BillOfExchangeStatus = (typeof BillOfExchangeStatus)[keyof typeof BillOfExchangeStatus];

export const BillOfExchangeStatusLabel: Record<BillOfExchangeStatus, string> = {
  [BillOfExchangeStatus.Issued]: 'Issued',
  [BillOfExchangeStatus.Accepted]: 'Accepted',
  [BillOfExchangeStatus.Rejected]: 'Rejected',
  [BillOfExchangeStatus.Discharged]: 'Discharged',
};
