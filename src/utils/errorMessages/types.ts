/**
 * Type definitions matching the structure in @tradetrust-tt/tradetrust-utils/VerificationErrorMessages.ts
 */

// Define the structure of an error message
export interface ErrorMessage {
  failureTitle: string;
  failureMessage: string;
  successTitle: string; // Always present in the original, even if empty string
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
