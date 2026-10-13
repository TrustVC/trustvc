import {
  CodedError,
  DocumentsToVerify,
  InvalidTokenRegistryStatus,
  OpenAttestationEthereumTokenRegistryStatusCode,
  ValidTokenRegistryStatus,
  VerifierOptions,
} from '@tradetrust-tt/tt-verify';
import { ObligationRecordsCredentialStatus } from '@trustvc/w3c-credential-status';
import * as w3cVC from '@trustvc/w3c-vc';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';
import { isObligationRecordCredentialStatus } from '../../../../utils/documents/obligation';
import {
  ObligationRecordsResultFragment,
  ObligationRecordsVerificationFragment,
  VerifierType,
} from './obligationRecordVerifier.types';
import { isTokenMintedOnObligationRegistry } from './utils';
import {
  createObligationRecordsSkipFragment,
  toObligationRecordsErrorFragment,
} from './verifierHelpers';

export const OBLIGATION_RECORDS_TYPE = 'ObligationRecords';
const type = 'DOCUMENT_STATUS';
const name = OBLIGATION_RECORDS_TYPE;

const verify: VerifierType['verify'] = async (
  document: DocumentsToVerify | SignedVerifiableCredential,
  options: VerifierOptions,
) => {
  const signedDocument = document as SignedVerifiableCredential;
  const rawCredentialStatuses = Array.isArray(signedDocument?.credentialStatus)
    ? signedDocument?.credentialStatus
    : [signedDocument?.credentialStatus];
  const credentialStatuses = rawCredentialStatuses.filter(isObligationRecordCredentialStatus);
  const { provider } = options;

  const verificationResult = await Promise.all(
    credentialStatuses.map(async (credentialStatus: ObligationRecordsCredentialStatus) => {
      const tokenId = '0x' + credentialStatus.tokenId;

      if (!credentialStatus?.obligationRegistry) {
        throw new CodedError(
          "Document's credentialStatus does not have obligationRegistry",
          OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT,
          OpenAttestationEthereumTokenRegistryStatusCode[
            OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT
          ],
        );
      }

      const chainId = credentialStatus.tokenNetwork?.chainId;
      if (chainId === undefined) {
        throw new CodedError(
          "Document's credentialStatus does not have tokenNetwork.chainId",
          OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT,
          OpenAttestationEthereumTokenRegistryStatusCode[
            OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT
          ],
        );
      }

      return isTokenMintedOnObligationRegistry({
        obligationRegistryAddress: credentialStatus.obligationRegistry,
        tokenId,
        provider,
        chainId,
      });
    }),
  );

  const result: ObligationRecordsResultFragment = {
    name,
    type,
    status: 'INVALID' as const,
    data: {
      obligationRegistry: credentialStatuses?.[0]?.obligationRegistry,
    },
  };

  if (verificationResult.length > 0 && verificationResult.every(ValidTokenRegistryStatus.guard)) {
    result.status = 'VALID' as const;
  } else {
    const invalidStatus = verificationResult.find(
      (status): status is InvalidTokenRegistryStatus => !ValidTokenRegistryStatus.guard(status),
    );
    result.reason = invalidStatus?.reason;
  }

  return result;
};

const skip: VerifierType['skip'] = async () =>
  createObligationRecordsSkipFragment(name, 'Document does not have ObligationRecords status');

const test: VerifierType['test'] = (
  document: DocumentsToVerify | SignedVerifiableCredential,
): boolean => {
  const doc = document as SignedVerifiableCredential;
  const credentialStatuses = Array.isArray(doc?.credentialStatus)
    ? doc?.credentialStatus
    : [doc?.credentialStatus];

  return Boolean(
    w3cVC.isSignedDocument(document) &&
      credentialStatuses.some((cs: w3cVC.CredentialStatus) =>
        isObligationRecordCredentialStatus(cs),
      ),
  );
};

export const credentialStatusObligationRecordVerifier: VerifierType = {
  skip,
  test,
  verify: async (...args): Promise<ObligationRecordsVerificationFragment> => {
    try {
      return await verify(...args);
    } catch (error: unknown) {
      return toObligationRecordsErrorFragment(name, error);
    }
  },
};
