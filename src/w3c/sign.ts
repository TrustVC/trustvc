import { CryptoSuiteName, signCredential } from '@trustvc/w3c-vc';
import { RawVerifiableCredential, SigningResult, PrivateKeyPair } from './types';
import { emitTelemetry, extractDidMethod } from '../utils/telemetry';

/**
 * Signs a W3C Verifiable Credential using the provided cryptographic suite and key pair.
 * @param {RawVerifiableCredential} credential - The verifiable credential object that needs to be signed.
 * @param {PrivateKeyPair} keyPair - The private and public key pair used for signing the credential.
 * @param {CryptoSuiteName} [cryptoSuite='ecdsa-sd-2023'] - The cryptographic suite to be used for signing (default is 'ecdsa-sd-2023').
 * @param {object} [options] - Optional parameters including mandatoryPointers for both ECDSA-SD-2023 / BBS-2023.
 * @param {string[]} [options.mandatoryPointers] - Optional mandatory pointers for both ECDSA-SD-2023 / BBS-2023.
 * @returns {Promise<SigningResult>} A promise that resolves to the result of the signing operation, which includes the signed credential.
 */
export const signW3C = async (
  credential: RawVerifiableCredential,
  keyPair: PrivateKeyPair,
  cryptoSuite: CryptoSuiteName = 'ecdsa-sd-2023',
  options?: {
    mandatoryPointers?: string[];
  },
): Promise<SigningResult> => {
  // Call the signCredential function from the trustvc/w3c-vc package to sign the credential
  const result = await signCredential(credential, keyPair, cryptoSuite, options);

  const issuerDid =
    typeof credential.issuer === 'string' ? credential.issuer : (credential.issuer?.id ?? '');
  emitTelemetry({
    action_type: 'issuance',
    document_format: 'w3c_vc',
    cryptosuite: cryptoSuite,
    did_method: extractDidMethod(issuerDid),
  }).catch(() => {});

  return result;
};
