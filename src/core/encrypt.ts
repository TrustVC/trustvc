import { DEFAULT_KEY } from '../constants';
import { stringToUint8Array, generate32ByteKey, generate12ByteNonce } from '../utils/stringUtils';
import { Chacha20 } from 'ts-chacha20';

/**
 * Encrypts a message using the ChaCha20 encryption algorithm with a given key and nonce.
 *
 * This function takes a plaintext message, converts it to a buffer, and encrypts it using
 * the ChaCha20 stream cipher. The encryption key is processed to ensure it's 32 bytes in length,
 * and the nonce (initialization vector) is either provided or generated as 12 bytes.
 * @param {string} message - The plaintext message to be encrypted.
 * @param {string} key - The encryption key, which will be processed into a 32-byte key.
 * @param {string} [nonce] - (Optional) A 12-byte nonce to be used for the encryption. If not provided, one will be generated.
 * @returns {string} - The encrypted message in base64 format.
 * @throws {Error} - Throws if the encryption process encounters any issues.
 */
export function encrypt(message: string, key: string, nonce?: string): string {
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

  // Convert the message string to a buffer for encryption
  const messageBuffer = stringToUint8Array(message);

  // Encrypt the message buffer using the ChaCha20 instance
  const encrypted = chacha20.encrypt(messageBuffer);

  // Convert the encrypted Uint8Array back to a base64 string and return it
  return Buffer.from(encrypted).toString('hex');
}
