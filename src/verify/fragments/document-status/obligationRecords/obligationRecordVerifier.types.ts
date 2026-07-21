import {
  ErrorVerificationFragment,
  VerificationFragment,
  Verifier,
} from '@tradetrust-tt/tt-verify';

export enum ObligationRecordsStatusCode {
  SKIPPED = 0,
  DOCUMENT_NOT_MINTED = 1,
  UNEXPECTED_ERROR = 4,
  UNRECOGNIZED_DOCUMENT = 9,
  SERVER_ERROR = 500,
}

export type ObligationRecordsErrorReason = {
  code: ObligationRecordsStatusCode;
  codeString: string;
  message: string;
};

export type ObligationRecordsResultFragment = VerificationFragment & {
  status: 'VALID' | 'INVALID';
  data: {
    obligationRegistry: string;
    status?: number;
    terminationReason?: number;
  };
  reason?: ObligationRecordsErrorReason;
};

export type ObligationRecordsErrorFragment = Omit<ErrorVerificationFragment<never>, 'data'> & {
  data?: never;
  reason: ObligationRecordsErrorReason;
};

export type ObligationRecordsVerificationFragment =
  | ObligationRecordsResultFragment
  | ObligationRecordsErrorFragment;

export type ObligationRecordsVerifierType = Verifier<ObligationRecordsVerificationFragment>;

export type ValidObligationRegistryStatus = {
  minted: true;
  address: string;
};

export type InvalidObligationRegistryStatus = {
  minted: false;
  address: string;
  reason: ObligationRecordsErrorReason;
};

export type ObligationRegistryMintStatus =
  | ValidObligationRegistryStatus
  | InvalidObligationRegistryStatus;

export const isValidObligationRegistryStatus = (
  status: ObligationRegistryMintStatus,
): status is ValidObligationRegistryStatus => status.minted === true;

export class ObligationRecordsCodedError extends Error {
  code: ObligationRecordsStatusCode;
  codeString: string;

  constructor(message: string, code: ObligationRecordsStatusCode, codeString: string) {
    super(message);
    this.name = 'ObligationRecordsCodedError';
    this.code = code;
    this.codeString = codeString;
  }
}
