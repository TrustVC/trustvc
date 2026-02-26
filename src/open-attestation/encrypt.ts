import forge from 'node-forge';
import type { IEncryptionResults } from './types';
import { ENCRYPTION_PARAMETERS, encodeDocument, generateEncryptionKey } from './utils';

/**
 * Generates an initialisation vector represented as a base64 string.
 * @param {number} [ivLengthInBits] - IV length in bits.
 * @returns {string} Base64-encoded IV.
 */
const generateIv = (ivLengthInBits: number = ENCRYPTION_PARAMETERS.ivLength): string => {
  const iv = forge.random.getBytesSync(ivLengthInBits / 8);
  return forge.util.encode64(iv);
};

/**
 * Generates the requisite randomised variables and initialises the cipher with them.
 * @param {string} [encryptionKey] - Encryption key in hexadecimal (64 chars for 256-bit). If omitted, a key is generated.
 * @returns {{ cipher: forge.cipher.BlockCipher; encryptionKey: string; iv: string }} Cipher object, encryption key in hex, and iv in base64.
 */
const makeCipher = (encryptionKey: string = generateEncryptionKey()) => {
  const iv = generateIv();
  const cipher = forge.cipher.createCipher(
    ENCRYPTION_PARAMETERS.algorithm,
    forge.util.hexToBytes(encryptionKey),
  );

  cipher.start({
    iv: forge.util.decode64(iv),
    tagLength: ENCRYPTION_PARAMETERS.tagLength,
  });

  return { cipher, encryptionKey, iv };
};

/**
 * Encrypts a given string with symmetric AES-GCM.
 * @param {string} document - Input string to encrypt.
 * @param {string} [key] - Optional encryption key in hexadecimal (64 chars for 256-bit). If omitted, a key is generated.
 * @returns {IEncryptionResults} Object with cipherText (base64), iv (base64), tag (base64), key (hex), and type.
 */
export const encryptString = (document: string, key?: string): IEncryptionResults => {
  if (typeof document !== 'string') {
    throw new Error('encryptString only accepts strings');
  }

  const { cipher, encryptionKey, iv } = makeCipher(key);
  const buffer = forge.util.createBuffer(encodeDocument(document));
  cipher.update(buffer);
  cipher.finish();

  const encryptedMessage = forge.util.encode64(cipher.output.data);
  const tag = forge.util.encode64(cipher.mode.tag.data);
  return {
    cipherText: encryptedMessage,
    iv,
    tag,
    key: encryptionKey,
    type: ENCRYPTION_PARAMETERS.version,
  };
};
