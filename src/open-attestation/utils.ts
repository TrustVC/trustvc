import {
  getData as getDataV2,
  isSchemaValidationError,
  obfuscateDocument,
  OpenAttestationDocument,
  SchemaId,
  SUPPORTED_SIGNING_ALGORITHM,
  utils,
  validateSchema,
  WrappedDocument,
} from '@tradetrust-tt/tradetrust';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';

const {
  isTransferableAsset,
  isDocumentRevokable,
  getAssetId,
  isWrappedV2Document,
  isSignedWrappedV2Document,
  isWrappedV3Document,
  isSignedWrappedV3Document,
  isRawV2Document,
  isRawV3Document,
  // isObfuscated,
  getDocumentData,
  getIssuerAddress,
  diagnose,
  getTemplateURL,
} = utils;

const {
  isObfuscated,
}: {
  isObfuscated: (
    document: WrappedDocument<OpenAttestationDocument> | SignedVerifiableCredential,
  ) => boolean;
} = utils;

export {
  getDataV2,
  isSchemaValidationError,
  obfuscateDocument,
  SchemaId,
  SUPPORTED_SIGNING_ALGORITHM,
  validateSchema,
};

// utils
export {
  diagnose,
  getAssetId,
  getTemplateURL,
  getDocumentData,
  getIssuerAddress,
  isObfuscated,
  isRawV2Document,
  isRawV3Document,
  isSignedWrappedV2Document,
  isSignedWrappedV3Document,
  isTransferableAsset,
  isDocumentRevokable,
  isWrappedV2Document,
  isWrappedV3Document,
};
