import { v4, SUPPORTED_SIGNING_ALGORITHM } from '@govtechsg/open-attestation';
import { KeyPair } from './types';
import { Signer } from '@ethersproject/abstract-signer';
const { signDocument } = v4;

/**
 * Asynchronously signs a V4 wrapped OpenAttestation document using either a KeyPair or a Signer.
 *
 * This function takes a wrapped OpenAttestation document and signs it using the Secp256k1
 * algorithm. The keyPair parameter can be a KeyPair object or a Signer instance. Errors
 * during the signing process will propagate from the underlying OpenAttestation `signDocument` function.
 *
 * @param {V4WrappedDocument} document - The wrapped document to be signed.
 * @param {KeyPair | Signer} keyPair - The key pair containing the public DID and private key,
 *                                       or a Signer instance for signing the document.
 * @returns {Promise<v4.SignedWrappedDocument>} - A promise that resolves to the signed document.
 * @throws {Error} - Any errors thrown by the `signDocument` function will propagate naturally.
 *
 */
export const signOA = async (
  document: v4.WrappedDocument,
  keyPair: KeyPair | Signer,
): Promise<v4.SignedWrappedDocument> => {
  // Sign the document using OpenAttestation's `signDocument` function with Secp256k1 algorithm
  return signDocument(document, SUPPORTED_SIGNING_ALGORITHM.Secp256k1VerificationKey2018, keyPair);
};
