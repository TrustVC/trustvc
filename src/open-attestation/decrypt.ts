import forge from 'node-forge';
import type { IEncryptionResults } from './types';
import { ENCRYPTION_PARAMETERS, decodeDocument } from './utils';

/**
 * Decrypts a given ciphertext along with its associated variables.
 * @param {IEncryptionResults} encryptionResults - Encryption result object containing cipherText (base64), tag (base64), iv (base64), key (hex), and type.
 * @returns {string} Decrypted plaintext string.
 */
export const decryptString = ({ cipherText, tag, iv, key, type }: IEncryptionResults): string => {
  if (type !== ENCRYPTION_PARAMETERS.version) {
    throw new Error(`Expecting version ${ENCRYPTION_PARAMETERS.version} but got ${type}`);
  }
  const keyBytestring = forge.util.hexToBytes(key);
  const cipherTextBytestring = forge.util.decode64(cipherText);
  const ivBytestring = forge.util.decode64(iv);
  const tagBytestring = forge.util.decode64(tag);

  const decipher = forge.cipher.createDecipher('AES-GCM', keyBytestring);
  decipher.start({
    iv: ivBytestring,
    tagLength: ENCRYPTION_PARAMETERS.tagLength,
    tag: forge.util.createBuffer(tagBytestring, 'raw'),
  });
  decipher.update(forge.util.createBuffer(cipherTextBytestring, 'raw'));
  const success = decipher.finish();
  if (!success) {
    throw new Error('Error decrypting message');
  }
  return decodeDocument(decipher.output.data);
};
