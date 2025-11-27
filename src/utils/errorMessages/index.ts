import * as CONSTANTS from './VerificationErrorMessages';

import { ErrorMessages } from './types';

// Re-export with proper typing
export const errorMessages: ErrorMessages = CONSTANTS;

// Export types to be used by consumers
export * from './types';
