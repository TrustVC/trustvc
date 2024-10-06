import {
  DocumentsToVerify,
  VerificationFragment,
  verificationBuilder,
  openAttestationVerifiers,
  openAttestationDidIdentityProof,
} from '@govtechsg/oa-verify';
import { ethers } from 'ethers';

/**
 * Asynchronously verifies an OpenAttestation document using a specified Ethereum-compatible JSON-RPC provider.
 *
 * This function builds a verification process using OpenAttestation's verifiers and DID identity proof,
 * and verifies the provided document. The RPC provider URL is passed in as a parameter, allowing
 * flexibility for users to specify their own network (e.g., Ethereum, Polygon).
 *
 * @param {DocumentsToVerify} document - The OpenAttestation document to be verified.
 * @param {string} rpcProviderUrl - The Ethereum-compatible JSON-RPC provider URL (e.g., Infura, Alchemy, Polygon, etc.).
 * @returns {Promise<VerificationFragment[]>} - A promise that resolves to an array of verification fragments,
 *                                              detailing the results of various verification checks.
 */
export const verifyDocument = async (
  document: DocumentsToVerify,
  rpcProviderUrl: string, // Ethereum-compatible provider URL as a parameter
): Promise<VerificationFragment[]> => {
  // Build the verification process using OpenAttestation verifiers and DID identity proof
  const verify = verificationBuilder(
    [...openAttestationVerifiers, openAttestationDidIdentityProof],
    {
      provider: new ethers.providers.JsonRpcProvider(rpcProviderUrl), // Use user-provided provider URL
    },
  );

  // Perform verification and return the result
  return verify(document);
};
