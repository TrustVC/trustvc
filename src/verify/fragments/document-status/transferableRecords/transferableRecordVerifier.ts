import {
  CodedError,
  DocumentsToVerify,
  InvalidTokenRegistryStatus,
  OpenAttestationEthereumTokenRegistryStatusCode,
  ValidTokenRegistryStatus,
  VerifierOptions,
} from '@tradetrust-tt/tt-verify';
import { TransferableRecordsCredentialStatus } from '@trustvc/w3c-credential-status';
import * as w3cVC from '@trustvc/w3c-vc';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';
import {
  TransferableRecordsErrorFragment,
  TransferableRecordsResultFragment,
  TransferableRecordsVerificationFragment,
  VerifierType,
} from './transferableRecordVerifier.types';
import { isTokenMintedOnRegistry } from './utils';

export const TRANSFERABLE_RECORDS_TYPE = 'TransferableRecords';
const type = 'DOCUMENT_STATUS';
const name = TRANSFERABLE_RECORDS_TYPE;

const verify: VerifierType['verify'] = async (
  document: DocumentsToVerify | SignedVerifiableCredential,
  options: VerifierOptions,
) => {
  const signedDocument = document as SignedVerifiableCredential;
  const credentialStatuses = (
    Array.isArray(signedDocument?.credentialStatus)
      ? signedDocument?.credentialStatus
      : [signedDocument?.credentialStatus]
  ) as TransferableRecordsCredentialStatus[];
  const { provider } = options;

  const verificationResult = await Promise.all(
    credentialStatuses.map(async (credentialStatus: TransferableRecordsCredentialStatus) => {
      const tokenId = '0x' + credentialStatus.tokenId;

      if (!credentialStatus?.tokenRegistry) {
        throw new CodedError(
          "Document's credentialStatus does not have tokenRegistry",
          OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT,
          OpenAttestationEthereumTokenRegistryStatusCode[
            OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT
          ],
        );
      }

      if (!credentialStatus?.tokenNetwork || !credentialStatus?.tokenNetwork?.chainId) {
        throw new CodedError(
          "Document's credentialStatus does not have tokenNetwork.chainId",
          OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT,
          OpenAttestationEthereumTokenRegistryStatusCode[
            OpenAttestationEthereumTokenRegistryStatusCode.UNRECOGNIZED_DOCUMENT
          ],
        );
      }

      const mintStatus = await isTokenMintedOnRegistry({
        tokenRegistryAddress: credentialStatus?.tokenRegistry,
        tokenId,
        provider,
      });

      return mintStatus;
    }),
  );

  const result: TransferableRecordsResultFragment = {
    name,
    type,
    status: 'INVALID' as const,
    data: {
      tokenRegistry: credentialStatuses?.[0]?.tokenRegistry,
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
      message: `Document does not have TransferableRecords status`,
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
    credentialStatuses.every((cs: w3cVC.CredentialStatus) => cs?.type === TRANSFERABLE_RECORDS_TYPE)
  ) {
    return true;
  }
  return false;
};

export const credentialStatusTransferableRecordVerifier: VerifierType = {
  skip,
  test,
  verify: async (...args): Promise<TransferableRecordsVerificationFragment> => {
    try {
      return await verify(...args);
    } catch (e: unknown) {
      if (e instanceof CodedError) {
        const err: TransferableRecordsErrorFragment = {
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
