import {
  OpenAttestationDocument,
  utils,
  v2,
  wrapDocument as wrapDocument_v2,
  wrapDocuments as wrapDocuments_v2,
  __unsafe__use__it__at__your__own__risks__wrapDocuments as wrapDocumentsv3,
  __unsafe__use__it__at__your__own__risks__wrapDocument as wrapDocumentv3,
  WrappedDocument,
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
  return wrapDocument_v2(document);
};

/**
 * Asynchronously wraps multiple V2 OpenAttestation documents.
 *
 * Similar to the `wrapDocumentv2` function, this function takes an array of OpenAttestation
 * documents and wraps them using the OpenAttestation library's `wrapDocuments` function. The
 * function will throw any errors encountered during the wrapping process, as handled by the
 * OpenAttestation library.
 *
 * @param {v2.OpenAttestationDocument[]} documents - The OpenAttestation documents to be wrapped.
 * @returns {Promise<v2.WrappedDocument[]>} - A promise that resolves to the wrapped documents.
 * @throws {Error} - Any errors thrown by the `wrapDocuments` function will propagate naturally.
 */
const wrapDocumentsv2 = async <T extends v2.OpenAttestationDocument>(
  documents: T[],
): Promise<v2.WrappedDocument<T>[]> => {
  return wrapDocuments_v2(documents);
};

/**
 * Asynchronously wraps a v2 / v3 OpenAttestation document.
 *
 * This function takes an OpenAttestation document and validates its version before wrapping it
 * using the OpenAttestation library's `wrapDocument` function. The function will throw any errors
 * encountered during the wrapping process, as handled by the OpenAttestation library.
 *
 * @param {OpenAttestationDocument} document - The OpenAttestation document to be wrapped.
 * @returns {Promise<WrappedDocument>} - A promise that resolves to the wrapped document.
 * @throws {Error} - Any errors thrown by the `wrapDocument` function will propagate naturally.
 */
async function wrapDocument<T extends OpenAttestationDocument>(
  document: T,
): Promise<WrappedDocument<T>> {
  if (utils.isRawV2Document(document)) {
    return wrapDocumentv2(document) as Promise<WrappedDocument<T>>;
  } else if (utils.isRawV3Document(document)) {
    return wrapDocumentv3(document) as Promise<WrappedDocument<T>>;
  } else {
    throw new Error('Unsupported document version');
  }
}

/**
 * Asynchronously wraps multiple v2 / v3 OpenAttestation documents.
 *
 * This function takes an array of OpenAttestation documents and validates their versions before wrapping them
 * using the OpenAttestation library's `wrapDocuments` function. The function will throw any errors
 * encountered during the wrapping process, as handled by the OpenAttestation library.
 *
 * @param {OpenAttestationDocument[]} documents - The OpenAttestation documents to be wrapped.
 * @returns {Promise<WrappedDocument[]>} - A promise that resolves to the wrapped documents.
 * @throws {Error} - Any errors thrown by the `wrapDocuments` function will propagate naturally.
 */
async function wrapDocuments<T extends OpenAttestationDocument>(
  documents: T[],
): Promise<WrappedDocument<T>[]> {
  if (documents.every((s) => utils.isRawV2Document(s))) {
    return wrapDocumentsv2(documents) as Promise<WrappedDocument<T>[]>;
  } else if (documents.every((s) => utils.isRawV3Document(s))) {
    return wrapDocumentsv3(documents) as Promise<WrappedDocument<T>[]>;
  } else {
    throw new Error('Unsupported documents version');
  }
}

export {
  wrapDocument,
  wrapDocuments,
  wrapDocumentsv2,
  wrapDocumentsv3,
  wrapDocumentv2,
  wrapDocumentv3,
};
