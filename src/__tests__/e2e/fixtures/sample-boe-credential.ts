import { DocumentBuilder } from '../../../core/documentBuilder';
import { CHAIN_ID } from '../../../utils';
import { PrivateKeyPair, VerificationType } from '@trustvc/w3c-issuer';

/** Same did:web issuer as W3C transferable-record fixtures — resolves via trustvc.github.io DNS. */
export const SAMPLE_BOE_ISSUER = 'did:web:trustvc.github.io:did:1' as const;

export const SAMPLE_BOE_VERIFICATION_METHOD = `${SAMPLE_BOE_ISSUER}#multikey-1` as const;

/**
 * ECDSA-SD-2023 test key for did:web:trustvc.github.io:did:1.
 * Matches documentBuilder.test.ts / W3C fixture signing material.
 */
export const SAMPLE_BOE_SIGNING_KEY: PrivateKeyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  id: SAMPLE_BOE_VERIFICATION_METHOD,
  type: VerificationType.Multikey,
  controller: SAMPLE_BOE_ISSUER,
  publicKeyMultibase: 'zDnaemDNwi4G5eTzGfRooFFu5Kns3be6yfyVNtiaMhWkZbwtc',
  secretKeyMultibase: 'z42tmUXTVn3n9BihE6NhdMpvVBTnFTgmb6fw18o5Ud6puhRW',
};

/** Bill of Exchange credential subject aligned with https://trustvc.io/context/bill-of-exchange.json */
export const SAMPLE_BOE_CREDENTIAL_SUBJECT = {
  electronicDocumentIdentifier: 'urn:uuid:e6f4b2a1-9c3d-4e8f-a7b0-1d2e3f4a5b6c',
  referenceNumber: 'BOE-E2E-00147',
  amountInFigures: '100000.00',
  amountInWords: 'One hundred thousand United States Dollars only',
  currencyCode: 'USD',
  blDate: '2026-06-28',
  placeOfIssue: 'Singapore',
  dateOfIssue: '2026-07-06',
  tenor: 'At 90 days sight',
  payee: 'Meridian Commodities Pte Ltd',
  drawnUnder:
    'Documentary Credit No. LC-E2E-2026-88341 / Invoice No. INV-E2E-2026-0456 / B/L No. BL-E2E-2026-0781',
  drawnUnderDate: '2026-06-15',
  issuedBy: 'DBS Bank Ltd',
  drawee: {
    name: 'Fairview Industries Inc.',
    address: '1201 Market Street, Suite 900, Wilmington, DE 19801, USA',
    authorisedSignatoryName: 'James R. Carter',
    signature: '',
  },
  drawer: {
    name: 'Meridian Commodities Pte Ltd',
    address: '8 Marina Boulevard, #24-01, Singapore 018981',
    authorisedSignatoryName: 'Wei Ling Tan',
    signature: '',
  },
};

export const SAMPLE_BOE_CONTEXT = 'https://trustvc.io/context/bill-of-exchange.json';

export const SAMPLE_BOE_ENCRYPTION_ID = 'e2e-boe-encryption-key';

// DocumentBuilder.obligationCredentialStatus() config for Hardhat local network.
export const createSampleBoeCredentialStatusConfig = (obligationRegistry: string) => ({
  chain: 'local',
  chainId: Number(CHAIN_ID.local),
  obligationRegistry,
  rpcProviderUrl: 'http://127.0.0.1:8545',
});

// Unsigned W3C VC shell — use with DocumentBuilder before sign.
export const createSampleBoeDocumentShell = () => ({
  '@context': ['https://www.w3.org/ns/credentials/v2', SAMPLE_BOE_CONTEXT],
  type: ['VerifiableCredential'],
  issuer: SAMPLE_BOE_ISSUER,
  credentialSubject: SAMPLE_BOE_CREDENTIAL_SUBJECT,
});

// Pre-configured DocumentBuilder for BoE e2e / verify tests.
export const createSampleBoeDocumentBuilder = (obligationRegistry?: string) => {
  const builder = new DocumentBuilder({
    '@context': SAMPLE_BOE_CONTEXT,
  })
    .credentialSubject(SAMPLE_BOE_CREDENTIAL_SUBJECT)
    .renderMethod({
      type: 'EMBEDDED_RENDERER',
      templateName: 'BILL_OF_EXCHANGE',
      id: 'https://generic-templates.tradetrust.io',
    })
    .expirationDate('2029-12-03T12:19:52Z');

  if (obligationRegistry) {
    builder.obligationCredentialStatus(createSampleBoeCredentialStatusConfig(obligationRegistry));
  }

  return builder;
};

// Sign a BoE VC with the shared did:web test key (passes DOCUMENT_INTEGRITY / DNS-DID checks).
export const signSampleBoeDocument = async (obligationRegistry?: string) => {
  const builder = createSampleBoeDocumentBuilder(obligationRegistry);
  return builder.sign(SAMPLE_BOE_SIGNING_KEY, 'ecdsa-sd-2023');
};

// Default on-chain tx options for obligation e2e on Hardhat.
export const createSampleBoeTxOptions = (encryptionId = SAMPLE_BOE_ENCRYPTION_ID) => ({
  chainId: CHAIN_ID.local,
  id: encryptionId,
});
