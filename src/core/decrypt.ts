import { DEFAULT_KEY } from '../constants';
import { stringToUint8Array, generate32ByteKey, generate12ByteNonce } from '../utils/stringUtils';
import { Chacha20 } from 'ts-chacha20';

/**
 * Decrypts a message that was encrypted using the ChaCha20 algorithm.
 *
 * This function takes an encrypted message (in base64 format), converts it back to a buffer,
 * and decrypts it using the ChaCha20 stream cipher. The decryption key is processed to ensure it's
 * 32 bytes in length, and the nonce (initialization vector) is either provided or generated as 12 bytes.
 *
 * @param {string} encryptedMessage - The encrypted message to be decrypted, in base64 format.
 * @param {string} key - The decryption key, which will be processed into a 32-byte key.
 * @param {string} [nonce] - (Optional) A 12-byte nonce used during the encryption process. If not provided, one will be generated.
 * @returns {string} - The decrypted message in UTF-8 format.
 * @throws {Error} - Throws if the decryption process encounters any issues.
 */
export function decrypt(encryptedMessage: string, key: string, nonce?: string): string {
  // Use a default key if the provided key is empty
  key = key.length > 0 ? key : DEFAULT_KEY;

  // Ensure the key is transformed into a 32-byte key
  key = generate32ByteKey(key);

  // Generate a 12-byte nonce if not provided, using the generate12ByteNonce function
  nonce = generate12ByteNonce(nonce ?? '');

  // Convert the key and nonce from strings to Uint8Array buffers to be compatible with ChaCha20
  const keyBuffer = stringToUint8Array(key);
  const nonceBuffer = stringToUint8Array(nonce);

  // Initialize a new ChaCha20 instance with the key and nonce buffers
  const chacha20 = new Chacha20(keyBuffer, nonceBuffer);

  // Convert the encrypted message (in hex format) back to a Uint8Array for decryption
  const encryptedBuffer = new Uint8Array(Buffer.from(encryptedMessage, 'hex'));

  // Decrypt the encrypted buffer using the ChaCha20 instance
  const decrypted = chacha20.decrypt(encryptedBuffer);

  // Convert the decrypted Uint8Array back to a UTF-8 string and return it
  return Buffer.from(decrypted).toString('utf-8');
}
