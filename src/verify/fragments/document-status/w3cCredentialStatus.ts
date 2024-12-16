import { VerificationFragment, Verifier } from '@tradetrust-tt/tt-verify';
import {
  BitstringStatusListCredentialStatus,
  CredentialStatusType,
} from '@trustvc/w3c-credential-status';
import { CredentialStatus, isSignedDocument, verifyCredentialStatus } from '@trustvc/w3c-vc';
import { SignedVerifiableCredential } from '../../..';

export const w3cCredentialStatus: Verifier<VerificationFragment> = {
  skip: async () => {
    return {
      type: 'DOCUMENT_STATUS',
      name: 'W3CCredentialStatus',
      reason: {
        code: 0,
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

  verify: async (document: unknown) => {
    const doc = document as SignedVerifiableCredential;
    const credentialStatuses = (
      Array.isArray(doc.credentialStatus) ? doc.credentialStatus : [doc.credentialStatus]
    ) as BitstringStatusListCredentialStatus[];

    const verificationResult = await Promise.all(
      credentialStatuses.map((cs) => verifyCredentialStatus(cs, cs?.type as CredentialStatusType)),
    );

    if (verificationResult.some((r) => r.error)) {
      return {
        type: 'DOCUMENT_STATUS',
        name: 'W3CCredentialStatus',
        reason: {
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
      };
    }
  },
};
