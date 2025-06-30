import {
  errorMessageHandling as OAErrorMessageHandling,
  CONSTANTS,
  interpretFragments,
} from '@tradetrust-tt/tradetrust-utils';
import { InvalidVerificationFragment, utils, VerificationFragment } from '@tradetrust-tt/tt-verify';
import { W3CCredentialStatusCode } from '../../verify/fragments/document-status/w3cCredentialStatus';
import { CredentialStatusResult } from '@trustvc/w3c-vc';

const getW3CCredentialStatusFragment =
  utils.getFragmentByName<InvalidVerificationFragment<CredentialStatusResult>>(
    'W3CCredentialStatus',
  );

const w3cCredentialStatusRevoked = (fragments: VerificationFragment[]): boolean => {
  const issuedFragment = getW3CCredentialStatusFragment(fragments);
  return (
    issuedFragment?.reason?.code === W3CCredentialStatusCode.DOCUMENT_REVOKED ||
    issuedFragment?.reason?.code === W3CCredentialStatusCode.DOCUMENT_REVOKED_AND_SUSPENDED
  );
};

const w3cCredentialStatusSuspended = (fragments: VerificationFragment[]): boolean => {
  const issuedFragment = getW3CCredentialStatusFragment(fragments);
  //checking for both revoked and suspended
  return (
    issuedFragment?.reason?.code === W3CCredentialStatusCode.DOCUMENT_SUSPENDED ||
    issuedFragment?.reason?.code === W3CCredentialStatusCode.DOCUMENT_REVOKED_AND_SUSPENDED
  );
};

const errorMessageHandling = (fragments: VerificationFragment[]): string[] => {
  const errors = [];
  const isW3cFragments = fragments.some(
    (f) => f.name.startsWith('W3C') || f.name === 'TransferableRecords',
  );
  if (isW3cFragments) {
    if (w3cCredentialStatusRevoked(fragments)) {
      errors.push(CONSTANTS.TYPES.REVOKED);
    }
    if (w3cCredentialStatusSuspended(fragments)) {
      errors.push(CONSTANTS.TYPES.SUSPENDED);
    }

    return errors;
  } else return OAErrorMessageHandling(fragments);
};

export {
  interpretFragments,
  errorMessageHandling,
  w3cCredentialStatusRevoked,
  w3cCredentialStatusSuspended,
};
