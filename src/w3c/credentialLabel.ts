import { SignedVerifiableCredential, VerifiablePresentation } from '@trustvc/w3c-vc';

/**
 * The embedded credentials of a presentation, always as an array (`verifiableCredential` may
 * be a single object). Empty for anything that is not a presentation.
 * @param {unknown} document - The presentation to read.
 * @returns {SignedVerifiableCredential[]} Its embedded credentials, in order.
 */
export const getPresentationCredentials = (document: unknown): SignedVerifiableCredential[] => {
  const vc = (document as VerifiablePresentation)?.verifiableCredential;
  if (!vc) return [];
  return Array.isArray(vc) ? vc : [vc];
};

/**
 * A human name for a credential — what a renderer would label its tab or its download.
 *
 * Preference order matches what people actually recognise: the render template's name
 * ("BILL_OF_LADING" -> "BILL OF LADING"), else the credential's own specific type
 * ("VerifiableCredential" is every credential and names nothing), else its position.
 * @param {unknown} credential - The credential to name.
 * @param {number} index - Its zero-based position in the presentation.
 * @returns {string} A human-readable label.
 */
export const getCredentialLabel = (credential: unknown, index: number): string => {
  const cred = credential as {
    renderMethod?: unknown;
    type?: string | string[];
  };
  const templateName = [cred?.renderMethod].flat()?.[0] as { templateName?: unknown } | undefined;
  if (typeof templateName?.templateName === 'string' && templateName.templateName.trim()) {
    return templateName.templateName.replace(/_/g, ' ');
  }
  const types = [cred?.type].flat().filter(Boolean) as string[];
  const specific = types.find((t) => t !== 'VerifiableCredential');
  if (specific) return specific;
  return `Credential ${index + 1}`;
};

/**
 * Names credential(s) by POSITION and LABEL together — `Credential 2 ("BILL OF LADING")`.
 *
 * Each half alone is wrong. Position alone names nothing the user can see, since a renderer
 * labels tabs by template or type. Label alone is ambiguous, because two bills of lading in one
 * presentation produce two identical labels. Together they are unambiguous and findable:
 * credentials render in order, so the position locates it and the label confirms it.
 *
 * Falls back to the position when the document is unavailable or the index is out of range —
 * a plainer phrase rather than a confidently wrong one.
 * @param {number[]} indices - Zero-based positions of the credentials to name.
 * @param {unknown} [document] - The presentation they belong to, for their labels.
 * @returns {string} The credentials named, joined for prose.
 */
export const nameCredentials = (indices: number[], document?: unknown): string => {
  const credentials = document ? getPresentationCredentials(document) : [];
  const names = [...new Set(indices)]
    .sort((a, b) => a - b)
    .map((index) => {
      const position = `Credential ${index + 1}`;
      const credential = credentials[index];
      if (!credential) return position;
      const label = getCredentialLabel(credential, index);
      // getCredentialLabel falls back to this exact string; do not repeat it.
      return label === position ? position : `${position} ("${label}")`;
    });

  if (names.length === 0) return 'A credential';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};
