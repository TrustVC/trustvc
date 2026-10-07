/**
 * Type definitions matching the structure
 */

// Define the structure of an error message
export interface ErrorMessage {
  failureTitle: string;
  failureMessage: string;
  successTitle: string; // Always present in the original, even if empty string
  /**
   * Used instead of `failureMessage` when more than one credential is at fault. Only the
   * presentation messages that name credentials carry it — English cannot say "Credential 1
   * and Credential 3 has expired", and a renderer must not be left to patch verb agreement
   * by hand.
   */
  failureMessagePlural?: string;
}

/**
 * A failure resolved all the way to what a user should be shown — the outcome of
 * `getVerificationError`. `message` is the interpolated, correctly pluralised body; nothing
 * further needs doing to it.
 */
export interface VerificationError {
  /** A key of `errorMessages.TYPES`. */
  type: string;
  title: string;
  message: string;
  /** The `W3CVpCode` behind it, when a presentation fragment reported one. */
  code?: number;
  codeString?: string;
  /** Zero-based positions of the embedded credentials at fault, if any. */
  credentialIndices: number[];
}

// Define the dictionary mapping error types to message objects
export interface MessagesDictionary {
  [key: string]: ErrorMessage;
}

// Define the error types object
export interface ErrorMessageTypes {
  [key: string]: string;
}

// Define the main errorMessages export structure
export interface ErrorMessages {
  MESSAGES: MessagesDictionary;
  TYPES: ErrorMessageTypes;
}
