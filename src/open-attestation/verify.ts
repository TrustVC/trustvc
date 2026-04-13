import {
  verifySignature,
  utils,
  v2,
  v3,
  SUPPORTED_SIGNING_ALGORITHM,
} from '@tradetrust-tt/tradetrust';
import { emitTelemetry } from '../utils/telemetry';
import { getDataV2 } from './utils';

/**
 * Asynchronously verifies the signature of an OpenAttestation wrapped document.
 *
 * This function checks if the provided document is of type v2, v3, or v4,
 * and then verifies its signature for validity. It returns a boolean indicating
 * whether the signature is valid. If the document type is not recognized,
 * it will return false.
 * @param {v2.WrappedDocument | v3.WrappedDocument} document - The OpenAttestation document to be verified.
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the document's signature is valid,
 *                               and `false` if the document type is not recognized or if the signature is invalid.
 */
export const verifyOASignature = async (
  document: v2.WrappedDocument | v3.WrappedDocument,
): Promise<boolean> => {
  // Check if the document is of a supported version before verifying its signature
  if (utils.isWrappedV2Document(document) || utils.isWrappedV3Document(document)) {
    // Verify the document's signature using OpenAttestation's `verifySignature` function
    const result = verifySignature(document);

    let identityProofType = '';
    if (utils.isWrappedV3Document(document)) {
      identityProofType = document.openAttestationMetadata?.identityProof?.type ?? '';
    } else if (utils.isWrappedV2Document(document)) {
      identityProofType = getDataV2(document)?.issuers?.[0]?.identityProof?.type ?? '';
    }
    emitTelemetry({
      action_type: 'verification',
      document_format: 'oa',
      cryptosuite: SUPPORTED_SIGNING_ALGORITHM.Secp256k1VerificationKey2018,
      did_method: identityProofType || 'unknown',
    }).catch(() => {});

    return result;
  } else {
    // Return false if the document type is not recognized
    return false;
  }
};
