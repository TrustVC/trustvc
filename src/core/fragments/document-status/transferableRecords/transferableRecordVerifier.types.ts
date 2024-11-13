import {
  ErrorVerificationFragment,
  OpenAttestationEthereumTokenRegistryStatusCode,
  VerificationFragment,
  Verifier,
} from '@tradetrust-tt/tt-verify';

export type TransferableRecordsErrorReason = {
  code: OpenAttestationEthereumTokenRegistryStatusCode;
  codeString: string;
  message: string;
};

export type TransferableRecordsResultFragment = VerificationFragment & {
  status: 'VALID' | 'INVALID';
  data: {
    tokenRegistry: string;
  };
  reason?: TransferableRecordsErrorReason;
};
export type TransferableRecordsErrorFragment = Omit<ErrorVerificationFragment<never>, 'data'> & {
  data?: never;
  reason: TransferableRecordsErrorReason;
};

export type TransferableRecordsVerificationFragment =
  | TransferableRecordsResultFragment
  | TransferableRecordsErrorFragment;
export type VerifierType = Verifier<TransferableRecordsVerificationFragment>;

export type TransferableRecordCredentialStatus = {
  type: 'TransferableRecords';
  tokenRegistry: string;
  tokenNetwork: {
    chainId: number;
    name: string;
  };
};
