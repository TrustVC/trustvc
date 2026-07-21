import type { Event } from 'ethers';
import { EventFragment, Result } from 'ethers/lib/utils';

export type ObligationStatusEventType =
  | 'STATUS_INITIALIZED'
  | 'STATUS_ACCEPTED'
  | 'STATUS_REJECTED'
  | 'STATUS_DISCHARGED';

export type ObligationTokenTransferEventType =
  | 'INITIAL'
  | 'RETURNED_TO_ISSUER'
  | 'RETURN_TO_ISSUER_REJECTED'
  | 'RETURN_TO_ISSUER_ACCEPTED';

export type ObligationTitleEscrowTransferEventType =
  | 'TRANSFER_BENEFICIARY'
  | 'TRANSFER_HOLDER'
  | 'TRANSFER_OWNERS'
  | 'REJECT_TRANSFER_BENEFICIARY'
  | 'REJECT_TRANSFER_HOLDER'
  | 'REJECT_TRANSFER_OWNERS';

export type ObligationTransferEventType =
  | ObligationTokenTransferEventType
  | ObligationTitleEscrowTransferEventType
  | ObligationStatusEventType;

export interface ObligationTransferBaseEvent {
  type: ObligationTransferEventType;
  transactionIndex: number;
  holder?: string;
  owner?: string;
  transactionHash: string;
  blockNumber: number;
  remark?: string;
}

export interface ObligationStatusEvent extends ObligationTransferBaseEvent {
  type: ObligationStatusEventType;
}

export interface ObligationTitleEscrowTransferEvent extends ObligationTransferBaseEvent {
  type: ObligationTitleEscrowTransferEventType;
}

export interface ObligationTokenTransferEvent extends ObligationTransferBaseEvent {
  type: ObligationTokenTransferEventType;
  from: string;
  to: string;
}

export interface ObligationTransferEvent extends ObligationTransferBaseEvent {
  timestamp: number;
  holder: string;
  owner: string;
}

export type ObligationEndorsementChain = ObligationTransferEvent[];

export interface ObligationParsedLog {
  eventFragment: EventFragment;
  name: string;
  signature: string;
  topic: string;
  args: Result;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  removed: boolean;
  logIndex: number;
  transactionHash: string;
  address: string;
  data: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ObligationTypedEvent<TArgsArray extends Array<any> = any, TArgsObject = any>
  extends Event {
  args: TArgsArray & TArgsObject;
}
