import {
  v2,
  wrapDocument,
  wrapDocuments,
  __unsafe__use__it__at__your__own__risks__wrapDocuments as wrapDocumentsv3,
  __unsafe__use__it__at__your__own__risks__wrapDocument as wrapDocumentv3,
} from '@tradetrust-tt/tradetrust';

/**
 * Asynchronously wraps a V2 OpenAttestation document.
 *
 * This function takes a OpenAttestation document and wraps it using the OpenAttestation
 * library's `wrapDocument` function. The function will throw any errors encountered during
 * the wrapping process, as handled by the OpenAttestation library.
 *
 * @param {v2.OpenAttestationDocument} document - The OpenAttestation document to be wrapped.
 * @returns {Promise<v2.WrappedDocument>} - A promise that resolves to the wrapped document.
 * @throws {Error} - Any errors thrown by the `wrapDocument` function will propagate naturally.
 */
const wrapDocumentv2 = async <T extends v2.OpenAttestationDocument>(
  document: T,
): Promise<v2.WrappedDocument<T>> => {
  return wrapDocument(document);
};

/**
 * Asynchronously wraps multiple V2 OpenAttestation documents.
 *
 * Similar to the `wrapDocumentv2` function, this function takes an array of OpenAttestation
 * documents and wraps them using the OpenAttestation library's `wrapDocuments` function. The
 * function will throw any errors encountered during the wrapping process, as handled by the
 * OpenAttestation library.
 *
 * @param {v2.OpenAttestationDocument} documents - The OpenAttestation documents to be wrapped.
 * @returns {Promise<v2.WrappedDocument>} - A promise that resolves to the wrapped documents.
 * @throws {Error} - Any errors thrown by the `wrapDocuments` function will propagate naturally.
 */
const wrapDocumentsv2 = async <T extends v2.OpenAttestationDocument>(
  documents: T[],
): Promise<v2.WrappedDocument<T>[]> => {
  return wrapDocuments(documents);
};

export { wrapDocumentsv2, wrapDocumentsv3, wrapDocumentv2, wrapDocumentv3 };
