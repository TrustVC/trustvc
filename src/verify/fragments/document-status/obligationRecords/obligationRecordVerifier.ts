import { DocumentsToVerify, VerifierOptions } from '@tradetrust-tt/tt-verify';
import * as w3cVC from '@trustvc/w3c-vc';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';
import { TRANSFERABLE_RECORDS_TYPE } from '../transferableRecords/transferableRecordVerifier';
import {
  ObligationRecordsCodedError,
  ObligationRecordsErrorFragment,
  ObligationRecordsResultFragment,
  ObligationRecordsStatusCode,
  ObligationRecordsVerificationFragment,
  ObligationRecordsVerifierType,
  isValidObligationRegistryStatus,
} from './obligationRecordVerifier.types';
import { getObligationEscrowEnrichment, isTokenMintedOnObligationRegistry } from './utils';

export const OBLIGATION_RECORDS_NAME = 'ObligationRecords';
const type = 'DOCUMENT_STATUS';
const name = OBLIGATION_RECORDS_NAME;

type ObligationCredentialStatus = {
  type?: string;
  tokenId?: string;
  obligationRegistry?: string;
  tokenRegistry?: string;
  tokenNetwork?: { chainId?: number; name?: string };
};

const verify: ObligationRecordsVerifierType['verify'] = async (
  document: DocumentsToVerify | SignedVerifiableCredential,
  options: VerifierOptions,
) => {
  const signedDocument = document as SignedVerifiableCredential;
  const credentialStatuses = (
    Array.isArray(signedDocument?.credentialStatus)
      ? signedDocument?.credentialStatus
      : [signedDocument?.credentialStatus]
  ) as ObligationCredentialStatus[];
  if (credentialStatuses.length === 0) {
    throw new ObligationRecordsCodedError(
      "Document's credentialStatus is empty",
      ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
      ObligationRecordsStatusCode[ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT],
    );
  }
  const { provider } = options;

  const verificationResult = await Promise.all(
    credentialStatuses.map(async (credentialStatus) => {
      if (!credentialStatus?.tokenId) {
        throw new ObligationRecordsCodedError(
          "Document's credentialStatus does not have tokenId",
          ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
          ObligationRecordsStatusCode[ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT],
        );
      }
      const tokenId = '0x' + credentialStatus.tokenId;
      const obligationRegistry = credentialStatus?.obligationRegistry;
      if (!obligationRegistry) {
        throw new ObligationRecordsCodedError(
          "Document's credentialStatus does not have obligationRegistry",
          ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
          ObligationRecordsStatusCode[ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT],
        );
      }
      if (credentialStatus?.tokenRegistry) {
        throw new ObligationRecordsCodedError(
          "Document's credentialStatus must not include both tokenRegistry and obligationRegistry",
          ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
          ObligationRecordsStatusCode[ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT],
        );
      }
      if (!credentialStatus?.tokenNetwork || !credentialStatus?.tokenNetwork?.chainId) {
        throw new ObligationRecordsCodedError(
          "Document's credentialStatus does not have tokenNetwork.chainId",
          ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT,
          ObligationRecordsStatusCode[ObligationRecordsStatusCode.UNRECOGNIZED_DOCUMENT],
        );
      }
      const mintStatus = await isTokenMintedOnObligationRegistry({
        obligationRegistry,
        tokenId,
        provider,
      });
      if (!isValidObligationRegistryStatus(mintStatus)) {
        return {
          ...mintStatus,
          obligationRegistry,
        };
      }
      const enrichment = await getObligationEscrowEnrichment({
        obligationRegistry,
        tokenId,
        provider,
      });
      return {
        minted: true as const,
        address: obligationRegistry,
        obligationRegistry,
        status: enrichment.status,
        terminationReason: enrichment.terminationReason,
      };
    }),
  );

  const first = verificationResult[0];
  const result: ObligationRecordsResultFragment = {
    name,
    type,
    status: 'INVALID',
    data: {
      obligationRegistry: credentialStatuses?.[0]?.obligationRegistry as string,
    },
  };

  const isEnrichedValid = (
    entry: (typeof verificationResult)[number],
  ): entry is {
    minted: true;
    address: string;
    obligationRegistry: string;
    status: number;
    terminationReason: number;
  } =>
    Boolean(entry) &&
    entry.minted === true &&
    typeof (entry as { status?: number }).status === 'number' &&
    typeof (entry as { terminationReason?: number }).terminationReason === 'number' &&
    typeof (entry as { obligationRegistry?: string }).obligationRegistry === 'string';

  if (verificationResult.every(isEnrichedValid)) {
    result.status = 'VALID';
    result.data = {
      obligationRegistry: first.obligationRegistry as string,
      status: (first as { status: number }).status,
      terminationReason: (first as { terminationReason: number }).terminationReason,
    };
  } else {
    const invalidEntry = verificationResult.find((entry) => !isEnrichedValid(entry));
    result.reason = (
      invalidEntry as { reason?: ObligationRecordsResultFragment['reason'] }
    )?.reason;
  }
  return result;
};

const skip: ObligationRecordsVerifierType['skip'] = async () => {
  return {
    status: 'SKIPPED',
    type,
    name,
    reason: {
      code: ObligationRecordsStatusCode.SKIPPED,
      codeString: ObligationRecordsStatusCode[ObligationRecordsStatusCode.SKIPPED],
      message: `Document does not have ObligationRecords status`,
    },
  };
};

const test: ObligationRecordsVerifierType['test'] = (
  document: DocumentsToVerify | SignedVerifiableCredential,
): boolean => {
  const doc = document as SignedVerifiableCredential;
  const credentialStatuses = Array.isArray(doc?.credentialStatus)
    ? doc?.credentialStatus
    : [doc?.credentialStatus];
  if (
    w3cVC.isSignedDocument(document) &&
    credentialStatuses.length > 0 &&
    credentialStatuses.every((cs) => {
      const status = cs as ObligationCredentialStatus;
      // Match on obligationRegistry so documents with both registries still
      // hit verify() and return the mutual-exclusivity ERROR.
      return status?.type === TRANSFERABLE_RECORDS_TYPE && Boolean(status?.obligationRegistry);
    })
  ) {
    return true;
  }
  return false;
};

export const credentialStatusObligationRecordVerifier: ObligationRecordsVerifierType = {
  skip,
  test,
  verify: async (...args): Promise<ObligationRecordsVerificationFragment> => {
    try {
      return await verify(...args);
    } catch (e: unknown) {
      if (e instanceof ObligationRecordsCodedError) {
        const err: ObligationRecordsErrorFragment = {
          name,
          type,
          status: 'ERROR',
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
        status: 'ERROR',
        reason: {
          code: ObligationRecordsStatusCode.UNEXPECTED_ERROR,
          codeString: ObligationRecordsStatusCode[ObligationRecordsStatusCode.UNEXPECTED_ERROR],
          message: e instanceof Error ? e.message : 'An unexpected error occurred',
        },
      };
    }
  },
};
