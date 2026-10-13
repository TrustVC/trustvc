import {
  CodedError,
  OpenAttestationEthereumTokenRegistryStatusCode,
} from '@tradetrust-tt/tt-verify';
import { ObligationRecordsErrorFragment } from './obligationRecordVerifier.types';

const DOCUMENT_STATUS_TYPE = 'DOCUMENT_STATUS' as const;

export const createObligationRecordsSkipFragment = (name: string, message: string) => ({
  status: 'SKIPPED' as const,
  type: DOCUMENT_STATUS_TYPE,
  name,
  reason: {
    code: OpenAttestationEthereumTokenRegistryStatusCode.SKIPPED,
    codeString:
      OpenAttestationEthereumTokenRegistryStatusCode[
        OpenAttestationEthereumTokenRegistryStatusCode.SKIPPED
      ],
    message,
  },
});

export const toObligationRecordsErrorFragment = (
  name: string,
  error: unknown,
): ObligationRecordsErrorFragment => {
  if (error instanceof CodedError) {
    return {
      name,
      type: DOCUMENT_STATUS_TYPE,
      status: 'ERROR' as const,
      reason: {
        code: error.code,
        codeString: error.codeString,
        message: error.message,
      },
    };
  }

  return {
    name,
    type: DOCUMENT_STATUS_TYPE,
    status: 'ERROR' as const,
    reason: {
      code: OpenAttestationEthereumTokenRegistryStatusCode.UNEXPECTED_ERROR,
      codeString:
        OpenAttestationEthereumTokenRegistryStatusCode[
          OpenAttestationEthereumTokenRegistryStatusCode.UNEXPECTED_ERROR
        ],
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    },
  };
};
