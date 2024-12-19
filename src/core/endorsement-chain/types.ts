import type { Event } from 'ethers';
import { EventFragment, Result } from 'ethers/lib/utils';

export type TradeTrustTokenEventType =
  | 'INITIAL'
  | 'NEW_OWNERS'
  | 'ENDORSE'
  | 'TRANSFER'
  | 'SURRENDERED' // V4
  | 'RETURNED_TO_ISSUER' // V5
  | 'SURRENDER_REJECTED' // V4
  | 'RETURN_TO_ISSUER_REJECTED' // V5
  | 'SURRENDER_ACCEPTED' // V4
  | 'RETURN_TO_ISSUER_ACCEPTED' // V5
  | 'TRANSFER_TO_WALLET'
  | 'INVALID';

export type TransferEventType = TokenTransferEventType | TitleEscrowTransferEventType;

export interface TransferBaseEvent {
  type: TransferEventType;
  transactionIndex: number;
  holder?: string;
  owner?: string;
  transactionHash: string;
  blockNumber: number;
  remark?: string;
}

export type TokenTransferEventType =
  | 'INITIAL'
  | 'SURRENDERED' // V4
  | 'RETURNED_TO_ISSUER' // V5
  | 'SURRENDER_REJECTED' // V4
  | 'RETURN_TO_ISSUER_REJECTED' // V5
  | 'SURRENDER_ACCEPTED' // V4
  | 'RETURN_TO_ISSUER_ACCEPTED'; // V5

export interface TitleEscrowTransferEvent extends TransferBaseEvent {
  type: TitleEscrowTransferEventType;
}

export type TitleEscrowTransferEventType =
  | 'TRANSFER_BENEFICIARY'
  | 'TRANSFER_HOLDER'
  | 'TRANSFER_OWNERS'
  | 'REJECT_TRANSFER_BENEFICIARY' // V5
  | 'REJECT_TRANSFER_HOLDER' // V5
  | 'REJECT_TRANSFER_OWNERS'; // V5

export interface TokenTransferEvent extends TransferBaseEvent {
  type: TokenTransferEventType;
  from: string;
  to: string;
}

export interface TransferEvent extends TransferBaseEvent {
  timestamp: number;
  holder: string;
  owner: string;
}

export type EndorsementChain = TransferEvent[];

export interface ParsedLog {
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
export interface TypedEvent<TArgsArray extends Array<any> = any, TArgsObject = any> extends Event {
  args: TArgsArray & TArgsObject;
}
