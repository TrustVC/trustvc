import { VerificationFragment } from '@tradetrust-tt/tt-verify';
import { nameCredentials } from '../../w3c/credentialLabel';
import { MESSAGES, TYPES } from '../errorMessages/VerificationErrorMessages';
import { ErrorMessage, VerificationError } from '../errorMessages/types';
import { getPresentationFailure } from './presentationError';

/**
 * Fills a message template: `{credentials}` becomes the named credentials, and the plural
 * variant is chosen when more than one is at fault.
 *
 * Exported because a consumer showing its own copy for a type still needs the same
 * substitution, and hand-rolled interpolation is how verb agreement goes wrong.
 * @param {ErrorMessage} entry - The catalogue entry to render.
 * @param {number[]} [credentialIndices] - Zero-based positions of the credentials at fault.
 * @param {unknown} [document] - The verified document, so those credentials can be labelled.
 * @returns {string} The finished message.
 */
export const renderErrorMessage = (
  entry: Pick<ErrorMessage, 'failureMessage' | 'failureMessagePlural'>,
  credentialIndices: number[] = [],
  document?: unknown,
): string => {
  const plural = credentialIndices.length > 1;
  const template =
    plural && entry.failureMessagePlural ? entry.failureMessagePlural : entry.failureMessage;
  if (!template.includes('{credentials}')) return template;
  return template.split('{credentials}').join(nameCredentials(credentialIndices, document));
};

/**
 * Resolves fragments to user-facing copy, deferring to `fallbackTypes` for anything that is not
 * a presentation failure. `errorMessageHandling` is that fallback, injected by `index.ts`
 * rather than imported here — importing it would close a cycle, since this module is
 * re-exported from there. Consumers want `getVerificationError`.
 * @param {VerificationFragment[]} fragments - The fragments returned by verification.
 * @param {unknown} document - The verified document, for naming credentials.
 * @param {Function} fallbackTypes - Maps non-presentation fragments to error type keys.
 * @returns {VerificationError | undefined} What to show the user, or undefined when valid.
 */
export const resolveVerificationError = (
  fragments: VerificationFragment[],
  document: unknown,
  fallbackTypes: (frags: VerificationFragment[]) => string[],
): VerificationError | undefined => {
  const presentation = getPresentationFailure(fragments);
  if (presentation) {
    const entry = MESSAGES[presentation.type] ?? MESSAGES[TYPES.VERIFICATION_ERROR];
    return {
      type: presentation.type,
      title: entry.failureTitle,
      message: renderErrorMessage(entry, presentation.credentialIndices, document),
      code: presentation.code,
      codeString: presentation.codeString,
      credentialIndices: presentation.credentialIndices,
    };
  }

  const types = fallbackTypes(fragments);
  if (types.length === 0) return undefined;
  const type = types[0];
  const entry = MESSAGES[type] ?? MESSAGES[TYPES.VERIFICATION_ERROR];
  return {
    type,
    title: entry.failureTitle,
    message: renderErrorMessage(entry),
    credentialIndices: [],
  };
};
