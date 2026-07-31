import {
  ErrorVerificationFragment,
  OpenAttestationEthereumTokenRegistryStatusCode,
  VerificationFragment,
  Verifier,
} from '@tradetrust-tt/tt-verify';

export type ObligationRecordsErrorReason = {
  code: OpenAttestationEthereumTokenRegistryStatusCode;
  codeString: string;
  message: string;
};

export type ObligationRecordsResultFragment = VerificationFragment & {
  status: 'VALID' | 'INVALID';
  data: {
    obligationRegistry: string;
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

export type VerifierType = Verifier<ObligationRecordsVerificationFragment>;
