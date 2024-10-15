import { signCredential } from '@trustvc/w3c-vc';
import { RawVerifiableCredential, SigningResult, PrivateKeyPair } from './types';

/**
 * Signs a W3C Verifiable Credential using the provided cryptographic suite and key pair.
 *
 * @param {RawVerifiableCredential} credential - The verifiable credential object that needs to be signed.
 * @param {PrivateKeyPair} keyPair - The private and public key pair used for signing the credential.
 * @param {string} [cryptoSuite='BbsBlsSignature2020'] - The cryptographic suite to be used for signing (default is 'BbsBlsSignature2020').
 *
 * @returns {Promise<SigningResult>} A promise that resolves to the result of the signing operation, which includes the signed credential.
 *
 */
export const signW3C = async (
  credential: RawVerifiableCredential,
  keyPair: PrivateKeyPair,
  cryptoSuite: string = 'BbsBlsSignature2020',
): Promise<SigningResult> => {
  // Call the signCredential function from the trustvc/w3c-vc package to sign the credential
  return signCredential(credential, keyPair, cryptoSuite);
};
