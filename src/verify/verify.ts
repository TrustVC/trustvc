import {
  isValid,
  openAttestationDidIdentityProof,
  openAttestationDidSignedDocumentStatus,
  openAttestationDnsDidIdentityProof,
  openAttestationDnsTxtIdentityProof,
  openAttestationEthereumDocumentStoreStatus,
  openAttestationEthereumTokenRegistryStatus,
  openAttestationHash,
  openAttestationVerifiers as originalOpenAttestationVerifiers,
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
import { credentialStatusTransferableRecordVerifier } from './fragments/document-status/transferableRecords/transferableRecordVerifier';
import { w3cCredentialStatus } from './fragments/document-status/w3cCredentialStatus';
import { w3cIssuerIdentity } from './fragments/issuer-identity/w3cIssuerIdentity';
import { w3cEmptyCredentialStatus } from './fragments';

const verifiers = {
  documentIntegrity: {
    openAttestationHash,
    w3cSignatureIntegrity,
  },
  documentStatus: {
    openAttestationDidSignedDocumentStatus,
    openAttestationEthereumDocumentStoreStatus,
    openAttestationEthereumTokenRegistryStatus,
    w3cCredentialStatus,
    w3cEmptyCredentialStatus,
    credentialStatusTransferableRecordVerifier,
  },
  issuerIdentity: {
    openAttestationDidIdentityProof,
    openAttestationDnsDidIdentityProof,
    openAttestationDnsTxtIdentityProof,
    w3cIssuerIdentity,
  },
};

const openAttestationVerifiers = [
  ...originalOpenAttestationVerifiers,
  openAttestationDidIdentityProof,
];

const w3cVerifiers: Verifier<VerificationFragment>[] = [
  w3cSignatureIntegrity,
  w3cCredentialStatus,
  credentialStatusTransferableRecordVerifier,
  w3cEmptyCredentialStatus,
  w3cIssuerIdentity,
];

export {
  isValid,
  verifiers,
  openAttestationVerifiers,
  verificationBuilder,
  verify,
  w3cVerifiers,
  getIdentifier,
  createResolver,
  utils,
  openAttestationDidIdentityProof,
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
