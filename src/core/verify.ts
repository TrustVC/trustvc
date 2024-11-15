import { utils } from '@tradetrust-tt/tradetrust';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';
import { ethers } from 'ethers';
import {
  DocumentsToVerify,
  openAttestationVerifiers,
  verificationBuilder,
  VerificationFragment,
  w3cVerifiers,
} from '../verify';

/**
 * Asynchronously verifies a document (OpenAttestation or W3C Verifiable Credential) using a specified Ethereum-compatible JSON-RPC provider.
 *
 * This function builds a verification process that can handle both OpenAttestation documents and W3C Verifiable Credentials.
 * For OpenAttestation, it uses OpenAttestation's verifiers and DID identity proof. For W3C Verifiable Credentials,
 * it verifies signatures, credential status, and issuer identity.
 *
 * The function takes an Ethereum-compatible JSON-RPC provider URL, which allows the user to specify the network
 * (e.g., Ethereum, Polygon) for DID resolution and verification tasks.
 *
 * @param {DocumentsToVerify | SignedVerifiableCredential} document - The document to be verified, either an OpenAttestation document or a W3C Verifiable Credential.
 * @param {string} rpcProviderUrl - The Ethereum-compatible JSON-RPC provider URL (e.g., Infura, Alchemy, Polygon, etc.) to resolve DIDs and verify credentials.
 * @returns {Promise<VerificationFragment[]>} - A promise that resolves to an array of verification fragments,
 *                                              detailing the results of various verification checks such as
 *                                              signature integrity, credential status, issuer identity, etc.
 */
export const verifyDocument = async (
  document: DocumentsToVerify | SignedVerifiableCredential,
  rpcProviderUrl: string, // Ethereum-compatible provider URL as a parameter
): Promise<VerificationFragment[]> => {
  if (utils.isWrappedV2Document(document) || utils.isWrappedV3Document(document)) {
    // Build the verification process using OpenAttestation verifiers and DID identity proof
    const verify = verificationBuilder(openAttestationVerifiers, {
      provider: new ethers.providers.JsonRpcProvider(rpcProviderUrl), // Use user-provided provider URL
    });

    // Perform verification and return the result
    return verify(document);
  } else {
    // Build the verification process using w3c fragments
    const verify = verificationBuilder(w3cVerifiers, {
      provider: new ethers.providers.JsonRpcProvider(rpcProviderUrl), // Use user-provided provider URL
    });

    // Perform verification and return the result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return verify(document as any);
  }
};
