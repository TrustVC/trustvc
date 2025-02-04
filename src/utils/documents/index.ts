import {
  getAssetId,
  getDataV2,
  getIssuerAddress,
  isTransferableAsset,
  isWrappedV2Document,
  isWrappedV3Document,
  OpenAttestationDocument,
  v2,
  v3,
  WrappedDocument,
} from '../../open-attestation';
import { TRANSFERABLE_RECORDS_TYPE } from '../../verify/fragments';
import { TransferableRecordsCredentialStatus } from '../../w3c/credential-status';
import { isSignedDocument, SignedVerifiableCredential } from '../../w3c/vc';
import { CHAIN_ID } from '../supportedChains';

export type WrappedOrSignedOpenAttestationDocument = WrappedDocument<OpenAttestationDocument>;

export const getTransferableRecordsCredentialStatus = (
  document: unknown,
): TransferableRecordsCredentialStatus => {
  return [
    (document as SignedVerifiableCredential)?.credentialStatus,
  ].flat()?.[0] as TransferableRecordsCredentialStatus;
};

export const isTransferableRecord = (
  document: WrappedOrSignedOpenAttestationDocument | SignedVerifiableCredential,
): boolean => {
  let isTransferableAssetVal: boolean = false;
  if (isSignedDocument(document)) {
    const credentialStatus = getTransferableRecordsCredentialStatus(document);
    isTransferableAssetVal = credentialStatus?.type === TRANSFERABLE_RECORDS_TYPE;
  } else {
    isTransferableAssetVal = isTransferableAsset(document);
  }

  return isTransferableAssetVal;
};

export const getTokenRegistryAddress = (
  document: WrappedOrSignedOpenAttestationDocument | SignedVerifiableCredential,
): string | undefined => {
  let issuerAddress: string | string[] = '';
  if (isSignedDocument(document)) {
    const credentialStatus = getTransferableRecordsCredentialStatus(document);
    issuerAddress = credentialStatus?.tokenRegistry;
  } else {
    issuerAddress = getIssuerAddress(document);
  }
  return issuerAddress instanceof Array ? issuerAddress[0] : issuerAddress;
};

export const getTokenId = (
  document: WrappedOrSignedOpenAttestationDocument | SignedVerifiableCredential,
): string => {
  // const tokenId = `0x${utils.getAssetId(certificate)}`;
  // TODO: HAN: Migrate getAssetId to trustvc
  let tokenId: string | undefined = '';
  if (isSignedDocument(document)) {
    const credentialStatus = getTransferableRecordsCredentialStatus(document);
    tokenId = credentialStatus?.tokenId;
  } else {
    tokenId = getAssetId(document);
  }

  return tokenId && `0x${tokenId}`;
};

function processOAChainId(
  document: v2.OpenAttestationDocument | v3.OpenAttestationDocument,
): CHAIN_ID | undefined {
  if (document.network?.chainId) {
    const chainId = parseInt(document.network.chainId, 10);
    if (Object.values(CHAIN_ID).map(Number).includes(chainId)) {
      return chainId as unknown as CHAIN_ID;
    }
    throw new Error(`Chain ID ${chainId} is not supported`);
  }
  console.warn(
    'You are using an older version of Open-Attestation Document, to use the auto network feature, please use an updated version. Otherwise, please make sure that you select the correct network.',
  );
  return undefined;
}

export const getChainId = (
  document: WrappedOrSignedOpenAttestationDocument | SignedVerifiableCredential,
): CHAIN_ID | undefined => {
  if (isSignedDocument(document)) {
    const credentialStatus = getTransferableRecordsCredentialStatus(document);
    return credentialStatus?.tokenNetwork?.chainId as CHAIN_ID;
  } else if (isWrappedV2Document(document)) {
    const documentData = getDataV2(document);
    // Check for DID, ignore chainId when its DID
    const identityProofType = documentData?.issuers?.[0]?.identityProof?.type;
    if (identityProofType === 'DNS-DID' || identityProofType === 'DID') return undefined;
    return processOAChainId(documentData);
  } else if (isWrappedV3Document(document)) {
    // Check for DID, ignore chainId when its DID
    const identityProofType = document?.openAttestationMetadata?.identityProof?.type;
    if (identityProofType === 'DNS-DID' || identityProofType === 'DID') return undefined;
    return processOAChainId(document);
  } else {
    return undefined;
  }
};
