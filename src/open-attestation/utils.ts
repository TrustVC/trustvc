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
  if (!Number.isInteger(keyLengthInBits) || ![128, 192, 256].includes(keyLengthInBits)) {
    throw new Error('keyLengthInBits must be one of 128, 192, or 256');
  }
  const encryptionKey = forge.random.getBytesSync(keyLengthInBits / 8);
  return forge.util.bytesToHex(encryptionKey);
};

/**
 * Encode document string to URL-safe base64 (base64url: UTF-8 then base64 with +→-, /→_, no padding).
 * Safe for use in query strings and JSON without further encoding.
 * @param {string} document - Plain text document to encode.
 * @returns {string} Base64url-encoded string.
 */
export const encodeDocument = (document: string): string => {
  const bytes = forge.util.encodeUtf8(document);
  const standard = forge.util.encode64(bytes);
  const s = standard.replace(/\+/g, '-').replace(/\//g, '_');
  const trim = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0;
  return trim ? s.slice(0, -trim) : s;
};

/**
 * Decode base64url-encoded document string back to UTF-8.
 * Accepts both base64url (no padding, - and _) and standard base64 for backwards compatibility.
 * @param {string} encoded - Base64- or base64url-encoded string to decode.
 * @returns {string} Decoded UTF-8 plain text.
 */
export const decodeDocument = (encoded: string): string => {
  let normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4;
  if (pad) normalized += '='.repeat(4 - pad);
  const decoded = forge.util.decode64(normalized);
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
