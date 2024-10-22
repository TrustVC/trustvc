import { shake256 } from 'js-sha3';

/**
 * Converts a string into a Uint8Array.
 *
 * This function takes a string input and uses the `Uint8Array` API to encode it into a
 * Uint8Array, which is suitable for binary operations like encryption.
 *
 * @param {string} str - The string to be converted into a Uint8Array.
 * @returns {Uint8Array} - The encoded Uint8Array representation of the input string.
 */
export function stringToUint8Array(str: string): Uint8Array {
  // convert a string to uint8array to be used in chacha20
  return new Uint8Array(Buffer.from(str, 'utf-8'));
}

/**
 * Generates a 32-byte key by hashing the input string.
 *
 * This function uses the SHAKE256 hash function to generate a 128-bit (32-byte) key
 * from the given input string. SHAKE256 is a cryptographic hash function that produces
 * variable-length output.
 *
 * @param {string} input - The input string to be hashed into a 32-byte key.
 * @returns {string} - A 32-byte hash of the input string, suitable for use as an encryption key.
 */
export function generate32ByteKey(input: string): string {
  // Hash the input string using SHAKE256 to produce a 128-bit (32-byte) output
  const hash = shake256(input, 128); // 128 bits = 32 bytes

  // Return the hashed output as a string
  return hash;
}

/**
 * Generates a 12-byte nonce by hashing the input string.
 *
 * This function uses the SHAKE256 hash function to generate a 48-bit (12-byte) nonce
 * from the given input string. The nonce is used as an initialization vector in encryption.
 *
 * @param {string} input - The input string to be hashed into a 12-byte nonce.
 * @returns {string} - A 12-byte hash of the input string, suitable for use as a nonce.
 */
export function generate12ByteNonce(input: string): string {
  // Hash the input string using SHAKE256 to produce a 48-bit (12-byte) output
  const nonce = shake256(input, 48); // 48 bits = 12 bytes

  // Return the hashed output as a string
  return nonce;
}
