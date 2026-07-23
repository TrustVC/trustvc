import {
  isValid,
  verificationBuilder,
  verify,
  getIdentifier,
  createResolver,
  utils,
} from '@tradetrust-tt/tt-verify';
import type {
  DocumentsToVerify,
  ErrorVerificationFragment,
  InvalidVerificationFragment,
  ProviderDetails,
  providerType as ProviderType,
  SkippedVerificationFragment,
  ValidVerificationFragment,
  VerificationBuilderOptions,
  VerificationFragment,
  VerificationFragmentStatus,
  VerificationFragmentType,
  Verifier,
  VerifierOptions,
  VerificationFragmentWithData,
} from '@tradetrust-tt/tt-verify/dist/types/src/types/core';
import { w3cSignatureIntegrity } from './fragments/document-integrity/w3cSignatureIntegrity';
import { ecdsaW3CSignatureIntegrity } from './fragments/document-integrity/ecdsaW3CSignatureIntegrity';
import { bbs2023W3CSignatureIntegrity } from './fragments/document-integrity/bbs2023W3CSignatureIntegrity';
import { credentialStatusObligationRecordVerifier } from './fragments/document-status/obligationRecords/obligationRecordVerifier';
import { w3cCredentialStatus } from './fragments/document-status/w3cCredentialStatus';
import { w3cEmptyCredentialStatus } from './fragments/document-status/w3cEmptyCredentialStatus';
import { w3cIssuerIdentity } from './fragments/issuer-identity/w3cIssuerIdentity';

/**
 * Verifier catalog for the obligation / BoE verify pipeline.
 * Classic ETR TransferableRecords fragment is intentionally omitted — BoE status
 * fragment SKIPPED for ETR docs instead.
 */
const verifiers = {
  documentIntegrity: {
    w3cSignatureIntegrity,
    ecdsaW3CSignatureIntegrity,
    bbs2023W3CSignatureIntegrity,
  },
  documentStatus: {
    w3cCredentialStatus,
    w3cEmptyCredentialStatus,
    credentialStatusObligationRecordVerifier,
  },
  issuerIdentity: {
    w3cIssuerIdentity,
  },
};

/**
 * W3C fragment list for obligation / BoE document verification.
 * Valid BoE → ObligationRecords VALID; classic ETR → ObligationRecords SKIPPED;
 * invalid obligation (e.g. not minted) → ObligationRecords INVALID.
 */
const obligationW3cVerifiers: Verifier<VerificationFragment>[] = [
  w3cSignatureIntegrity,
  ecdsaW3CSignatureIntegrity,
  bbs2023W3CSignatureIntegrity,
  w3cCredentialStatus,
  credentialStatusObligationRecordVerifier,
  w3cEmptyCredentialStatus,
  w3cIssuerIdentity,
];

export {
  isValid,
  verifiers,
  verificationBuilder,
  verify,
  obligationW3cVerifiers,
  getIdentifier,
  createResolver,
  utils,
};

export type {
  DocumentsToVerify,
  ErrorVerificationFragment,
  InvalidVerificationFragment,
  ProviderDetails,
  ProviderType,
  SkippedVerificationFragment,
  ValidVerificationFragment,
  VerificationBuilderOptions,
  VerificationFragment,
  VerificationFragmentStatus,
  VerificationFragmentWithData,
  VerificationFragmentType,
  VerifierOptions,
  Verifier,
};
