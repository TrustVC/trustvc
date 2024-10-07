import {
  InvalidVerificationFragment,
  ValidVerificationFragment,
  Verifier,
} from '@govtechsg/oa-verify';

export type TransferableRecordsValidFragment = ValidVerificationFragment<{
  tokenRegistry: any;
}>;
export type TransferableRecordsInvalidFragment = InvalidVerificationFragment<{
  [key: string]: any;
}>;
export type TransferableRecordsVerificationFragment =
  | TransferableRecordsValidFragment
  | TransferableRecordsInvalidFragment;
export type VerifierType = Verifier<TransferableRecordsVerificationFragment>;

export type TransferableRecordCredentialStatus = {
  type: 'TransferableRecords';
  tokenRegistry: string;
  tokenNetwork: {
    chainId: number;
    name: string;
  };
};
