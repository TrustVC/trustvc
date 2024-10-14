import {
  DocumentsToVerify,
  VerificationFragment,
  verificationBuilder,
  openAttestationVerifiers,
  openAttestationDidIdentityProof,
} from '@govtechsg/oa-verify';
import { SignedVerifiableCredential } from '../';
import { ethers } from 'ethers';
import { w3cSignatureIntegrity } from './fragments/document-integrity';
import { w3cCredentialStatus } from './fragments/document-status';
import { w3cIssuerIdentity } from './fragments/issuer-identity';
import { utils } from '@govtechsg/open-attestation';

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
 *
 */
export const verifyDocument = async (
  document: DocumentsToVerify | SignedVerifiableCredential,
  rpcProviderUrl: string, // Ethereum-compatible provider URL as a parameter
): Promise<VerificationFragment[]> => {
  if (
    utils.isWrappedV2Document(document) ||
    utils.isWrappedV3Document(document) ||
    utils.isWrappedV4Document(document)
  ) {
    // Build the verification process using OpenAttestation verifiers and DID identity proof
    const verify = verificationBuilder(
      [...openAttestationVerifiers, openAttestationDidIdentityProof],
      {
        provider: new ethers.providers.JsonRpcProvider(rpcProviderUrl), // Use user-provided provider URL
      },
    );

    // Perform verification and return the result
    return verify(document);
  } else {
    // Build the verification process using w3c fragments
    const verify = verificationBuilder(
      [w3cSignatureIntegrity, w3cCredentialStatus, w3cIssuerIdentity],
      {
        provider: new ethers.providers.JsonRpcProvider(rpcProviderUrl), // Use user-provided provider URL
      },
    );

    // Perform verification and return the result
    return verify(document);
  }
};
