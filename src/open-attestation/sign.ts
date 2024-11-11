import { Signer } from '@ethersproject/abstract-signer';
import {
  OpenAttestationDocument,
  signDocument,
  SignedWrappedDocument,
  SUPPORTED_SIGNING_ALGORITHM,
  v2,
  v3,
} from '@tradetrust-tt/tradetrust';
import { KeyPair } from './types';

/**
 * Asynchronously signs a v2 / v3 wrapped OpenAttestation document using either a KeyPair or a Signer.
 *
 * This function takes a wrapped OpenAttestation document and signs it using the Secp256k1
 * algorithm. The keyPair parameter can be a KeyPair object or a Signer instance. Errors
 * during the signing process will propagate from the underlying OpenAttestation `signDocument` function.
 *
 * @param {v2.WrappedDocument | v3.WrappedDocument | v2.SignedWrappedDocument | v3.SignedWrappedDocument} document - The wrapped document to be signed.
 * @param {KeyPair | Signer} keyPair - The key pair containing the public DID and private key, or a Signer instance for signing the document.
 * @returns {Promise<v2.SignedWrappedDocument | v3.SignedWrappedDocument>} - A promise that resolves to the signed document.
 * @throws {Error} - Any errors thrown by the `signDocument` function will propagate naturally.
 */
export const signOA = async <T extends OpenAttestationDocument>(
  document:
    | v2.WrappedDocument
    | v3.WrappedDocument
    | v2.SignedWrappedDocument
    | v3.SignedWrappedDocument,
  keyPair: KeyPair | Signer,
): Promise<SignedWrappedDocument<T>> => {
  // Sign the document using OpenAttestation's `signDocument` function with Secp256k1 algorithm
  return signDocument(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    document as any,
    SUPPORTED_SIGNING_ALGORITHM.Secp256k1VerificationKey2018,
    keyPair,
  ) as SignedWrappedDocument<T>;
};
