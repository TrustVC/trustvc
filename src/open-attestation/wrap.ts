import { v4 } from '@govtechsg/open-attestation';
const { wrapDocument } = v4;

/**
 * Asynchronously wraps a V4 OpenAttestation document.
 *
 * This function takes a V4 OpenAttestation document and wraps it using the OpenAttestation
 * library's `wrapDocument` function. The function will throw any errors encountered during
 * the wrapping process, as handled by the OpenAttestation library.
 *
 * @param {v4.OpenAttestationDocument} document - The OpenAttestation document to be wrapped.
 * @returns {Promise<v4.WrappedDocument>} - A promise that resolves to the wrapped document.
 * @throws {Error} - Any errors thrown by the `wrapDocument` function will propagate naturally.
 *
 */
export const wrap = async (document: v4.OpenAttestationDocument): Promise<v4.WrappedDocument> => {
  // Directly return the wrapped document from OpenAttestation's v4 `wrapDocument` function
  return wrapDocument(document);
};
