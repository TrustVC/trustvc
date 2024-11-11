import {
  CodedError,
  DocumentsToVerify,
  OpenAttestationEthereumTokenRegistryStatusCode,
  ValidTokenRegistryStatus,
  VerifierOptions,
} from '@tradetrust-tt/tt-verify';
import * as w3cVC from '@trustvc/w3c-vc';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';
import {
  TransferableRecordCredentialStatus,
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
  let signedDocument;
  let tokenId: string;

  if (w3cVC.isSignedDocument(document)) {
    signedDocument = document as SignedVerifiableCredential;
    tokenId = '0x' + signedDocument?.credentialStatus?.tokenId;
  }

  const credentialStatus =
    signedDocument?.credentialStatus as unknown as TransferableRecordCredentialStatus;

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

  const { provider } = options;

  // await provider.getNetwork().then(({ chainId, name }) => {
  // });

  const mintStatus = await isTokenMintedOnRegistry({
    tokenRegistryAddress: credentialStatus?.tokenRegistry,
    tokenId,
    provider,
  });

  const result: TransferableRecordsResultFragment = {
    name,
    type,
    status: 'INVALID' as const,
    data: {
      tokenRegistry: credentialStatus.tokenRegistry,
    },
  };

  if (ValidTokenRegistryStatus.guard(mintStatus)) {
    result.status = 'VALID' as const;
  } else {
    result.reason = mintStatus.reason;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((document as any)?.credentialStatus?.type === TRANSFERABLE_RECORDS_TYPE) {
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
