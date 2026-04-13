import { utils } from '@tradetrust-tt/tradetrust';
import { emitTelemetry, type ActionType } from '../utils/telemetry';
import { getDataV2 } from './utils';

const findNestedType = (value: unknown): string => {
  if (Array.isArray(value)) {
    for (const item of value) {
      const type = findNestedType(item);
      if (type) return type;
    }
    return '';
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record.type === 'string') return record.type;

    for (const nestedValue of Object.values(record)) {
      const type = findNestedType(nestedValue);
      if (type) return type;
    }
  }

  return '';
};

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

const getOACryptosuite = (document: unknown): string => {
  if (utils.isWrappedV3Document(document)) {
    return findNestedType(document.proof);
  }

  if (utils.isWrappedV2Document(document)) {
    return findNestedType(document.signature);
  }

  return '';
};

export const emitOATelemetry = (actionType: ActionType, document: unknown): void => {
  void emitTelemetry({
    action_type: actionType,
    document_format: 'oa',
    cryptosuite: getOACryptosuite(document) || 'unknown',
    did_method: getIdentityProofType(document) || 'unknown',
  });
};
