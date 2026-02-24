import forge from 'node-forge';
import {
  getData as getDataV2,
  isSchemaValidationError,
  obfuscateDocument,
  SchemaId,
  SUPPORTED_SIGNING_ALGORITHM,
  utils,
  validateSchema,
} from '@tradetrust-tt/tradetrust';

/**
 * Default options for OA document encryption (AES-GCM).
 * {@link https://crypto.stackexchange.com/questions/26783/ciphertext-and-tag-size-and-iv-transmission-with-aes-in-gcm-mode/26787|here}
 */
export const ENCRYPTION_PARAMETERS = {
  algorithm: 'AES-GCM' as const,
  keyLength: 256, // Key length in bits
  ivLength: 96, // IV length in bits: NIST suggests 12 bytes
  tagLength: 128, // GCM authentication tag length in bits, see link above for explanation
  version: 'OPEN-ATTESTATION-TYPE-1', // Type 1 using the above params without compression
};

/**
 * Generates a random key represented as a hexadecimal string.
 * @param {number} [keyLengthInBits] - Key length in bits.
 * @returns {string} Hexadecimal-encoded encryption key.
 */
export const generateEncryptionKey = (
  keyLengthInBits: number = ENCRYPTION_PARAMETERS.keyLength,
): string => {
  const encryptionKey = forge.random.getBytesSync(keyLengthInBits / 8);
  return forge.util.bytesToHex(encryptionKey);
};

/**
 * Encode document string to base64 (UTF-8 then base64).
 * @param {string} document - Plain text document to encode.
 * @returns {string} Base64-encoded string.
 */
export const encodeDocument = (document: string): string => {
  const bytes = forge.util.encodeUtf8(document);
  return forge.util.encode64(bytes);
};

/**
 * Decode base64-encoded document string back to UTF-8.
 * @param {string} encoded - Base64-encoded string to decode.
 * @returns {string} Decoded UTF-8 plain text.
 */
export const decodeDocument = (encoded: string): string => {
  const decoded = forge.util.decode64(encoded);
  return forge.util.decodeUtf8(decoded);
};

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
  getDocumentData,
  getIssuerAddress,
  diagnose,
  getTemplateURL,
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
  isRawV2Document,
  isRawV3Document,
  isSignedWrappedV2Document,
  isSignedWrappedV3Document,
  isTransferableAsset,
  isDocumentRevokable,
  isWrappedV2Document,
  isWrappedV3Document,
};
