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
  ObligationRecordsErrorFragment,
  ObligationRecordsResultFragment,
  ObligationRecordsVerificationFragment,
  VerifierType,
} from './obligationRecordVerifier.types';
import { isTokenMintedOnObligationRegistry } from './utils';

export const OBLIGATION_RECORDS_TYPE = 'ObligationRecords';
const type = 'DOCUMENT_STATUS';
const name = OBLIGATION_RECORDS_TYPE;

const verify: VerifierType['verify'] = async (
  document: DocumentsToVerify | SignedVerifiableCredential,
  options: VerifierOptions,
) => {
  const signedDocument = document as SignedVerifiableCredential;
  const credentialStatuses = (
    Array.isArray(signedDocument?.credentialStatus)
      ? signedDocument?.credentialStatus
      : [signedDocument?.credentialStatus]
  ) as ObligationRecordsCredentialStatus[];
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

      if (
        !credentialStatus?.tokenNetwork ||
        credentialStatus?.tokenNetwork?.chainId === undefined
      ) {
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
        chainId: credentialStatus.tokenNetwork.chainId,
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

  if (verificationResult.every(ValidTokenRegistryStatus.guard)) {
    result.status = 'VALID' as const;
  } else {
    result.reason = (verificationResult as InvalidTokenRegistryStatus[])?.[0]?.reason;
  }

  return result;
};

const skip: VerifierType['skip'] = async () => {
  return {
    status: 'SKIPPED',
    type,
    name,
    reason: {
      code: OpenAttestationEthereumTokenRegistryStatusCode.SKIPPED,
      codeString:
        OpenAttestationEthereumTokenRegistryStatusCode[
          OpenAttestationEthereumTokenRegistryStatusCode.SKIPPED
        ],
      message: `Document does not have ObligationRecords status`,
    },
  };
};

const test: VerifierType['test'] = (
  document: DocumentsToVerify | SignedVerifiableCredential,
): boolean => {
  const doc = document as SignedVerifiableCredential;
  const credentialStatuses = Array.isArray(doc?.credentialStatus)
    ? doc?.credentialStatus
    : [doc?.credentialStatus];

  if (
    w3cVC.isSignedDocument(document) &&
    credentialStatuses.every((cs: w3cVC.CredentialStatus) => isObligationRecordCredentialStatus(cs))
  ) {
    return true;
  }

  return false;
};

export const credentialStatusObligationRecordVerifier: VerifierType = {
  skip,
  test,
  verify: async (...args): Promise<ObligationRecordsVerificationFragment> => {
    try {
      return await verify(...args);
    } catch (e: unknown) {
      if (e instanceof CodedError) {
        const err: ObligationRecordsErrorFragment = {
          name,
          type,
          status: 'ERROR' as const,
          reason: {
            code: e.code,
            codeString: e.codeString,
            message: e.message,
          },
        };
        return err;
      }

      return {
        name,
        type,
        status: 'ERROR' as const,
        reason: {
          code: OpenAttestationEthereumTokenRegistryStatusCode.UNEXPECTED_ERROR,
          codeString:
            OpenAttestationEthereumTokenRegistryStatusCode[
              OpenAttestationEthereumTokenRegistryStatusCode.UNEXPECTED_ERROR
            ],
          message: e instanceof Error ? e.message : 'An unexpected error occurred',
        },
      };
    }
  },
};
