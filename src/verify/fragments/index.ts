import {
  openAttestationDidSignedDocumentStatus,
  openAttestationDnsDidIdentityProof,
  openAttestationDnsTxtIdentityProof,
  openAttestationEthereumDocumentStoreStatus,
  openAttestationEthereumTokenRegistryStatus,
  openAttestationHash,
} from '@tradetrust-tt/tt-verify';
import { w3cSignatureIntegrity } from './document-integrity/w3cSignatureIntegrity';
import { ecdsaW3CSignatureIntegrity } from './document-integrity/ecdsaW3CSignatureIntegrity';
import {
  credentialStatusTransferableRecordVerifier,
  TRANSFERABLE_RECORDS_TYPE,
} from './document-status/transferableRecords/transferableRecordVerifier';
import { w3cCredentialStatus } from './document-status/w3cCredentialStatus';
import { w3cIssuerIdentity } from './issuer-identity/w3cIssuerIdentity';
import { w3cEmptyCredentialStatus } from './document-status/w3cEmptyCredentialStatus';

export {
  // The codes are the contract a consumer keys copy off, so the enum has to be reachable —
  // `reason.codeString` alone would leave callers comparing bare strings.
  W3CVpCode,
  w3cVpCredentialStatus,
  w3cVpIssuerIdentity,
  w3cVpSignatureIntegrity,
} from './presentation/w3cVpVerifier';

export {
  TRANSFERABLE_RECORDS_TYPE,
  credentialStatusTransferableRecordVerifier,
  openAttestationDidSignedDocumentStatus,
  openAttestationDnsDidIdentityProof,
  openAttestationDnsTxtIdentityProof,
  openAttestationEthereumDocumentStoreStatus,
  openAttestationEthereumTokenRegistryStatus,
  openAttestationHash,
  w3cEmptyCredentialStatus,
  w3cCredentialStatus,
  w3cIssuerIdentity,
  w3cSignatureIntegrity,
  ecdsaW3CSignatureIntegrity,
};

export {
  credentialStatusObligationRecordVerifier,
  OBLIGATION_RECORDS_TYPE,
} from './document-status/obligationRecords/obligationRecordVerifier';
