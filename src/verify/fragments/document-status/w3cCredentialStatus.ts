import { VerificationFragment, Verifier, VerifierOptions } from '@tradetrust-tt/tt-verify';
import {
  BitstringStatusListCredentialStatus,
  CredentialStatusType,
} from '@trustvc/w3c-credential-status';
import { CredentialStatus, isSignedDocument, verifyCredentialStatus } from '@trustvc/w3c-vc';
import { SignedVerifiableCredential } from '../../..';
//w3cCredentialStatus enums
export enum W3CCredentialStatusCode {
  SKIPPED = 0,
  DOCUMENT_NOT_ISSUED = 1,
  DOCUMENT_REVOKED = 11,
  DOCUMENT_SUSPENDED = 12,
  DOCUMENT_REVOKED_AND_SUSPENDED = 101,
  STATUS_LIST_NOT_FOUND = 404,
  INVALID_VALIDATION_METHOD = 8,
  UNRECOGNIZED_DOCUMENT = 9,
  SERVER_ERROR = 500,
  UNEXPECTED_ERROR = 4,
  INVALID_ARGUMENT = 6,
  INVALID_ISSUERS = 7,
}
export const w3cCredentialStatus: Verifier<VerificationFragment> = {
  skip: async () => {
    return {
      type: 'DOCUMENT_STATUS',
      name: 'W3CCredentialStatus',
      reason: {
        code: W3CCredentialStatusCode.SKIPPED,
        codeString: 'SKIPPED',
        message: `Document does not have a valid credentialStatus or type.`,
      },
      status: 'SKIPPED',
    };
  },

  test: (document: unknown) => {
    const doc = document as SignedVerifiableCredential;
    const credentialStatuses = Array.isArray(doc?.credentialStatus)
      ? doc?.credentialStatus
      : [doc?.credentialStatus];

    const test = (credentialStatus: CredentialStatus) =>
      ['BitstringStatusListEntry', 'StatusList2021Entry'].includes(credentialStatus?.type);

    if (isSignedDocument(document) && credentialStatuses.every(test)) {
      return true;
    } else {
      return false;
    }
  },

  verify: async (document: unknown, verifierOptions: VerifierOptions) => {
    const doc = document as SignedVerifiableCredential;
    const credentialStatuses = (
      Array.isArray(doc.credentialStatus) ? doc.credentialStatus : [doc.credentialStatus]
    ) as BitstringStatusListCredentialStatus[];

    const verificationResult = await Promise.all(
      credentialStatuses.map((cs) =>
        verifyCredentialStatus(cs, cs?.type as CredentialStatusType, verifierOptions),
      ),
    );
    const purposes = verificationResult.map((item) => item.purpose);
    const hasRevocation = purposes.includes('revocation');
    const hasSuspension = purposes.includes('suspension');
    const hasRevocationAndSuspension = hasRevocation && hasSuspension;

    if (verificationResult.some((r) => r.error)) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CCredentialStatus',
        reason: {
          code: W3CCredentialStatusCode.UNEXPECTED_ERROR,
          codeString: 'ERROR',
          message: verificationResult.map((r) => r.error).join(', '),
        },
        data: verificationResult,
        status: 'ERROR',
      };
    } else if (verificationResult.every((r) => r.status === false)) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CCredentialStatus',
        data: verificationResult,
        status: 'VALID',
      };
    } else {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CCredentialStatus',
        data: verificationResult,
        status: 'INVALID',
        reason: {
          code: hasRevocationAndSuspension
            ? W3CCredentialStatusCode.DOCUMENT_REVOKED_AND_SUSPENDED
            : hasRevocation
              ? W3CCredentialStatusCode.DOCUMENT_REVOKED
              : W3CCredentialStatusCode.DOCUMENT_SUSPENDED,
          codeString: hasRevocationAndSuspension
            ? 'REVOKED_AND_SUSPENDED'
            : hasRevocation
              ? 'REVOKED'
              : 'SUSPENDED',
          message: hasRevocationAndSuspension
            ? 'Document has been revoked and suspended.'
            : hasRevocation
              ? 'Document has been revoked.'
              : 'Document has been suspended.',
        },
      };
    }
  },
};
