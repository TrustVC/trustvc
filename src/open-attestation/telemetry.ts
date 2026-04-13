import { SUPPORTED_SIGNING_ALGORITHM, utils } from '@tradetrust-tt/tradetrust';
import { emitTelemetry, type ActionType } from '../utils/telemetry';
import { getDataV2 } from './utils';

const getIdentityProofType = (document: unknown): string => {
  if (utils.isWrappedV3Document(document)) {
    return document.openAttestationMetadata?.identityProof?.type ?? '';
  }

  if (utils.isWrappedV2Document(document)) {
    return (
      getDataV2(document as Parameters<typeof getDataV2>[0])?.issuers?.[0]?.identityProof?.type ??
      ''
    );
  }

  return '';
};

export const emitOATelemetry = (actionType: ActionType, document: unknown): void => {
  void emitTelemetry({
    action_type: actionType,
    document_format: 'oa',
    cryptosuite: SUPPORTED_SIGNING_ALGORITHM.Secp256k1VerificationKey2018,
    did_method: getIdentityProofType(document) || 'unknown',
  });
};
