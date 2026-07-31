import { TRANSFERABLE_RECORDS_TYPE } from '../../verify/fragments';
import { ObligationRecordsCredentialStatus } from '@trustvc/w3c-credential-status';
import { CredentialStatus, isSignedDocument, SignedVerifiableCredential } from '../../w3c/vc';
import { WrappedOrSignedOpenAttestationDocument } from './index';

export const isObligationRecordCredentialStatus = (
  credentialStatus: CredentialStatus | undefined,
): credentialStatus is ObligationRecordsCredentialStatus => {
  if (credentialStatus?.type !== TRANSFERABLE_RECORDS_TYPE) {
    return false;
  }

  const obligationRegistry = (credentialStatus as ObligationRecordsCredentialStatus)
    .obligationRegistry;
  return typeof obligationRegistry === 'string' && obligationRegistry.length > 0;
};

export const getObligationRecordsCredentialStatus = (
  document: unknown,
): ObligationRecordsCredentialStatus | undefined => {
  const credentialStatuses = [(document as SignedVerifiableCredential)?.credentialStatus].flat();

  return credentialStatuses.find(isObligationRecordCredentialStatus);
};

export const isObligationRecord = (
  document: WrappedOrSignedOpenAttestationDocument | SignedVerifiableCredential,
): boolean => {
  if (!isSignedDocument(document)) {
    return false;
  }

  const credentialStatuses = Array.isArray(document.credentialStatus)
    ? document.credentialStatus
    : [document.credentialStatus];

  return credentialStatuses.some((cs) => isObligationRecordCredentialStatus(cs));
};

export const getObligationRegistryAddress = (
  document: WrappedOrSignedOpenAttestationDocument | SignedVerifiableCredential,
): string | undefined => {
  if (!isSignedDocument(document)) {
    return undefined;
  }

  return getObligationRecordsCredentialStatus(document)?.obligationRegistry;
};
