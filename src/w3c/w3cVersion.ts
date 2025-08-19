/**
 * Utility function for detecting W3C Verifiable Credential document versions
 */

/**
 * Flexible document type that can handle both v1.1 and v2.0 documents
 */
type W3CDocument = {
  '@context': string | string[];
  issuanceDate?: string;
  validFrom?: string;
  [key: string]: unknown;
};

/**
 * Gets the W3C Verifiable Credential document version
 * @param {W3CDocument} document - The W3C Verifiable Credential document to analyze
 * @returns {string} The detected version as a string ('1.1', '2.0', or 'unknown')
 */
export function getW3CDocumentVersion(document: W3CDocument): string {
  const context = Array.isArray(document['@context'])
    ? document['@context']
    : [document['@context']];

  // Primary indicators for version detection
  const hasV1Context = context.includes('https://www.w3.org/2018/credentials/v1');
  const hasV2Context = context.includes('https://www.w3.org/ns/credentials/v2');
  const hasIssuanceDate = 'issuanceDate' in document;
  const hasValidFrom = 'validFrom' in document;

  // V2.0 Detection (highest confidence)
  if (hasV2Context && hasValidFrom && !hasIssuanceDate) {
    return '2.0';
  }

  // V1.1 Detection (highest confidence)
  if (hasV1Context && hasIssuanceDate && !hasValidFrom) {
    return '1.1';
  }

  // Medium confidence detection based on context only
  if (hasV2Context) {
    return '2.0';
  }

  if (hasV1Context) {
    return '1.1';
  }

  // Low confidence detection based on date fields only
  if (hasValidFrom && !hasIssuanceDate) {
    return '2.0';
  }

  if (hasIssuanceDate && !hasValidFrom) {
    return '1.1';
  }

  // Unable to determine version
  return 'unknown';
}
