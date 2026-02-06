import {
  isValid,
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
import { ecdsaW3CSignatureIntegrity } from './fragments/document-integrity/ecdsaW3CSignatureIntegrity';
import { credentialStatusTransferableRecordVerifier } from './fragments/document-status/transferableRecords/transferableRecordVerifier';
import { w3cCredentialStatus } from './fragments/document-status/w3cCredentialStatus';
import { w3cIssuerIdentity } from './fragments/issuer-identity/w3cIssuerIdentity';
import { w3cEmptyCredentialStatus } from './fragments';
import { bbs2023W3CSignatureIntegrity } from './fragments/document-integrity/bbs2023W3CSignatureIntegrity';
import { registryVerifier } from '../open-cert';

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
    openAttestationDnsDidIdentityProof,
    openAttestationDnsTxtIdentityProof,
    w3cIssuerIdentity,
  },
};

const openAttestationVerifiers = [...originalOpenAttestationVerifiers, registryVerifier];

const w3cVerifiers: Verifier<VerificationFragment>[] = [
  w3cSignatureIntegrity,
  ecdsaW3CSignatureIntegrity,
  bbs2023W3CSignatureIntegrity,
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
