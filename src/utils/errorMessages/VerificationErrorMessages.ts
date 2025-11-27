export const TYPES = {
  REVOKED: 'REVOKED',
  SUSPENDED: 'SUSPENDED',
  ISSUED: 'ISSUED',
  HASH: 'HASH',
  IDENTITY: 'IDENTITY',
  INVALID: 'INVALID',
  ADDRESS_INVALID: 'ADDRESS_INVALID',
  NETWORK_INVALID: 'NETWORK_INVALID',
  NETWORK_MISMATCH_MAINNET: 'NETWORK_MISMATCH_MAINNET',
  NETWORK_MISMATCH_TESTNET: 'NETWORK_MISMATCH_TESTNET',
  CONTRACT_NOT_FOUND: 'CONTRACT_NOT_FOUND',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',
  SERVER_ERROR: 'SERVER_ERROR',
  ETHERS_UNHANDLED_ERROR: 'ETHERS_UNHANDLED_ERROR',
  CLIENT_NETWORK_ERROR: 'CLIENT_NETWORK_ERROR',
  VERIFICATION_ERROR: 'VERIFICATION_ERROR',
};

export const MESSAGES = {
  [TYPES.REVOKED]: {
    failureTitle: 'Document revoked',
    successTitle: 'Document has not been revoked',
    failureMessage:
      'This document has been revoked by the issuing authority. Please contact them for more details.',
  },
  [TYPES.SUSPENDED]: {
    failureTitle: 'Document suspended',
    successTitle: 'Document has not been suspended',
    failureMessage:
      'This document has been suspended by the issuing authority. Please contact them for more details.',
  },
  [TYPES.ISSUED]: {
    failureTitle: 'Document not issued',
    successTitle: 'Document has been issued',
    failureMessage:
      'This document cannot be found. Please contact your issuing authority for help or issue the document before trying again.',
  },
  [TYPES.HASH]: {
    failureTitle: 'Document has been tampered with',
    successTitle: 'Document has not been tampered with',
    failureMessage: 'The contents of this document are inaccurate and have been tampered with.',
  },
  [TYPES.IDENTITY]: {
    failureTitle: 'Document issuer identity is invalid',
    successTitle: 'Document issuer has been identified',
    failureMessage: 'This document was issued by an invalid issuer.',
  },
  [TYPES.INVALID]: {
    failureTitle: 'Document is invalid',
    successTitle: '',
    failureMessage: 'This document is not valid. Please upload a valid document.',
  },
  [TYPES.ADDRESS_INVALID]: {
    failureTitle: 'Document store or Token registry address is invalid',
    successTitle: '',
    failureMessage:
      'Please inform the issuer of this document that they have misconfigured their Document store or Token registry address.',
  },
  [TYPES.NETWORK_INVALID]: {
    failureTitle: "Document's network field is invalid",
    successTitle: '',
    failureMessage:
      'This document has an invalid network field. Please contact your issuing authority for help or re-issue the document with a valid network field before trying again.',
  },
  [TYPES.NETWORK_MISMATCH_MAINNET]: {
    failureTitle: 'Document network mismatch on mainnet',
    successTitle: '',
    failureMessage:
      'This document was issued on the testnet, but you are currently using the mainnet environment. Please switch to the testnet environment to view this document correctly, or contact the issuing authority if you believe this is incorrect.',
  },
  [TYPES.NETWORK_MISMATCH_TESTNET]: {
    failureTitle: 'Document network mismatch on testnet',
    successTitle: '',
    failureMessage:
      'This document was issued on the mainnet, but you are currently using the testnet environment. Please switch to the mainnet environment to view this document correctly, or contact the issuing authority if you believe this is incorrect.',
  },
  [TYPES.CONTRACT_NOT_FOUND]: {
    failureTitle: 'Document store or Token registry address cannot be found',
    successTitle: '',
    failureMessage:
      'Please inform the issuer of this document that they have misconfigured their Document store or Token registry address.',
  },
  [TYPES.INVALID_ARGUMENT]: {
    failureTitle: "Document's merkle root is invalid",
    successTitle: '',
    failureMessage:
      'Please inform the issuer of this document that the merkle root is invalid, or it may have been tampered with.',
  },
  [TYPES.SERVER_ERROR]: {
    failureTitle: 'Unable to connect to the blockchain network',
    successTitle: '',
    failureMessage:
      'We are unable to connect to the blockchain network, please try again later. If this issue persists, contact us using the feedback link below.',
  },
  [TYPES.ETHERS_UNHANDLED_ERROR]: {
    failureTitle: "Whoops! It's not you, it's us",
    successTitle: '',
    failureMessage:
      'We encountered an internal error and cannot determine the cause, please try again later. If this issue persists, contact us using the feedback link below.',
  },
  [TYPES.CLIENT_NETWORK_ERROR]: {
    failureTitle: 'Whoops! There seems to be an error verifying the document',
    successTitle: '',
    failureMessage: 'Please check your network and try again',
  },
  [TYPES.VERIFICATION_ERROR]: {
    failureTitle: 'Document Verification Failed',
    successTitle: '',
    failureMessage: 'The document could not be verified at the moment. Please try again.',
  },
};
