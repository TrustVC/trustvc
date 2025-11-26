// import {
//   errorMessageHandling as OAErrorMessageHandling,
//   CONSTANTS,
//   interpretFragments,
// } from '@tradetrust-tt/tradetrust-utils';
import {
  isValid,
  InvalidVerificationFragment,
  utils,
  VerificationFragment,
  OpenAttestationEthereumDocumentStoreStatusCode,
} from '@tradetrust-tt/tt-verify';
import { W3CCredentialStatusCode } from '../../verify/fragments/document-status/w3cCredentialStatus';
import { CredentialStatusResult } from '@trustvc/w3c-vc';
import { TYPES } from '../errorMessages/VerificationErrorMessages';
import { errorMessages as CONSTANTS } from '../errorMessages';

interface interpretFragmentsReturnTypes {
  hashValid: boolean;
  issuedValid: boolean;
  identityValid: boolean;
}

/**
 * Interprets fragments for DID-signed document store revoked documents.
 * The upstream helper from oa-verify does not check DID-signed status codes (only Ethereum DocStore).
 * To avoid a wide-scope change upstream, this helper performs the check at the project level.
 * @param {VerificationFragment[]} fragments - The list of verification fragments returned by the verifier.
 * @returns {boolean} True if the DID-signed document store indicates the document is revoked; otherwise false.
 */
const certificateRevokedOnDidIdentified = (fragments: VerificationFragment[]): boolean => {
  const didSignedDocumentStatusFragment =
    utils.getOpenAttestationDidSignedDocumentStatusFragment(fragments);
  return (
    didSignedDocumentStatusFragment?.reason?.code ===
    OpenAttestationEthereumDocumentStoreStatusCode.DOCUMENT_REVOKED
  );
};

/**
 * Aggregates verification fragment results into high-level booleans.
 * @param {VerificationFragment[]} fragments - The list of verification fragments to interpret.
 * @returns {{hashValid: boolean, issuedValid: boolean, identityValid: boolean}} Aggregated verification states.
 */
export const interpretFragments = (
  fragments: VerificationFragment[],
): interpretFragmentsReturnTypes => {
  const hashValid = isValid(fragments, ['DOCUMENT_INTEGRITY']);
  const issuedValid = isValid(fragments, ['DOCUMENT_STATUS']);
  const identityValid = isValid(fragments, ['ISSUER_IDENTITY']);
  return { hashValid, issuedValid, identityValid };
};

export const OAErrorMessageHandling = (fragments: VerificationFragment[]): string[] => {
  const { hashValid, issuedValid, identityValid } = interpretFragments(fragments);
  const errors = [];

  if (utils.isDocumentStoreAddressOrTokenRegistryAddressInvalid(fragments)) {
    // if the error is because the address is invalid, only return this one
    return [TYPES.ADDRESS_INVALID];
  }
  if (utils.contractNotFound(fragments)) {
    // if the error is because the contract cannot be found, only return this one
    return [TYPES.CONTRACT_NOT_FOUND];
  }
  if (utils.serverError(fragments)) {
    // if the error is because cannot connect to Ethereum, only return this one
    return [TYPES.SERVER_ERROR];
  }

  if (!hashValid) errors.push(TYPES.HASH);
  if (!identityValid) errors.push(TYPES.IDENTITY);
  if (!issuedValid) {
    if (utils.certificateRevoked(fragments) || certificateRevokedOnDidIdentified(fragments))
      errors.push(TYPES.REVOKED);
    else if (utils.invalidArgument(fragments)) {
      // this error is caused when the merkle root is wrong, and should always be shown with the DOCUMENT_INTEGRITY error
      errors.push(TYPES.INVALID_ARGUMENT);
    } else if (utils.certificateNotIssued(fragments)) errors.push(TYPES.ISSUED);
    else if (!hashValid && !identityValid) {
      // this error is caused when the document is invalid, only keep this one
      return [TYPES.INVALID];
    } else {
      // if it's some unhandled error that we didn't foresee, only keep this one
      return [TYPES.ETHERS_UNHANDLED_ERROR];
    }
  }

  return errors;
};

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
  const { hashValid, issuedValid, identityValid } = interpretFragments(fragments);
  const errors = [];
  const isW3cFragments = fragments.some(
    (f) => f.name.startsWith('W3C') || f.name === 'TransferableRecords',
  );
  if (isW3cFragments) {
    switch (true) {
      case w3cCredentialStatusRevoked(fragments):
        errors.push(CONSTANTS.TYPES.REVOKED);
        break;
      case w3cCredentialStatusSuspended(fragments):
        errors.push(CONSTANTS.TYPES.SUSPENDED);
        break;
      case !hashValid:
        errors.push(CONSTANTS.TYPES.HASH);
        break;
      case !identityValid:
        errors.push(CONSTANTS.TYPES.IDENTITY);
        break;
      case !issuedValid:
        errors.push(CONSTANTS.TYPES.INVALID);
        break;
    }

    return errors;
  } else return OAErrorMessageHandling(fragments);
};

export { errorMessageHandling, w3cCredentialStatusRevoked, w3cCredentialStatusSuspended };
