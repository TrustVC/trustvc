import { ErrorMessageTypes, MessagesDictionary } from './types';

export const TYPES: ErrorMessageTypes = {
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

  // ---------------------------------------------------------------------------
  // Verifiable Presentations.
  //
  // The types above were written for OpenAttestation, where a document has ONE issuer and ONE
  // status, so "the document is invalid" was a complete answer. A presentation is a wrapper the
  // HOLDER signed around credentials that OTHER parties issued, which splits nearly every
  // failure in two: whether the envelope or a credential inside it is at fault decides who the
  // user has to go and talk to. Collapsing them onto the generic types (as
  // `errorMessageHandling` did, mapping every VP failure to HASH) tells people a presentation
  // was tampered with when it was merely out of date, and sends them to the wrong party.
  //
  // Messages naming a credential carry a `{credentials}` placeholder and a plural variant; see
  // `renderErrorMessage`.
  // ---------------------------------------------------------------------------

  PRESENTATION_UNSIGNED: 'PRESENTATION_UNSIGNED',
  PRESENTATION_PROOF_INCOMPLETE: 'PRESENTATION_PROOF_INCOMPLETE',
  PRESENTATION_TAMPERED: 'PRESENTATION_TAMPERED',
  PRESENTATION_HOLDER_MISMATCH: 'PRESENTATION_HOLDER_MISMATCH',
  PRESENTATION_EXPIRED: 'PRESENTATION_EXPIRED',
  PRESENTATION_DATE_INVALID: 'PRESENTATION_DATE_INVALID',
  PRESENTATION_EMPTY: 'PRESENTATION_EMPTY',
  PRESENTATION_NOT_YET_VALID: 'PRESENTATION_NOT_YET_VALID',
  PRESENTATION_UNVERIFIABLE: 'PRESENTATION_UNVERIFIABLE',
  CREDENTIAL_TAMPERED: 'CREDENTIAL_TAMPERED',
  CREDENTIAL_NO_HOLDER: 'CREDENTIAL_NO_HOLDER',
  CREDENTIAL_EXPIRED: 'CREDENTIAL_EXPIRED',
  CREDENTIAL_NOT_YET_VALID: 'CREDENTIAL_NOT_YET_VALID',
  CREDENTIAL_DATE_INVALID: 'CREDENTIAL_DATE_INVALID',
  CREDENTIAL_REVOKED: 'CREDENTIAL_REVOKED',
  CREDENTIAL_SUSPENDED: 'CREDENTIAL_SUSPENDED',
  CREDENTIAL_STATUS_UNREACHABLE: 'CREDENTIAL_STATUS_UNREACHABLE',
  CREDENTIAL_STATUS_UNSUPPORTED: 'CREDENTIAL_STATUS_UNSUPPORTED',
  CREDENTIAL_ISSUER_UNRESOLVABLE: 'CREDENTIAL_ISSUER_UNRESOLVABLE',
};

export const MESSAGES: MessagesDictionary = {
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

  // --- Verifiable Presentations -------------------------------------------------------------
  // The ENVELOPE. These are the holder's to fix: they presented it, they can present again.
  [TYPES.PRESENTATION_UNSIGNED]: {
    failureTitle: 'Presentation not signed',
    successTitle: 'Presentation is signed by its holder',
    failureMessage:
      'This presentation is not signed, so the presenter cannot prove the credentials are theirs. Please ask the holder to present them again.',
  },
  // Distinct from the above only in its body: a proof IS present, it just carries nothing to
  // bind to. Same title, because to the reader the outcome is the same — nothing is signed.
  [TYPES.PRESENTATION_PROOF_INCOMPLETE]: {
    failureTitle: 'Presentation not signed',
    successTitle: '',
    failureMessage:
      'This presentation carries no usable signature, so the presenter cannot prove the credentials are theirs. Please ask the holder to present them again.',
  },
  [TYPES.PRESENTATION_TAMPERED]: {
    failureTitle: 'Presentation has been tampered with',
    successTitle: 'Presentation has not been tampered with',
    failureMessage:
      "The presenter's signature does not match the contents of this presentation. Please ask the holder to present the credentials again.",
  },
  [TYPES.PRESENTATION_HOLDER_MISMATCH]: {
    failureTitle: 'Presentation not signed by the holder',
    successTitle: 'Presentation was signed by the holder it names',
    failureMessage:
      'This presentation was signed by someone other than the holder it names, so the presenter cannot prove the credentials are theirs. Please ask the holder to present them again.',
  },
  [TYPES.PRESENTATION_EXPIRED]: {
    failureTitle: 'Presentation expired',
    successTitle: 'Presentation is within its validity period',
    failureMessage:
      'This presentation has expired and can no longer be used. Please ask the holder to present the credentials again.',
  },
  [TYPES.PRESENTATION_DATE_INVALID]: {
    failureTitle: 'Presentation is invalid',
    successTitle: '',
    failureMessage:
      'This presentation has an unreadable expiry date, so we cannot tell whether it is still usable. Please ask the holder to present the credentials again.',
  },
  [TYPES.PRESENTATION_EMPTY]: {
    failureTitle: 'Presentation is empty',
    successTitle: '',
    failureMessage:
      'This presentation does not contain any credentials to verify. Please ask the holder to present them again.',
  },
  [TYPES.PRESENTATION_NOT_YET_VALID]: {
    failureTitle: 'Presentation not yet valid',
    successTitle: '',
    failureMessage:
      'This presentation does not take effect yet. Please check with the issuing authority before presenting it again.',
  },
  // The true fallback. Without it an unrecognised presentation failure reaches the
  // OpenAttestation-shaped switch, which answers HASH — "this document has been tampered
  // with" — on the strength of a failure we have just admitted we do not understand.
  [TYPES.PRESENTATION_UNVERIFIABLE]: {
    failureTitle: 'Presentation could not be verified',
    successTitle: '',
    failureMessage:
      'We could not verify this presentation. Please try again later. If this keeps happening, contact us using the feedback link below.',
  },

  // An EMBEDDED CREDENTIAL. Mostly the issuer's to fix — presenting again cannot help, so the
  // copy must never suggest it.
  [TYPES.CREDENTIAL_TAMPERED]: {
    failureTitle: 'Credential has been tampered with',
    successTitle: '',
    failureMessage:
      'The contents of {credentials} do not match its signature. Please ask the issuing authority for a fresh copy.',
    failureMessagePlural:
      'The contents of {credentials} do not match their signatures. Please ask the issuing authority for fresh copies.',
  },
  // Correctly signed, correctly presented — but this credential is about somebody else.
  //
  // These titles name the CREDENTIAL, not the presentation. The binding check only reaches the
  // credential-subject step after confirming signer == holder, so in both of these cases the
  // presentation IS correctly signed by the holder it names: a headline saying otherwise would
  // deny something true and contradict its own body. The remedies differ from each other too —
  // that credential's real holder presents it, versus its issuer reissues it.
  [TYPES.CREDENTIAL_NO_HOLDER]: {
    failureTitle: 'Presentation not signed by the holder',
    successTitle: '',
    failureMessage:
      '{credentials} does not say who it was issued to, so we cannot confirm the presenter holds it. Please ask the issuing authority to reissue it.',
    failureMessagePlural:
      '{credentials} do not say who they were issued to, so we cannot confirm the presenter holds them. Please ask the issuing authority to reissue them.',
  },
  [TYPES.CREDENTIAL_EXPIRED]: {
    failureTitle: 'Credential expired',
    successTitle: '',
    failureMessage:
      '{credentials} has expired. Please ask the issuing authority to reissue it. Presenting it again will not help.',
    failureMessagePlural:
      '{credentials} have expired. Please ask the issuing authority to reissue them. Presenting them again will not help.',
  },
  [TYPES.CREDENTIAL_NOT_YET_VALID]: {
    failureTitle: 'Credential not yet valid',
    successTitle: '',
    failureMessage:
      '{credentials} does not take effect yet. Please check with the issuing authority before presenting it again.',
    failureMessagePlural:
      '{credentials} do not take effect yet. Please check with the issuing authority before presenting them again.',
  },
  [TYPES.CREDENTIAL_DATE_INVALID]: {
    failureTitle: 'Credential is invalid',
    successTitle: '',
    failureMessage:
      '{credentials} has an unreadable date, so we cannot tell whether it is still valid. Please ask the issuing authority to reissue it.',
    failureMessagePlural:
      '{credentials} have unreadable dates, so we cannot tell whether they are still valid. Please ask the issuing authority to reissue them.',
  },
  [TYPES.CREDENTIAL_REVOKED]: {
    failureTitle: 'Credential revoked',
    successTitle: '',
    failureMessage:
      '{credentials} has been revoked by the issuing authority. Please contact them for more details.',
    failureMessagePlural:
      '{credentials} have been revoked by the issuing authority. Please contact them for more details.',
  },
  [TYPES.CREDENTIAL_SUSPENDED]: {
    failureTitle: 'Credential suspended',
    successTitle: '',
    failureMessage:
      '{credentials} has been suspended by the issuing authority. Please contact them for more details.',
    failureMessagePlural:
      '{credentials} have been suspended by the issuing authority. Please contact them for more details.',
  },
  // Checks we could not complete. Same title, different remedies: one is worth retrying, the
  // other never will be.
  //
  // Deliberately says STATUS, not "revocation". A credentialStatus entry's purpose is either
  // "revocation" or "suspension", so naming revocation is wrong half the time — and it sends a
  // reader looking for a revocation list that was never involved. In the UNSUPPORTED case the
  // entry's type is the thing we failed to recognise, so its purpose may be absent altogether
  // and there is nothing to name even if we wanted to.
  [TYPES.CREDENTIAL_STATUS_UNREACHABLE]: {
    failureTitle: 'Unable to check credential status',
    successTitle: '',
    failureMessage:
      'We could not reach the status list for {credentials}, so we cannot confirm it is still valid. Please try again later.',
    failureMessagePlural:
      'We could not reach the status lists for {credentials}, so we cannot confirm they are still valid. Please try again later.',
  },
  [TYPES.CREDENTIAL_STATUS_UNSUPPORTED]: {
    failureTitle: 'Unable to check credential status',
    successTitle: '',
    failureMessage:
      '{credentials} records its status in a way we do not support, so we cannot confirm it is still valid. Please contact the issuing authority.',
    failureMessagePlural:
      '{credentials} record their status in a way we do not support, so we cannot confirm they are still valid. Please contact the issuing authority.',
  },
  // A missing issuer and an unresolvable one are merged: "we could not identify who issued it"
  // is true of both, and the remedy is the same.
  [TYPES.CREDENTIAL_ISSUER_UNRESOLVABLE]: {
    failureTitle: 'Credential issuer cannot be identified',
    successTitle: '',
    failureMessage:
      'We could not identify who issued {credentials}, so it cannot be verified. Please contact the issuing authority.',
    failureMessagePlural:
      'We could not identify who issued {credentials}, so they cannot be verified. Please contact the issuing authority.',
  },
};
