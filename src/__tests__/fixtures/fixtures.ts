import { SchemaId, v2, v3 } from '@tradetrust-tt/tradetrust';
import { SignedVerifiableCredential } from '@trustvc/w3c-vc';

const ISSUER_ID = 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90' as const;
export const SAMPLE_SIGNING_KEYS = {
  public: `${ISSUER_ID}#controller`,
  private: '0xcd27dc84c82c5814e7edac518edd5f263e7db7f25adb7a1afe13996a95583cf2',
} as const;

/* RAW VERIFIED */
export const RAW_DOCUMENT_DNS_DID_V3 = freezeObject({
  version: 'https://schema.openattestation.com/3.0/schema.json',
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
    'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
  ],
  credentialSubject: {
    id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    shipper: {
      address: {
        street: '456 Orchard Road',
        country: 'SG',
      },
    },
    consignee: {
      name: 'TradeTrust',
    },
    notifyParty: {
      name: 'TrustVC',
    },
    packages: [
      {
        description: '1 Pallet',
        weight: '1',
        measurement: 'KG',
      },
    ],
    blNumber: '20240315',
    scac: '20240315',
  },
  openAttestationMetadata: {
    template: {
      type: 'EMBEDDED_RENDERER',
      name: 'BILL_OF_LADING',
      url: 'https://generic-templates.tradetrust.io',
    },
    proof: {
      type: 'OpenAttestationProofMethod',
      method: 'DID',
      value: `${ISSUER_ID}#controller`,
      revocation: {
        type: 'NONE',
      },
    },
    identityProof: {
      type: 'DNS-DID',
      identifier: 'example.tradetrust.io',
    },
  },
  issuanceDate: '2021-12-03T12:19:52Z',
  expirationDate: '2029-12-03T12:19:52Z',
  issuer: {
    id: 'https://example.tradetrust.io',
    name: 'DEMO TOKEN REGISTRY',
    type: 'OpenAttestationIssuer',
  },
  type: ['VerifiableCredential', 'OpenAttestationCredential'],
} as v3.OpenAttestationDocument);

export const RAW_DOCUMENT_DID_V2 = freezeObject({
  id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
  shipper: {
    address: {
      street: '456 Orchard Road',
      country: 'SG',
    },
  },
  consignee: {
    name: 'TradeTrust',
  },
  notifyParty: {
    name: 'TrustVC',
  },
  packages: [
    {
      description: '1 Pallet',
      weight: '1',
      measurement: 'KG',
    },
  ],
  $template: {
    type: 'EMBEDDED_RENDERER',
    name: 'BILL_OF_LADING',
    url: 'https://generic-templates.tradetrust.io',
  },
  issuers: [
    {
      id: ISSUER_ID,
      name: 'DID_ISSUER',
      identityProof: {
        type: 'DID',
        key: `${ISSUER_ID}#controller`,
      },
      revocation: {
        type: 'NONE',
      },
    },
  ],
  blNumber: 'BL123456',
  scac: 'OOLU',
} as v2.OpenAttestationDocument);

export const BATCHED_RAW_DOCUMENTS_DID_V3 = freezeObject([
  {
    version: 'https://schema.openattestation.com/3.0/schema.json',
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
      'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
    ],
    credentialSubject: {
      id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
      shipper: {
        address: {
          street: '456 Orchard Road',
          country: 'SG',
        },
      },
      consignee: {
        name: 'TradeTrust',
      },
      notifyParty: {
        name: 'TrustVC',
      },
      packages: [
        {
          description: '1 Pallet',
          weight: '1',
          measurement: 'KG',
        },
      ],
      blNumber: '20240315',
      scac: '20240315',
    },
    openAttestationMetadata: {
      template: {
        type: 'EMBEDDED_RENDERER',
        name: 'BILL_OF_LADING',
        url: 'https://generic-templates.tradetrust.io',
      },
      proof: {
        type: 'OpenAttestationProofMethod',
        method: 'DID',
        value: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
        revocation: {
          type: 'NONE',
        },
      },
      identityProof: {
        type: 'DNS-DID',
        identifier: 'example.tradetrust.io',
      },
    },
    issuanceDate: '2021-12-03T12:19:52Z',
    expirationDate: '2029-12-03T12:19:52Z',
    issuer: {
      id: 'https://example.tradetrust.io',
      name: 'DEMO TOKEN REGISTRY',
      type: 'OpenAttestationIssuer',
    },
    type: ['VerifiableCredential', 'OpenAttestationCredential'],
  } as v3.OpenAttestationDocument,
  {
    version: 'https://schema.openattestation.com/3.0/schema.json',
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
      'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
    ],
    credentialSubject: {
      id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
      shipper: {
        address: {
          street: '456 Orchard Road',
          country: 'SG',
        },
      },
      consignee: {
        name: 'TradeTrust',
      },
      notifyParty: {
        name: 'TrustVC',
      },
      packages: [
        {
          description: '1 Pallet',
          weight: '1',
          measurement: 'KG',
        },
      ],
      blNumber: '20240315',
      scac: '20240315',
    },
    openAttestationMetadata: {
      template: {
        type: 'EMBEDDED_RENDERER',
        name: 'BILL_OF_LADING',
        url: 'https://generic-templates.tradetrust.io',
      },
      proof: {
        type: 'OpenAttestationProofMethod',
        method: 'DID',
        value: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
        revocation: {
          type: 'NONE',
        },
      },
      identityProof: {
        type: 'DNS-DID',
        identifier: 'example.tradetrust.io',
      },
    },
    issuanceDate: '2021-12-03T12:19:52Z',
    expirationDate: '2029-12-03T12:19:52Z',
    issuer: {
      id: 'https://example.tradetrust.io',
      name: 'DEMO TOKEN REGISTRY',
      type: 'OpenAttestationIssuer',
    },
    type: ['VerifiableCredential', 'OpenAttestationCredential'],
  } as v3.OpenAttestationDocument,
] as v3.OpenAttestationDocument[]);

export const BATCHED_RAW_DOCUMENTS_DID_V2 = freezeObject([
  {
    id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    shipper: {
      address: {
        street: '456 Orchard Road',
        country: 'SG',
      },
    },
    consignee: {
      name: 'TradeTrust',
    },
    notifyParty: {
      name: 'TrustVC',
    },
    packages: [
      {
        description: '1 Pallet',
        weight: '1',
        measurement: 'KG',
      },
    ],
    $template: {
      type: 'EMBEDDED_RENDERER',
      name: 'BILL_OF_LADING',
      url: 'https://generic-templates.tradetrust.io',
    },
    issuers: [
      {
        id: ISSUER_ID,
        name: 'DID_ISSUER',
        identityProof: {
          type: 'DID',
          key: `${ISSUER_ID}#controller`,
        },
        revocation: {
          type: 'NONE',
        },
      },
    ],
    blNumber: 'BL123456',
    scac: 'OOLU',
  },
  {
    id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    shipper: {
      address: {
        street: '456 Orchard Road',
        country: 'SG',
      },
    },
    consignee: {
      name: 'TradeTrust',
    },
    notifyParty: {
      name: 'TrustVC',
    },
    packages: [
      {
        description: '1 Pallet',
        weight: '1',
        measurement: 'KG',
      },
    ],
    $template: {
      type: 'EMBEDDED_RENDERER',
      name: 'BILL_OF_LADING',
      url: 'https://generic-templates.tradetrust.io',
    },
    issuers: [
      {
        id: ISSUER_ID,
        name: 'DID_ISSUER',
        identityProof: {
          type: 'DID',
          key: `${ISSUER_ID}#controller`,
        },
        revocation: {
          type: 'NONE',
        },
      },
    ],
    blNumber: 'BL123456',
    scac: 'OOLU',
  },
] as v2.OpenAttestationDocument[]);

export const RAW_DOCUMENT_DID_TOKEN_REGISTRY_V3 = freezeObject({
  version: 'https://schema.openattestation.com/3.0/schema.json',
  network: {
    chain: 'MATIC',
    chainId: '80002',
  },
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
    'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
  ],
  credentialSubject: {
    id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    shipper: {
      address: {
        street: '456 Orchard Road',
        country: 'SG',
      },
    },
    consignee: {
      name: 'TradeTrust',
    },
    notifyParty: {
      name: 'TrustVC',
    },
    packages: [
      {
        description: '1 Pallet',
        weight: '1',
        measurement: 'KG',
      },
    ],
    blNumber: '20240315',
    scac: '20240315',
  },
  openAttestationMetadata: {
    template: {
      type: 'EMBEDDED_RENDERER',
      name: 'BILL_OF_LADING',
      url: 'https://generic-templates.tradetrust.io',
    },
    proof: {
      type: 'OpenAttestationProofMethod',
      method: 'TOKEN_REGISTRY',
      value: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
      revocation: {
        type: 'NONE',
      },
    },
    identityProof: {
      type: 'DNS-TXT',
      identifier: 'example.tradetrust.io',
    },
  },
  issuanceDate: '2021-12-03T12:19:52Z',
  expirationDate: '2029-12-03T12:19:52Z',
  issuer: {
    id: 'https://example.tradetrust.io',
    name: 'DEMO TOKEN REGISTRY',
    type: 'OpenAttestationIssuer',
  },
  type: ['VerifiableCredential', 'OpenAttestationCredential'],
} as v3.OpenAttestationDocument);

/* Wrapped */
export const WRAPPED_DOCUMENT_DNS_DID_V3 = freezeObject({
  version: 'https://schema.openattestation.com/3.0/schema.json',
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
    'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
  ],
  credentialSubject: {
    id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    shipper: {
      address: {
        street: '456 Orchard Road',
        country: 'SG',
      },
    },
    consignee: {
      name: 'TradeTrust',
    },
    notifyParty: {
      name: 'TrustVC',
    },
    packages: [
      {
        description: '1 Pallet',
        weight: '1',
        measurement: 'KG',
      },
    ],
    blNumber: '20240315',
    scac: '20240315',
  },
  openAttestationMetadata: {
    template: {
      type: 'EMBEDDED_RENDERER',
      name: 'BILL_OF_LADING',
      url: 'https://generic-templates.tradetrust.io',
    },
    proof: {
      type: 'OpenAttestationProofMethod',
      method: 'DID',
      value: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
      revocation: {
        type: 'NONE',
      },
    },
    identityProof: {
      type: 'DNS-DID',
      identifier: 'example.tradetrust.io',
    },
  },
  issuanceDate: '2021-12-03T12:19:52Z',
  expirationDate: '2029-12-03T12:19:52Z',
  issuer: {
    id: 'https://example.tradetrust.io',
    name: 'DEMO TOKEN REGISTRY',
    type: 'OpenAttestationIssuer',
  },
  type: ['VerifiableCredential', 'OpenAttestationCredential'],
  proof: {
    type: 'OpenAttestationMerkleProofSignature2018',
    proofPurpose: 'assertionMethod',
    targetHash: '8f832ec1d27e09b2530cd051c9acea960971c238a3627369f33cdc58af9548cd',
    proofs: [],
    merkleRoot: '8f832ec1d27e09b2530cd051c9acea960971c238a3627369f33cdc58af9548cd',
    salts:
      'W3sidmFsdWUiOiI2MmZjMzg5NWVmZjg1ODI5Mjc1YmY5MzQxMzI4N2QwY2NjNDliYTcyY2VhOWM1NTA2NjFjYzk4YTA1YTczNjU0IiwicGF0aCI6InZlcnNpb24ifSx7InZhbHVlIjoiYzI1NWZhZmFkNWQ2YmFlODE3YWJmNDExOGVmZDMwODRiNDMwOTIyZjE4MDU2OGE2NmY4ZDFjZWUxMTFjZDA3NyIsInBhdGgiOiJAY29udGV4dFswXSJ9LHsidmFsdWUiOiIwZWZkZDkxOGFjOGZmYWU1ODQ0ZGE4M2U3YTYyNWJhMGYyOGUyYjJlMTVlMWFlNjYzODFmZDAyYmEwZmYwOWQxIiwicGF0aCI6IkBjb250ZXh0WzFdIn0seyJ2YWx1ZSI6ImE4YjY2ZDEzNmRlYzYxOGM3ODI1ZmVjOTg3ZTM2NWUzYzlmZjMwNzg3NmI0MDc2NWUwZGI2MjdmZjA1NTAxNGIiLCJwYXRoIjoiQGNvbnRleHRbMl0ifSx7InZhbHVlIjoiMGQyMDkyMDU2MjBmZjg1NGU5MjZhNDI1YTZmYTk3ZDdkZWM0YjNjODE4N2YzNmM5YTZjZGY0OGYxMjMzNzgwNyIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5pZCJ9LHsidmFsdWUiOiI3MTdmNDg1YjFiMGNjMTFjZjExODNkMzkzYWE1MDc5ZDljNzYzZjY0NmMxNzg1MmJjZTY1OTNmOGJjZGRmM2IyIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNoaXBwZXIuYWRkcmVzcy5zdHJlZXQifSx7InZhbHVlIjoiNzUzM2M0ZDQxZmQ5Yjk2NjlkZmUyOWMxMmUyYTc1MDA1MzEyYjdjNmY0OWEzZDI2Yjk3Yjk3MTY3ODMxYmM4YyIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5zaGlwcGVyLmFkZHJlc3MuY291bnRyeSJ9LHsidmFsdWUiOiJkNDc2NTM1NzNlZTAxNzg5ODljZWU1ZmU2NjBiZjA4MzZmZDQzZTU1MmQ0M2JkMTM0MTg2ZGY3MTBmNWFkZTBhIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LmNvbnNpZ25lZS5uYW1lIn0seyJ2YWx1ZSI6ImFjZGIyY2U5Y2YyMzlmZWYyMjE1MTNiZDRiZTAxNTk0OTc4ZmRlYjQ4ZjQ0NTk1NTkwOGZkYzc1ZTQxYmEzZWEiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3Qubm90aWZ5UGFydHkubmFtZSJ9LHsidmFsdWUiOiJkYTkxODQzNzIxZjU2MDljOGM3ZTE1MjgzNzBmZDdkMTA0ZGFmZGI3OWEzZDViMjMxZDI0MTM3NTZmMmRjNzZkIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnBhY2thZ2VzWzBdLmRlc2NyaXB0aW9uIn0seyJ2YWx1ZSI6IjE4Y2JjNTQxZmM1YzZmZDI5NzFlMjBiNGU5ZmQ1MDdmMDA4MzZhMTRkNWZmYjY3ZGEzNDYwMTFmYzk1MDllMjAiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ud2VpZ2h0In0seyJ2YWx1ZSI6IjJlM2I4YzRiNzI5YjAxMjY2MGNkOTU2MTE1NGFmZGZhOGM0MmRmMDcxZDBlZjBhNjZhZTViZjNkMmZkYmU0YTciLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ubWVhc3VyZW1lbnQifSx7InZhbHVlIjoiMzI1NTVmNjkyNDEyM2JhMDFjOGU2MWFhN2U3MGE1MGY5YWI1NzdlYmY2ODJmYTk3MTVkNWEyZTU5M2FlMWFlMiIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5ibE51bWJlciJ9LHsidmFsdWUiOiIxYjhhMTVhYzgzZmQ5MjUxNzVlNTRlODc4MGI2YWQzZjUxYzQwYjlhOGJlYTA3NGQzZGY1Y2U4MDI0MjAyMWNjIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNjYWMifSx7InZhbHVlIjoiNTVlZGMxNjRiMWE5ODFjYWMzYTBiNGFlNDlmYzg0Y2Q0ZTY3YTBkNjZkODE4YjVhODcwOTUyMDgzMWI3MzA1NiIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS50ZW1wbGF0ZS50eXBlIn0seyJ2YWx1ZSI6ImMxYjI4OWZjYjY0OGY4NTU0Zjc4NmIxNTM1MmY3ZGVmYmI4Mzg3ZDBmMWI0NzFmYTM4M2I3YWMzYWQzY2E1OTYiLCJwYXRoIjoib3BlbkF0dGVzdGF0aW9uTWV0YWRhdGEudGVtcGxhdGUubmFtZSJ9LHsidmFsdWUiOiI0MDcxMTVmNjI0M2Q5NGJiNmQxYjUwMDU5YWM2MjI2ZGQ4NTQ5NTdlNTRmMzBhODI3ZjA2ZWM1YTFmODA4N2VkIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnRlbXBsYXRlLnVybCJ9LHsidmFsdWUiOiI3YTM3NWY2MDkzMzA2MDFkYTQxODQwNzQ2ZGQyYjQyMTEwMDY3ZTMwOWQxMWY5MGJiODc3MmQ2N2U5NjMyNzdhIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnR5cGUifSx7InZhbHVlIjoiMWU1YzJhYzRmYTNjN2U1NjQxYTJhMGQ3OGU1MTJjOTg1OGMzODI2NGJmMDMxNmI2ZGY2MDRiOTVkYzUyMmUyOSIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi5tZXRob2QifSx7InZhbHVlIjoiYzIxNjg5M2JhOWY5MjAzNmMyNGFlMGQ3MTQ4NjlkMzhmZjM3ZjgyZDhkYTc2YjBjZmNjYzRlM2RkZjY1YmQ5MSIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi52YWx1ZSJ9LHsidmFsdWUiOiI1ODk2MjA2MGZmZmY4ZDQyMGVjYjA1YjJjYTNiYzc5YWJiNDU4YTRlNzc2OGZkY2ZiYjM2ZmRmOWUyNDJlZDg0IiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnJldm9jYXRpb24udHlwZSJ9LHsidmFsdWUiOiIxYmNmN2M4NWJkODQyNzI1OTEzNzZmMjk1OWUwMjk5MDdmZmM4N2M4MmM2NzE1NGJjMGQ2ZWE2MTAzMmJkZjE2IiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YudHlwZSJ9LHsidmFsdWUiOiIzMzVkYjA4MzdlNDFiNDg0YWI1ZjYxYTI4MTA0M2FhODVmMWM5NzMwNTU4YmUwOGZkZTAwNmI3YTIwMjljMjJmIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YuaWRlbnRpZmllciJ9LHsidmFsdWUiOiI2OWIxMThkZjM0NjQ3YjA1ODhkOTc1OWYzYzM2MzllZDExZDIzNWJhYWUyMzAwMGRjN2M3Y2ZlYjA5Yjc0YmU2IiwicGF0aCI6Imlzc3VhbmNlRGF0ZSJ9LHsidmFsdWUiOiJjNDc4MDVkMmIwNGEzNGQ3Y2UzOGVjMDAxZDI4Y2MxYjk3MzNmODgzYTRlYTJjNGQzYjBlYTRiMWZhOGFjYjkxIiwicGF0aCI6ImV4cGlyYXRpb25EYXRlIn0seyJ2YWx1ZSI6ImQyYWNiZjYwYzEwNDc2ZmNiOTQ0MDg2YTAwODRkMjIzZWJhMjdhNzQyYzNmN2JhNWU5ZWE1YjQ4MTE0NDljN2IiLCJwYXRoIjoiaXNzdWVyLmlkIn0seyJ2YWx1ZSI6IjBlNWVkOGNiMDFiZTA0ZGY2OTg0MzlhYTMyNjZjNTY0MGMxNjRlN2VmMTBjYTJjNGNmNWRiZmQzMWQzYjAxZTEiLCJwYXRoIjoiaXNzdWVyLm5hbWUifSx7InZhbHVlIjoiZTgyMTFhZTc2ZjYyMjI4N2Q2ZWM1MzkyNzg4ZDY1OTk1MGRlZWQ5MTg0MjcxZjRjZTFiZTFmNGU4ZWE0YmJjNCIsInBhdGgiOiJpc3N1ZXIudHlwZSJ9LHsidmFsdWUiOiI0MGE0ZTAwYjY0YjEzMWYwYTM2NTM2MDAyYjNjNjJkY2ZmNTI1ZDUyOGNiZGYzZTAxYTQ5ZDcwMzBhMTQ4MjhlIiwicGF0aCI6InR5cGVbMF0ifSx7InZhbHVlIjoiYWZlOTc0OGZkM2U0MGFmZGQyNWI4NmNlZTA5YTJhNjE3N2MzNDZhMDY4ZjJhNmZkMzk4OTNiN2Q2MTJkZWI0MyIsInBhdGgiOiJ0eXBlWzFdIn1d',
    privacy: {
      obfuscated: [],
    },
  },
} as unknown as v3.WrappedDocument);

export const WRAPPED_DOCUMENT_DID_V2 = freezeObject({
  version: 'https://schema.openattestation.com/2.0/schema.json',
  data: {
    id: 'e9d95822-dfd4-4f0a-9b3a-b21de76fb9e9:string:urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    shipper: {
      address: {
        street: '76b35ba3-a12b-4626-9d8e-21cbfee7f082:string:456 Orchard Road',
        country: '89273055-befa-4940-bcbf-6cd531d9b060:string:SG',
      },
    },
    consignee: {
      name: '137eb8b9-2da0-4608-8bd3-17e495b332cd:string:TradeTrust',
    },
    notifyParty: {
      name: 'bd6b7b59-c3c4-4ab2-8c4a-b68cf9124f02:string:TrustVC',
    },
    packages: [
      {
        description: '6d3367f0-dee3-475a-989d-e62c97b8557e:string:1 Pallet',
        weight: '8e2ea698-df0d-4e6f-9a3c-a7e4472b86c9:string:1',
        measurement: 'ed505681-9c14-4bb9-943d-455b4fa6d58c:string:KG',
      },
    ],
    $template: {
      type: 'ac26f70e-2932-46f7-bd9a-1a758538289f:string:EMBEDDED_RENDERER',
      name: '0c05e656-2d52-4b38-945c-d9f085588dd3:string:BILL_OF_LADING',
      url: '55896d86-6099-4470-81c6-79091ee301f0:string:https://generic-templates.tradetrust.io',
    },
    issuers: [
      {
        id: '8c61d8e4-5ad3-40bc-975d-babf0a72db7e:string:did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90',
        name: '912d9616-5f69-4296-9b88-1eca73b786df:string:DID_ISSUER',
        identityProof: {
          type: 'f9ae9ee8-dcf0-407b-a53f-8f2e1eb3e1b1:string:DID',
          key: '07c2beca-d6e7-4920-9377-e3d100adbec1:string:did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
        },
        revocation: {
          type: '0e7f7d52-83e3-4df7-9a82-ff9571b45310:string:NONE',
        },
      },
    ],
    blNumber: 'e905d5f9-1562-447a-acab-a747853180fe:string:BL123456',
    scac: '206cf8b4-48fa-4822-8db4-7c9c4c529500:string:OOLU',
  },
  signature: {
    type: 'SHA3MerkleProof',
    targetHash: 'dabd017ef67a553e467806437473d1707a8079328e4fe9a9471be0be536cab9d',
    proof: [],
    merkleRoot: 'dabd017ef67a553e467806437473d1707a8079328e4fe9a9471be0be536cab9d',
  },
} as unknown as v2.WrappedDocument);

export const BATCHED_WRAPPED_DOCUMENTS_DID_V3 = freezeObject([
  {
    version: 'https://schema.openattestation.com/3.0/schema.json',
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
      'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
    ],
    credentialSubject: {
      id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
      shipper: {
        address: {
          street: '456 Orchard Road',
          country: 'SG',
        },
      },
      consignee: {
        name: 'TradeTrust',
      },
      notifyParty: {
        name: 'TrustVC',
      },
      packages: [
        {
          description: '1 Pallet',
          weight: '1',
          measurement: 'KG',
        },
      ],
      blNumber: '20240315',
      scac: '20240315',
    },
    openAttestationMetadata: {
      template: {
        type: 'EMBEDDED_RENDERER',
        name: 'BILL_OF_LADING',
        url: 'https://generic-templates.tradetrust.io',
      },
      proof: {
        type: 'OpenAttestationProofMethod',
        method: 'DID',
        value: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
        revocation: {
          type: 'NONE',
        },
      },
      identityProof: {
        type: 'DNS-DID',
        identifier: 'example.tradetrust.io',
      },
    },
    issuanceDate: '2021-12-03T12:19:52Z',
    expirationDate: '2029-12-03T12:19:52Z',
    issuer: {
      id: 'https://example.tradetrust.io',
      name: 'DEMO TOKEN REGISTRY',
      type: 'OpenAttestationIssuer',
    },
    type: ['VerifiableCredential', 'OpenAttestationCredential'],
    proof: {
      type: 'OpenAttestationMerkleProofSignature2018',
      proofPurpose: 'assertionMethod',
      targetHash: 'e0de44adc67499777af35e8d94c07df080624d06187dce8901f2f8a435fc7b7d',
      proofs: ['81a2b26f7adbb6181fd44b9321cac6198a760a2c95edd8ef64cad747e935ecbc'],
      merkleRoot: '722e6757c585cbfb60ba1d41fae9285e2ddcc2143f414439bb14dae1820e45ea',
      salts:
        'W3sidmFsdWUiOiIzODk4ZGZhM2Y3NjMyOGM5NmIxM2NiZTU1NTQ2MDIxNDVmY2QzZGIzMzM0NDcxZmIzMzZmMzU3ZWViMGUyNTE5IiwicGF0aCI6InZlcnNpb24ifSx7InZhbHVlIjoiM2MzZGNjOWNhYmJmMzViOWQxZTA2NWEwMmEzNDFhM2JmZmM3Y2Q0YzY4OWY0MjI3ZTU0M2VmMTYzMWJlZmY2MyIsInBhdGgiOiJAY29udGV4dFswXSJ9LHsidmFsdWUiOiI3YzYyMzAxNjk4MjRjYmQ4Nzc0NWUxY2MxNWE5OTViMjE0NmNmOTU4ZjI4MjNiYTcxYWMyNmFjNGRiM2IzYWVhIiwicGF0aCI6IkBjb250ZXh0WzFdIn0seyJ2YWx1ZSI6ImFmYmRlYjlmMzg5MjA5MWY2MDkyMWI3NTdiY2I4ZDNjZTMwNDRjMWRjZjBjOTFlYzIyYzcwY2E2MDEwNDVlOGYiLCJwYXRoIjoiQGNvbnRleHRbMl0ifSx7InZhbHVlIjoiZDY5YTNkNGE2MWEwMDg5YzkyZWFkZDczNDlkYmZkMzllMjUxMWUyNWRmNmE2ZWJmYzYyZWNiMWZlMzM2MmU5YiIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5pZCJ9LHsidmFsdWUiOiIzZGM5Zjc5ZWZhOGU1NmJiNWI0MDE2OTUwOGNiZGFlNWMwNmVmNzdjYWViYjE1ZTU2YTM4YThlYTlmNmQ3ODJiIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNoaXBwZXIuYWRkcmVzcy5zdHJlZXQifSx7InZhbHVlIjoiYjVmOGQ4NDA2OTIwMWVlYWM1NTk5NzcwNjQ5YmQyNTQwMTE0MDhmNzA4NWZiYmNkOTZmN2ZmZGQ2YTI4YWY4NyIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5zaGlwcGVyLmFkZHJlc3MuY291bnRyeSJ9LHsidmFsdWUiOiI2MTY4NzQwYTFmZDFlMzgwNWU3MGQzMDAwMzhhMDgzN2Y4YjJiYzdjMDdhMTMzYzA1YjYzM2M0ZWU3ZTI1NGNlIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LmNvbnNpZ25lZS5uYW1lIn0seyJ2YWx1ZSI6ImQ0YTEwMjNhODkwODE1MDcwYmQ5YmEzMzk5MTNiNmVlMjgwZDVkZDQ1ZDUxMWQ0N2FhMzcwMzViYTUyZTgzYzkiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3Qubm90aWZ5UGFydHkubmFtZSJ9LHsidmFsdWUiOiJmZmRlNTQyMzNlOTQ5MzNjOTM4ZmI3ZmY3NTRhYzc1YTQ0ZjlhMzZkN2M0OWU0MzVjMzkwZjBkNjM2OGE4MzcwIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnBhY2thZ2VzWzBdLmRlc2NyaXB0aW9uIn0seyJ2YWx1ZSI6ImRmMzE5YjViNGM1NDI5NDA0OTBjYTEyODBhMjhmZDc4NTgyZTQwZjZjOTU5YmZmNGVjNGRmZDQ1ZWI1ZTFhMTUiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ud2VpZ2h0In0seyJ2YWx1ZSI6ImE2YTE3YTRkZGMzNzhjYzVkNzExNTZjMDUxODhlMmI1Zjg3NTA0NjdkNjhiY2RkM2Q4NGU0NDcyOGNiZmMzMTYiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ubWVhc3VyZW1lbnQifSx7InZhbHVlIjoiNDk3Y2QyMTkyZDVkM2JlYzg4MjVkZTM2YzIxODgxM2NjZjM2Y2FiOTA0MzQxMTVkZGQ0MjI3OWYyMDRmMDVjZCIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5ibE51bWJlciJ9LHsidmFsdWUiOiIyODk5ZDc3NTNjMDNmZmFlOTBhNzVhY2ZlNjllNzY3Y2Q2OWJiN2UxZWNkZjk1Y2FhNjg2N2I2OGNkMGQ5ZjM4IiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNjYWMifSx7InZhbHVlIjoiY2U4YWVkZTIyZGQ1ZjU2Y2QyNWJmMGM5MjFjODc0YWMzMGM5ODRhNjc2MDUxZGJkMDAxMDM4NWE0ZjMzZDFhNCIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS50ZW1wbGF0ZS50eXBlIn0seyJ2YWx1ZSI6IjY4M2ExYTQ3YjUwYzIyNjlkMTNmNGM5ZmZiYzFjOTI1N2FlZjY3NjgxMmU0ZTgzMzhmYzI5MmNkYTYwODE1YjIiLCJwYXRoIjoib3BlbkF0dGVzdGF0aW9uTWV0YWRhdGEudGVtcGxhdGUubmFtZSJ9LHsidmFsdWUiOiI1ZTViMzQyYzE5N2NhOTc5MjM3NzhhNTBiOTdmYTUwNDFkNTdjOTUyMmQ2ZThiMDQ3ZDM3M2FjMjgwMzFhNDI1IiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnRlbXBsYXRlLnVybCJ9LHsidmFsdWUiOiJkODg3ZDYyZjMzOTI3YzFkMzUyMDk4NDllOTEzMzFhMGY1OGEzZWVjN2VhMjVjNDAyMjYxZDVjYWRlOGVjYTBkIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnR5cGUifSx7InZhbHVlIjoiNWVhNmYwZjlhMzg3Yzc5N2U4OTJiM2IyMGNjNTY4NDJiZTEwYWNkNTA4MjVlMThmMTEyYjY3ZDI2NWY3ODgwZiIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi5tZXRob2QifSx7InZhbHVlIjoiZDc1NGM2OThjOWI3ZDY4ODI4Mzk1YWM1ZWZlMWIzNTgwYzNjYThjNDIwMzJlZDllMTI5MTE0ODEwMDJlYzJlOSIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi52YWx1ZSJ9LHsidmFsdWUiOiJmY2Y2MGJjNDU3NDYyZjRlOTkwM2Y0YjMxMjM1NjdjODc5NGU1ZGQ2YjMxZmZlNzcxNWY0YWE3ODY5Y2NhMzMzIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnJldm9jYXRpb24udHlwZSJ9LHsidmFsdWUiOiIxZTAwYzYxOGFhMmIzYmU5NmJhMTAyMmJkY2E2NWNmNTZhODJiMzQwNzYxYmRiOTEyNTJlZmM2ZjNiMTYyNGFmIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YudHlwZSJ9LHsidmFsdWUiOiI4YjZlODM3NTg5ODE5YjhjNmRhZTY1NDk3ZWY3OGIyNTQ0YWI5MjVmZTIzYThlOGYzZTM5NjU5ZGQ5MjIxYTYxIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YuaWRlbnRpZmllciJ9LHsidmFsdWUiOiJhZjdlNjMyYTE3MjFmNGU1MjVjYTdmZmQxN2FiMjFmODJjOGYyNzNkNTFjZDU3NWJhNTI1OTkxMGI1MWRjNTQxIiwicGF0aCI6Imlzc3VhbmNlRGF0ZSJ9LHsidmFsdWUiOiJiMDlkNTVkYTI4NWM3NzBlODU5YzZiYmViOTYwYzBjNGI4ZGUyZGEzOGU3ODI5ODY5ZjE4YWQ5MDMyZmUwZWRhIiwicGF0aCI6ImV4cGlyYXRpb25EYXRlIn0seyJ2YWx1ZSI6IjZhYzIzNTFlMmNjMjIwMzU0OWEyYzEwOTEwMDU5M2IwZjM5Y2M3YzlkN2RjZTQ5NmJhOWZmM2I5Njg4ZTFiNmIiLCJwYXRoIjoiaXNzdWVyLmlkIn0seyJ2YWx1ZSI6IjA0MGVkNjBkNzFkOTQ1NTY3YjJiZTk5NTdjNzg4OWVlYzFlZjJkNGU4NDFlZjViY2Q2NWFiYzZkMmNmMGQ2MzIiLCJwYXRoIjoiaXNzdWVyLm5hbWUifSx7InZhbHVlIjoiMzM2NmVjNTI1NGU1Y2ZiZDVlYTlhZGFmNzAzYTAyNDk4ZmUyN2QzMDNmNzZlMzk4YWEzZDI4N2UyNGYyOWEwMCIsInBhdGgiOiJpc3N1ZXIudHlwZSJ9LHsidmFsdWUiOiJmN2E4ZTM1MTkwZjNmMDgyYzExODFkZDk5OWMwYTJhNzRkNzdmOGMyMDFlMDBhMDFhOWRjZGY1NmRiOTg0NjVkIiwicGF0aCI6InR5cGVbMF0ifSx7InZhbHVlIjoiNzg5YTRiYWY3NTc4YjM4YTg4ZTdhYWQ2ODAxNWUzYWU1NDg0NDllZjE1ZTRiNTcwN2M4N2FjMzkxNDkxYTBhMSIsInBhdGgiOiJ0eXBlWzFdIn1d',
      privacy: {
        obfuscated: [],
      },
    },
  },
  {
    version: 'https://schema.openattestation.com/3.0/schema.json',
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
      'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
    ],
    credentialSubject: {
      id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
      shipper: {
        address: {
          street: '456 Orchard Road',
          country: 'SG',
        },
      },
      consignee: {
        name: 'TradeTrust',
      },
      notifyParty: {
        name: 'TrustVC',
      },
      packages: [
        {
          description: '1 Pallet',
          weight: '1',
          measurement: 'KG',
        },
      ],
      blNumber: '20240315',
      scac: '20240315',
    },
    openAttestationMetadata: {
      template: {
        type: 'EMBEDDED_RENDERER',
        name: 'BILL_OF_LADING',
        url: 'https://generic-templates.tradetrust.io',
      },
      proof: {
        type: 'OpenAttestationProofMethod',
        method: 'DID',
        value: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
        revocation: {
          type: 'NONE',
        },
      },
      identityProof: {
        type: 'DNS-DID',
        identifier: 'example.tradetrust.io',
      },
    },
    issuanceDate: '2021-12-03T12:19:52Z',
    expirationDate: '2029-12-03T12:19:52Z',
    issuer: {
      id: 'https://example.tradetrust.io',
      name: 'DEMO TOKEN REGISTRY',
      type: 'OpenAttestationIssuer',
    },
    type: ['VerifiableCredential', 'OpenAttestationCredential'],
    proof: {
      type: 'OpenAttestationMerkleProofSignature2018',
      proofPurpose: 'assertionMethod',
      targetHash: '81a2b26f7adbb6181fd44b9321cac6198a760a2c95edd8ef64cad747e935ecbc',
      proofs: ['e0de44adc67499777af35e8d94c07df080624d06187dce8901f2f8a435fc7b7d'],
      merkleRoot: '722e6757c585cbfb60ba1d41fae9285e2ddcc2143f414439bb14dae1820e45ea',
      salts:
        'W3sidmFsdWUiOiI1ZDYxMGI5ZDgyYjUwZGI4OTE0MjhiNzJkOWNhMmNiMDQyNzMwZTJjNWYxMjA0OTA0YmVlZjBlZTgxNDgxMDgzIiwicGF0aCI6InZlcnNpb24ifSx7InZhbHVlIjoiNTQ0ZmRjOWQ1NmIzODhiNjAyNWFkZWRjNTkwNTNmZDEwNjMxMDc5YjE4MjkzY2QyNTdkMDc2ZDViYjhiM2I4NSIsInBhdGgiOiJAY29udGV4dFswXSJ9LHsidmFsdWUiOiI1OTZhYTYzODE3ZmQxNTJkY2QxYjRmMmJjNzVlNDUwMmQ2ZjUxNzEzNWQ0NmRmOWIwM2NkMDBjZjk4YmFjOWZiIiwicGF0aCI6IkBjb250ZXh0WzFdIn0seyJ2YWx1ZSI6IjRmMTU5ZjUxY2YzOGRkNzgyZDEzOTY0N2ZjNjExMGRjNWI5OGIwMmY5ZjcxZDc1ZTE5MTZiYWUyZGFmZjUzNmQiLCJwYXRoIjoiQGNvbnRleHRbMl0ifSx7InZhbHVlIjoiZGQ4MGViM2QxYmY0YWFmZTE4ZDE0OTc0NjM4NmFkMTlkNjRhZmQ4MGZiNDI4YmMxZWIwNDhiZDliYzg1NzEwMSIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5pZCJ9LHsidmFsdWUiOiJhNGM4MWE0MzE4OGU2NTQ2OTI1OGQxZTdiY2JiOWVjNDk5MTJkNjA5MzBkODFjYzc3MGZhODM5NjRmYzZkZjdmIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNoaXBwZXIuYWRkcmVzcy5zdHJlZXQifSx7InZhbHVlIjoiMWI2NjU1ODA1N2M0YTI3OGJjMDNiZTcxYmQ4Y2U3M2I1Zjg4OGNlZTRhYTE1N2M5NDEwOGIyYzBmOTgxYTc5ZSIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5zaGlwcGVyLmFkZHJlc3MuY291bnRyeSJ9LHsidmFsdWUiOiI0NTI3MGFjNjBlNGYyYjIyMzZhNTUzYjUzODY4MGQ2NWJiOGE0NWY3MGIyOGI0MjQ2MmY1YjM1YTAxOWIzYjExIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LmNvbnNpZ25lZS5uYW1lIn0seyJ2YWx1ZSI6ImVkZmU1YzNjN2RiYjE0M2E3M2I3N2I1YWM3ZGI2NjEyYTJlYTAwMDI2YWQzYjYyM2Y5NWZiMTdmMWNlNmNlYjciLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3Qubm90aWZ5UGFydHkubmFtZSJ9LHsidmFsdWUiOiI5NWRmOTk4MTgzOTBmOWUyNGUxMjhmZjE1ZmVlMmMzYTM1MjE0MGZkNGU0OGIwNjMwNzllN2QyOTIzYjc2YzliIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnBhY2thZ2VzWzBdLmRlc2NyaXB0aW9uIn0seyJ2YWx1ZSI6ImJhMjNkMzk5YTI4YjVhZDJjZWRjYWU0MDRmMTdlZTcxY2NjOTNlMzY3YWVlMzBkYjdmOGU1NjMxMDk1ZDkwNjIiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ud2VpZ2h0In0seyJ2YWx1ZSI6ImY3ZTI5YWFhZDJkNWQ0NTVjMGI2Mjg3MzY4NGE5NDM1YWE4N2Y5ZmE3MjMwOTg0MGQ0M2MwYzRmZjEzOGE1YzQiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ubWVhc3VyZW1lbnQifSx7InZhbHVlIjoiMWU2Mjc0NDViZmIyMTlmZTYzMWZiZTBlZWNmMTUzZDMxYjk4MWQzNWZmOGQ5ZTdjY2NlMjVhYThhZWNkMjgyOSIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5ibE51bWJlciJ9LHsidmFsdWUiOiIzZmYwNDhmZGY0NDdlYjk2Nzk4NzBkMWZjMjhiNTI3Mzk4OGI2ZmRjMzExODhhNzdkMGVkY2U4OTAxODhkMWMyIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNjYWMifSx7InZhbHVlIjoiMTI0ZTc4OTRlZjc2MDY2ZTNiYjkzYzhiZDJkMDkyMWU2NzZlNTE4ZDRhMzI5MTVlMmEzODg5Mjc0ZTU4YWMyMCIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS50ZW1wbGF0ZS50eXBlIn0seyJ2YWx1ZSI6ImE4NjZiNWIyZGFhMTUzMTFiMTFmOGRiMDZlMGNmNjQwNGQ4NzZmNTBiN2M3NjA4YWRjZjNkYTE5MjhmYzhiNTUiLCJwYXRoIjoib3BlbkF0dGVzdGF0aW9uTWV0YWRhdGEudGVtcGxhdGUubmFtZSJ9LHsidmFsdWUiOiI1OWQ3ZTE0ZGI1NDYzMmI4MDU2YWMxOWQ0YWQ0YWRjZDY0ZTM1ZjNlNTJhNGQ4OWJmNDZlMDhlZTlkMjBmYTMwIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnRlbXBsYXRlLnVybCJ9LHsidmFsdWUiOiIyNmEzZTZlM2M5Mzk2ZGFkMzIxMzIxMWRmNmVjODJjYzdlYjRmNGNiYjIyYjk3MDJmYWNlOTZlMWM1OWEwZDU0IiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnR5cGUifSx7InZhbHVlIjoiYjM0Mjc1NThlMTFhYjkxNThjNzVjNDQ0NWEyNDZlOWQ5ZTVhMWJmYjc3MzhmMWE1Y2I2ZTRhYzhkNmYyYjA4MCIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi5tZXRob2QifSx7InZhbHVlIjoiZTdhM2VjOTNlMDQ1ZDJhNGUxODUwYjllOTA4Zjc0ODNiYjVlYTZjMzBjNGQxMGNiNzY3MjlkYzBmM2NhZGVjOSIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi52YWx1ZSJ9LHsidmFsdWUiOiJjOTM2NTVmYzY5YjU1ZjhjMjJlMDgwOGNjMmQzYTQ3NWM2Y2U0N2E3MzhlMWM2N2IzNWE2NTgzNzY5M2Q2MDhlIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnJldm9jYXRpb24udHlwZSJ9LHsidmFsdWUiOiJjMTQ2ZTMxYTBjYzI1OTZkOWY0MzJiMjJkZTczOGFlNGI5MzE0ZjFkODk4NGIwYzIzYTYyZDQ4MTNlZGNmZjUyIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YudHlwZSJ9LHsidmFsdWUiOiJjY2Y5ZDY2Y2ExYzFjMDYyZjlkODY4ZTYxY2RjNTk5MmYxZDQzM2E3Y2E4MTE0MTFkNWQ0NmI0MjY1OGU1NGJmIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YuaWRlbnRpZmllciJ9LHsidmFsdWUiOiJmMTk0ZmQzMmM4MjRiMGY0YjYyNWY0NDhmODdkZjM1YzMzMmM4MjgwZjY4NmNjNmMwZGNlN2NkNmJhYjI4YWU4IiwicGF0aCI6Imlzc3VhbmNlRGF0ZSJ9LHsidmFsdWUiOiJlNzhkZGFjMmZiZjVhMTJhNjBmMzkxMDVjM2NjMmVhNzFhNjQ5NmYwOTAwYjUzMWU0OTljNzBkODhjMjA1YjE1IiwicGF0aCI6ImV4cGlyYXRpb25EYXRlIn0seyJ2YWx1ZSI6IjlhY2JhYmFmN2ViZjExZWU0Y2Q0MzUyNzRlZDkyYmQ0NzdkNWY3OWZkNjk5YjllNmM0YThiMTAxZjVlMGZkMzEiLCJwYXRoIjoiaXNzdWVyLmlkIn0seyJ2YWx1ZSI6IjExNzBjNjhhNjdkMjBhYjg5YmMwN2JhMmU1NjM1NDc0MGRkZTUyNGNhN2NkYjg5ZTA0ZWY2NWE5NTdiNTZlNzAiLCJwYXRoIjoiaXNzdWVyLm5hbWUifSx7InZhbHVlIjoiOGJlNmU4YzY2MDA0NzFkMmQ2Y2MwNTY5NTk0M2FjZDdmZjc0MzliOTU0NDU3ZmFiNmUyMTdiNzk0YjRhMjQ3NyIsInBhdGgiOiJpc3N1ZXIudHlwZSJ9LHsidmFsdWUiOiIyOWM5OGMzZmM2ZGI0ZDM2ODY0MzNhN2MwYmI4ODA2NzRjNmExODcyMmJiMGI4ZGI5MGY5YTliMWU2MzQ0ZjZhIiwicGF0aCI6InR5cGVbMF0ifSx7InZhbHVlIjoiMWM5ZDEwYjk1OTBhNGFlODVmZjhiMTc0YTRmNDc4OWQxODk3NTFmOWVhYjk4NWRjNGNjZTRlNDA3NTEyNTVkYyIsInBhdGgiOiJ0eXBlWzFdIn1d',
      privacy: {
        obfuscated: [],
      },
    },
  },
] as v3.WrappedDocument[]);

export const WRAPPED_DOCUMENT_DNS_TXT_V2 = freezeObject({
  version: SchemaId.v2,
  data: {
    id: 'c4d0823c-49c9-494f-8fa5-576c746900d7:string:SGCNM21566325',
    $template: {
      name: '26be0257-5d10-421f-b42e-84dc03f77b66:string:CERTIFICATE_OF_NON_MANIPULATION',
      type: '9194bf18-e6ba-4533-b846-5db60ea3a9fc:string:EMBEDDED_RENDERER',
      url: 'a9e9af66-bad3-411e-a02e-9863a4103a8e:string:https://demo-cnm.openattestation.com',
    },
    issuers: [
      {
        name: 'f12055b9-18ac-4362-9b85-045c7945f267:string:DEMO STORE',
        tokenRegistry:
          'dcd4aecf-abec-4316-925b-d537418d456a:string:0x142Ca30e3b78A840a82192529cA047ED759a6F7e',
        identityProof: {
          type: '222cb8e1-13bb-40ae-a255-7d56781e716c:string:DNS-TXT',
          location: '7f1c5629-122b-4808-9618-20ea701526b9:string:example.tradetrust.io',
        },
      },
    ],
    recipient: {
      name: 'b775d0db-ef6f-41ce-bb2f-f2366ef0e1a6:string:SG FREIGHT',
      address: {
        street: 'dc231e06-7fca-4ea1-9933-190457799ae6:string:101 ORCHARD ROAD',
        country: '8c6b9f39-e431-4c91-b1e7-c7833d13e649:string:SINGAPORE',
      },
    },
    consignment: {
      description: '5cba970f-8e70-4181-8b39-ddb9502abba1:string:16667 CARTONS OF RED WINE',
      quantity: {
        value: '69a0296d-0123-4072-a500-59b935c7df3e:string:5000',
        unit: 'c2cb02b3-7c26-45fb-8d5c-c1e0db4f5b8c:string:LITRES',
      },
      countryOfOrigin: '5911978b-9f00-4ece-a079-0268cf15246d:string:AUSTRALIA',
      outwardBillNo: '3c971efe-0ce5-4651-ad0c-87728c713dff:string:AQSIQ170923130',
      dateOfDischarge: '290a80c5-1aa8-43dd-aa97-ff85fb6db653:string:2018-01-26',
      dateOfDeparture: '4459e2fa-df5c-46c7-82cb-da9fe8fec1ea:string:2018-01-30',
      countryOfFinalDestination: '152cc7a4-1fc3-48de-8e5e-dc363aa629fd:string:CHINA',
      outgoingVehicleNo: 'd77fbf0f-fb4b-4dbc-be61-ce44e2307316:string:COSCO JAPAN 074E/30-JAN',
    },
    declaration: {
      name: '23992b1b-050c-4914-8d19-cfec43d66260:string:PETER LEE',
      designation: '642cefd7-96f2-416e-a390-81c8b0141b6b:string:SHIPPING MANAGER',
      date: '42f3aa4f-7353-4a14-b046-e864e21d5533:string:2018-01-28',
    },
  },
  signature: {
    type: 'SHA3MerkleProof',
    targetHash: 'de08643a0b7504329f0024174ac7fbb297876a52437aae8190bdbca794f9d96b',
    proof: [],
    merkleRoot: 'de08643a0b7504329f0024174ac7fbb297876a52437aae8190bdbca794f9d96b',
  },
} as unknown as v2.WrappedDocument);

export const BATCHED_WRAPPED_DOCUMENTS_DID_V2 = freezeObject([
  {
    version: 'https://schema.openattestation.com/2.0/schema.json',
    data: {
      id: '463fc728-205c-4967-b416-44a9d1f33487:string:urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
      shipper: {
        address: {
          street: '9e24f042-c370-4003-91a6-8e4f558ddb17:string:456 Orchard Road',
          country: '0a05c16c-e238-4a62-9fde-e2d622350031:string:SG',
        },
      },
      consignee: {
        name: 'c416013b-c152-460f-bd72-f081086433d7:string:TradeTrust',
      },
      notifyParty: {
        name: '82be28ac-fcfa-4f7b-8a82-1f30403d95cc:string:TrustVC',
      },
      packages: [
        {
          description: '460031f3-07f5-4956-9040-e65fb44eb1c8:string:1 Pallet',
          weight: '645406fb-512a-4da8-957a-70a2b8383439:string:1',
          measurement: '675087d8-6a3c-4d50-8a58-b8a217e5f21d:string:KG',
        },
      ],
      $template: {
        type: 'bad7a45b-e5a7-4362-92b2-c02dea805395:string:EMBEDDED_RENDERER',
        name: '81e3f6ce-e6d1-4551-a4eb-110fe94eb59a:string:BILL_OF_LADING',
        url: '73d0b75d-62d0-415f-a97f-9776cdf5278f:string:https://generic-templates.tradetrust.io',
      },
      issuers: [
        {
          id: '56dbf8f7-5b8e-41b2-9cf3-da7fd87d361d:string:did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90',
          name: 'e517c4f8-4375-49c0-b398-48c83b22deb3:string:DID_ISSUER',
          identityProof: {
            type: '29c295a2-77d8-4b46-9019-26fb75c80767:string:DID',
            key: '53d35597-fef1-498d-affe-e27a1e0c61de:string:did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
          },
          revocation: {
            type: '1a291e7a-5c9c-48bc-a75f-1f08897f0e13:string:NONE',
          },
        },
      ],
      blNumber: 'bf6df0fa-0c80-45de-b7c5-b423564e35f7:string:BL123456',
      scac: 'da23e554-bbf5-4b5b-8eaf-5b68f3e476ca:string:OOLU',
    },
    signature: {
      type: 'SHA3MerkleProof',
      targetHash: '378d3e9ccf7835b2673e0ec9290244b4f8629ec5423b48ed632ddf537effd557',
      proof: ['91e7a77a7586d115e2fe797d9830ee257c29cd7c4695c0dd70ce073ad88f3174'],
      merkleRoot: '2245cf422b8a7ffc8a6ab1b846e0fb95cf831f9c720ac06942b9e95a1d1f6200',
    },
  },
  {
    version: 'https://schema.openattestation.com/2.0/schema.json',
    data: {
      id: '0716129e-fb82-44b2-9c7c-84bcfcf36448:string:urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
      shipper: {
        address: {
          street: 'e5c8ebb6-af6e-4db5-a270-a5499241d810:string:456 Orchard Road',
          country: 'cdf7584c-9b63-4819-b6ac-f8941ba167b1:string:SG',
        },
      },
      consignee: {
        name: '7e93090c-e687-4e2e-b0c8-4fc5dd4a28a6:string:TradeTrust',
      },
      notifyParty: {
        name: 'c3a2590c-5d19-48da-809d-82e3a472448f:string:TrustVC',
      },
      packages: [
        {
          description: 'ebaa5407-8c70-49de-8385-87202f9b1c75:string:1 Pallet',
          weight: 'd2c1e503-15c6-42b1-9e4c-2e58eff0e3e1:string:1',
          measurement: '86099c2a-aaca-46ea-b157-1c2ce3c7071d:string:KG',
        },
      ],
      $template: {
        type: '85e831c5-0d01-466b-999b-72573590b778:string:EMBEDDED_RENDERER',
        name: 'ead36f61-c92b-4002-a77d-d917d03c5d11:string:BILL_OF_LADING',
        url: 'c35ee11c-de1e-4789-8ef0-3459d485ad19:string:https://generic-templates.tradetrust.io',
      },
      issuers: [
        {
          id: 'cdef649e-93a8-4737-8172-2f34b8f77bfe:string:did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90',
          name: '65d27bfb-a473-4d90-851f-d20dd2b1d1a2:string:DID_ISSUER',
          identityProof: {
            type: 'f84de798-f9c5-4b8f-a185-5086ea8ecd9b:string:DID',
            key: '4d462152-38a0-4a04-bf5b-690b11738302:string:did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
          },
          revocation: {
            type: 'ad2e4c53-1847-4795-8fa0-6c21c1475800:string:NONE',
          },
        },
      ],
      blNumber: 'b5b895cb-8c96-49cf-b741-f42ca707e577:string:BL123456',
      scac: 'f9fe7ea5-11a5-42e5-8f14-506a6ff63af3:string:OOLU',
    },
    signature: {
      type: 'SHA3MerkleProof',
      targetHash: '91e7a77a7586d115e2fe797d9830ee257c29cd7c4695c0dd70ce073ad88f3174',
      proof: ['378d3e9ccf7835b2673e0ec9290244b4f8629ec5423b48ed632ddf537effd557'],
      merkleRoot: '2245cf422b8a7ffc8a6ab1b846e0fb95cf831f9c720ac06942b9e95a1d1f6200',
    },
  },
] as unknown as v2.WrappedDocument[]);

export const WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3 = freezeObject({
  version: 'https://schema.openattestation.com/3.0/schema.json',
  network: {
    chain: 'MATIC',
    chainId: '80002',
  },
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
    'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
  ],
  credentialSubject: {
    id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    shipper: {
      address: {
        street: '456 Orchard Road',
        country: 'SG',
      },
    },
    consignee: {
      name: 'TradeTrust',
    },
    notifyParty: {
      name: 'TrustVC',
    },
    packages: [
      {
        description: '1 Pallet',
        weight: '1',
        measurement: 'KG',
      },
    ],
    blNumber: '20240315',
    scac: '20240315',
  },
  openAttestationMetadata: {
    template: {
      type: 'EMBEDDED_RENDERER',
      name: 'BILL_OF_LADING',
      url: 'https://generic-templates.tradetrust.io',
    },
    proof: {
      type: 'OpenAttestationProofMethod',
      method: 'TOKEN_REGISTRY',
      value: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
      revocation: {
        type: 'NONE',
      },
    },
    identityProof: {
      type: 'DNS-TXT',
      identifier: 'example.tradetrust.io',
    },
  },
  issuanceDate: '2021-12-03T12:19:52Z',
  expirationDate: '2029-12-03T12:19:52Z',
  issuer: {
    id: 'https://example.tradetrust.io',
    name: 'DEMO TOKEN REGISTRY',
    type: 'OpenAttestationIssuer',
  },
  type: ['VerifiableCredential', 'OpenAttestationCredential'],
  proof: {
    type: 'OpenAttestationMerkleProofSignature2018',
    proofPurpose: 'assertionMethod',
    targetHash: 'fb8e4b7199e5ddeb6b3a24e508108de965e4f0f4ff55248c5a5a9325223b65d9',
    proofs: [],
    merkleRoot: 'fb8e4b7199e5ddeb6b3a24e508108de965e4f0f4ff55248c5a5a9325223b65d9',
    salts:
      'W3sidmFsdWUiOiIxYTQ3NDVjYjJkMmRiNTFlMzIyMTZjOGFmNDc1ZjUwZmIzMDQ2ZDQwMDgwMGIyM2NlYWEwNzRmZmZlYzdhNjI1IiwicGF0aCI6InZlcnNpb24ifSx7InZhbHVlIjoiMTMzM2FkNGYxZmViM2MzNjczZDE3YzBmYTMxNWE1ZGI3ZDY3YTEwNWQ4YWNlZGNlZTEzYjQ0YWVmOTNmZDRhMyIsInBhdGgiOiJuZXR3b3JrLmNoYWluIn0seyJ2YWx1ZSI6ImY0OTZjZmVjZjdlMGNmYTEzNWI2OTg4OTA4MjFmYzg4Nzk3YmEwNzJmNDU5MzA2ZTI5YjA2MmRlZDU1ZDgxODYiLCJwYXRoIjoibmV0d29yay5jaGFpbklkIn0seyJ2YWx1ZSI6ImRhZDQ0YzZkMjNmNDVmMDBlNWJjZTc2MjRkZDZhM2YzYTU2MGI1NzFmMjIxODJmZTlhZTcxNDJiMjE0NmU3NjEiLCJwYXRoIjoiQGNvbnRleHRbMF0ifSx7InZhbHVlIjoiNThjZjkzZjJiM2Y5OTQzMmRkZThlYTc4NjE1YzY1N2FjMTIzNzNhYWJkZmE0ZjQxZjljMjM1OTk5OTk0MzVhNiIsInBhdGgiOiJAY29udGV4dFsxXSJ9LHsidmFsdWUiOiIyODkwMjYwNTQ4OWUwYmM1NmY0NTcxM2FiMjA1MDkzNTM1YjFiMjhmNjAwZjE0OWNhMDJkNDA2MzZkOTg0NDhmIiwicGF0aCI6IkBjb250ZXh0WzJdIn0seyJ2YWx1ZSI6ImQ1OTRhNjgyZTIxNjMzMWY3YTBlMDhiMDYwMDNjZGIyZjYyMWQxYTMzNjMyNTM0ODE4NDllYmJkOWEyZjVmN2QiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QuaWQifSx7InZhbHVlIjoiY2U5MTFmYWJhNjk4NWY0ZmUzYzY4ZDNlOTNiYzlmYjY2MTgyMzQxYzk5MDA0ZDJiMGRhYjc1OTFjYmM0YzE0NiIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5zaGlwcGVyLmFkZHJlc3Muc3RyZWV0In0seyJ2YWx1ZSI6IjQ1NzEzY2FmMTM1ZDc1NTcyMWJlNmFiMGEzZDE4NTY2NGYxYTA4ZDU2MzJkYjk5MmI5ZGQ2ZDg3ZWEwOTg2ODMiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3Quc2hpcHBlci5hZGRyZXNzLmNvdW50cnkifSx7InZhbHVlIjoiM2EwNGJmNjI5ZjVmMTVlOTljZmY5Y2Q1Nzc1ODk4Mjk4MDA1NzkxNzVlMzUyMTQxYTkzMjhkYjczYmE4MmQ1YyIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5jb25zaWduZWUubmFtZSJ9LHsidmFsdWUiOiJmYWY4YmFiNzQ5MGNiZDkwN2IzYTM1MThmYjhlZTA4MTlhZjA4MTBlOTE2MWM3N2I0NGU1ODQxMWNiNjQxOThkIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0Lm5vdGlmeVBhcnR5Lm5hbWUifSx7InZhbHVlIjoiODAxYWJjZTk4MzcwZWU4OGIwNWU1MWY1ZDhiYWI0NmI3NDhiNWI2ODI4OWU0ZWE2MDlmNmFiMDBlZjRjZDdjMyIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5wYWNrYWdlc1swXS5kZXNjcmlwdGlvbiJ9LHsidmFsdWUiOiI5NTdmODgwZTRjYTNkNGJmZTNjOTEzMzI4MzdiYTdhYWExNDUzYmJhYzBlYzBmMjgxZDRjZGRhMWY5MjM2ODFkIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnBhY2thZ2VzWzBdLndlaWdodCJ9LHsidmFsdWUiOiI0NDUzZDMzMDFjMjRhMGViYmNkMzA5YTVjMjA3NzgzZjgzMTM2N2FkZTBiNzAzODRkNjJkMzc4NDcwNmE5Mjc5IiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnBhY2thZ2VzWzBdLm1lYXN1cmVtZW50In0seyJ2YWx1ZSI6ImQ4MjEyMGFlNzcyNzhjY2QwNDA2ZWIyNTgyODQyMmFjYTFmYTIzNjJmN2VlYWQzNzFlYjlhNDFkNzQwMGZiM2EiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QuYmxOdW1iZXIifSx7InZhbHVlIjoiM2VlMjM5ZjE3YzMyNGM3MjY2MGQyZTY4YzUyNTNmOWU0ZmM3MjU0MzY1ODIzZWFmODQzZGViZjk2ODU0MmM5NCIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5zY2FjIn0seyJ2YWx1ZSI6ImZhM2MxMzM2ZGY1MzQwZGE4M2RkYzE3MWY5ZWRlODIxMDE3MDYwYjU0MmI4ZmUwYmI2YzY2Y2U3OWNjOTJlYzUiLCJwYXRoIjoib3BlbkF0dGVzdGF0aW9uTWV0YWRhdGEudGVtcGxhdGUudHlwZSJ9LHsidmFsdWUiOiJhYjVjNTlmY2E3YWZjYTE0MTBiYmY3MDQyNzc1NWNmNDA1NTJhN2U5MjkxMmUwMzc0ZmJiMDNlNDRiZTY0ZDU5IiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnRlbXBsYXRlLm5hbWUifSx7InZhbHVlIjoiNjI3MmQ4N2Y4NjU2YWE2MGY2ZDMxYTNhYTUwZDc2NWQwYmYwM2M3M2MwYTQ2MGI4OWE0MWJmZDQ3NDUyODNkNiIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS50ZW1wbGF0ZS51cmwifSx7InZhbHVlIjoiMzgwOTIwNmY4N2Q1NTdhNWUyOTk2MmQ1Y2RmZjljYzQ3ZTNjZTNjNWJkY2VkNjFlNjEwMmYwNzlkZWQyOWQ4MSIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi50eXBlIn0seyJ2YWx1ZSI6IjU2MDliY2IzYzAzZGQ5MDhhODJlMTZjZDVmMjZjOGFkZDMzOGMyYzA1MzE1NTE0MDQwNTQ3ODc4OWNhYjRiOWIiLCJwYXRoIjoib3BlbkF0dGVzdGF0aW9uTWV0YWRhdGEucHJvb2YubWV0aG9kIn0seyJ2YWx1ZSI6IjAyN2RmZWIwN2NmMmNlOGMzZjM2Y2I4YzgxZjI5YmRiNTEzY2ZhMmU3NDlhM2FhZWM0MWMzOGMwNjA1OGM3OTkiLCJwYXRoIjoib3BlbkF0dGVzdGF0aW9uTWV0YWRhdGEucHJvb2YudmFsdWUifSx7InZhbHVlIjoiMjU0OWNlNmNhNGZjMzZmN2NjNTVkODVkNDdjYjEzOTAyOWQ5MjBjZTQ3MjdjNjkyNWZkZGNiNTM1MzFlYzQ2ZCIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi5yZXZvY2F0aW9uLnR5cGUifSx7InZhbHVlIjoiYTcxNzNjODI0YmE1ZjkzNzcwYzM5M2RiYWEwOGRhYzNhNTA5MDM1N2QxMDg0NmNiYmZkY2ViMzIxOTg4NGM5MyIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5pZGVudGl0eVByb29mLnR5cGUifSx7InZhbHVlIjoiNmY2YmY0Yjk5YzQ2MmVlMDZlZjM3MmVlNDJiNzZmNTNkMzViYTFiNzhlZmMyZTljMjNhOTRkZThmOGFhOGRhYiIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5pZGVudGl0eVByb29mLmlkZW50aWZpZXIifSx7InZhbHVlIjoiOWY4NzUyN2RlMjJlZGNmOWM1Nzc4NGRiY2NlZDZiOTdiMjg3MDg1YTc5NzA0NDhkZWM3YTZiMjI4ZGNhMTFjZCIsInBhdGgiOiJpc3N1YW5jZURhdGUifSx7InZhbHVlIjoiYTAxYTAwYjA4NDQxOTk5OTA3OTgyNGFlMzJjZTcyOTQwYzBiYzE0NTE4ZmE4ODE3Y2ViZjBjY2NiNTA2YjgzYyIsInBhdGgiOiJleHBpcmF0aW9uRGF0ZSJ9LHsidmFsdWUiOiJlZmQ4NTU2Y2Y5NzAxNGNkYzk1MTMxZjIyYzNlMzI4ZGQ1MGMwNzQ5OGI5ZjZlMTFhNjhmOWU5ZWFiODI3NDk5IiwicGF0aCI6Imlzc3Vlci5pZCJ9LHsidmFsdWUiOiI0OGI4MTJiYmI3NDNkNmUyZmJlMzA4NjEyNzRhOGY1NGM3MTM5MDdiY2U4NWQ0ZjliNzlhODQ1Njk2OGYwZmMwIiwicGF0aCI6Imlzc3Vlci5uYW1lIn0seyJ2YWx1ZSI6IjQ5ZDJhM2Y2NWIyZTY2YmZmNDkxN2VlZTY0N2M3ZTBlZWQyYmJmZTFlZjI3M2JlYzk1MGQxZDY4ZmYzYTQ1ZTkiLCJwYXRoIjoiaXNzdWVyLnR5cGUifSx7InZhbHVlIjoiOGMyZTIxMWM4ZGVhOTcwYTE1OGU4MzM2ODNhMTBiYzlkMTZjZDRiN2U3OWFhYWM1YjQ0NTE4OTNmM2EwZGM0MiIsInBhdGgiOiJ0eXBlWzBdIn0seyJ2YWx1ZSI6IjI2NzhhZmUwZWZhNzdhZjU5NTRmYjcwZmU2NDAxNDRmNzhmNzM0MDhiYzBiZTBkM2Q2YmY4MjFkNDNlNjVlMDkiLCJwYXRoIjoidHlwZVsxXSJ9XQ==',
    privacy: {
      obfuscated: [],
    },
  },
} as v3.WrappedDocument);

/* Signed */
export const SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3 = freezeObject({
  version: 'https://schema.openattestation.com/3.0/schema.json',
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
    'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
  ],
  credentialSubject: {
    id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    shipper: {
      address: {
        street: '456 Orchard Road',
        country: 'SG',
      },
    },
    consignee: {
      name: 'TradeTrust',
    },
    notifyParty: {
      name: 'TrustVC',
    },
    packages: [
      {
        description: '1 Pallet',
        weight: '1',
        measurement: 'KG',
      },
    ],
    blNumber: '20240315',
    scac: '20240315',
  },
  openAttestationMetadata: {
    template: {
      type: 'EMBEDDED_RENDERER',
      name: 'BILL_OF_LADING',
      url: 'https://generic-templates.tradetrust.io',
    },
    proof: {
      type: 'OpenAttestationProofMethod',
      method: 'DID',
      value: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
      revocation: {
        type: 'NONE',
      },
    },
    identityProof: {
      type: 'DNS-DID',
      identifier: 'example.tradetrust.io',
    },
  },
  issuanceDate: '2021-12-03T12:19:52Z',
  expirationDate: '2029-12-03T12:19:52Z',
  issuer: {
    id: 'https://example.tradetrust.io',
    name: 'DEMO TOKEN REGISTRY',
    type: 'OpenAttestationIssuer',
  },
  type: ['VerifiableCredential', 'OpenAttestationCredential'],
  proof: {
    type: 'OpenAttestationMerkleProofSignature2018',
    proofPurpose: 'assertionMethod',
    targetHash: '8f832ec1d27e09b2530cd051c9acea960971c238a3627369f33cdc58af9548cd',
    proofs: [],
    merkleRoot: '8f832ec1d27e09b2530cd051c9acea960971c238a3627369f33cdc58af9548cd',
    salts:
      'W3sidmFsdWUiOiI2MmZjMzg5NWVmZjg1ODI5Mjc1YmY5MzQxMzI4N2QwY2NjNDliYTcyY2VhOWM1NTA2NjFjYzk4YTA1YTczNjU0IiwicGF0aCI6InZlcnNpb24ifSx7InZhbHVlIjoiYzI1NWZhZmFkNWQ2YmFlODE3YWJmNDExOGVmZDMwODRiNDMwOTIyZjE4MDU2OGE2NmY4ZDFjZWUxMTFjZDA3NyIsInBhdGgiOiJAY29udGV4dFswXSJ9LHsidmFsdWUiOiIwZWZkZDkxOGFjOGZmYWU1ODQ0ZGE4M2U3YTYyNWJhMGYyOGUyYjJlMTVlMWFlNjYzODFmZDAyYmEwZmYwOWQxIiwicGF0aCI6IkBjb250ZXh0WzFdIn0seyJ2YWx1ZSI6ImE4YjY2ZDEzNmRlYzYxOGM3ODI1ZmVjOTg3ZTM2NWUzYzlmZjMwNzg3NmI0MDc2NWUwZGI2MjdmZjA1NTAxNGIiLCJwYXRoIjoiQGNvbnRleHRbMl0ifSx7InZhbHVlIjoiMGQyMDkyMDU2MjBmZjg1NGU5MjZhNDI1YTZmYTk3ZDdkZWM0YjNjODE4N2YzNmM5YTZjZGY0OGYxMjMzNzgwNyIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5pZCJ9LHsidmFsdWUiOiI3MTdmNDg1YjFiMGNjMTFjZjExODNkMzkzYWE1MDc5ZDljNzYzZjY0NmMxNzg1MmJjZTY1OTNmOGJjZGRmM2IyIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNoaXBwZXIuYWRkcmVzcy5zdHJlZXQifSx7InZhbHVlIjoiNzUzM2M0ZDQxZmQ5Yjk2NjlkZmUyOWMxMmUyYTc1MDA1MzEyYjdjNmY0OWEzZDI2Yjk3Yjk3MTY3ODMxYmM4YyIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5zaGlwcGVyLmFkZHJlc3MuY291bnRyeSJ9LHsidmFsdWUiOiJkNDc2NTM1NzNlZTAxNzg5ODljZWU1ZmU2NjBiZjA4MzZmZDQzZTU1MmQ0M2JkMTM0MTg2ZGY3MTBmNWFkZTBhIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LmNvbnNpZ25lZS5uYW1lIn0seyJ2YWx1ZSI6ImFjZGIyY2U5Y2YyMzlmZWYyMjE1MTNiZDRiZTAxNTk0OTc4ZmRlYjQ4ZjQ0NTk1NTkwOGZkYzc1ZTQxYmEzZWEiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3Qubm90aWZ5UGFydHkubmFtZSJ9LHsidmFsdWUiOiJkYTkxODQzNzIxZjU2MDljOGM3ZTE1MjgzNzBmZDdkMTA0ZGFmZGI3OWEzZDViMjMxZDI0MTM3NTZmMmRjNzZkIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnBhY2thZ2VzWzBdLmRlc2NyaXB0aW9uIn0seyJ2YWx1ZSI6IjE4Y2JjNTQxZmM1YzZmZDI5NzFlMjBiNGU5ZmQ1MDdmMDA4MzZhMTRkNWZmYjY3ZGEzNDYwMTFmYzk1MDllMjAiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ud2VpZ2h0In0seyJ2YWx1ZSI6IjJlM2I4YzRiNzI5YjAxMjY2MGNkOTU2MTE1NGFmZGZhOGM0MmRmMDcxZDBlZjBhNjZhZTViZjNkMmZkYmU0YTciLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ubWVhc3VyZW1lbnQifSx7InZhbHVlIjoiMzI1NTVmNjkyNDEyM2JhMDFjOGU2MWFhN2U3MGE1MGY5YWI1NzdlYmY2ODJmYTk3MTVkNWEyZTU5M2FlMWFlMiIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5ibE51bWJlciJ9LHsidmFsdWUiOiIxYjhhMTVhYzgzZmQ5MjUxNzVlNTRlODc4MGI2YWQzZjUxYzQwYjlhOGJlYTA3NGQzZGY1Y2U4MDI0MjAyMWNjIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNjYWMifSx7InZhbHVlIjoiNTVlZGMxNjRiMWE5ODFjYWMzYTBiNGFlNDlmYzg0Y2Q0ZTY3YTBkNjZkODE4YjVhODcwOTUyMDgzMWI3MzA1NiIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS50ZW1wbGF0ZS50eXBlIn0seyJ2YWx1ZSI6ImMxYjI4OWZjYjY0OGY4NTU0Zjc4NmIxNTM1MmY3ZGVmYmI4Mzg3ZDBmMWI0NzFmYTM4M2I3YWMzYWQzY2E1OTYiLCJwYXRoIjoib3BlbkF0dGVzdGF0aW9uTWV0YWRhdGEudGVtcGxhdGUubmFtZSJ9LHsidmFsdWUiOiI0MDcxMTVmNjI0M2Q5NGJiNmQxYjUwMDU5YWM2MjI2ZGQ4NTQ5NTdlNTRmMzBhODI3ZjA2ZWM1YTFmODA4N2VkIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnRlbXBsYXRlLnVybCJ9LHsidmFsdWUiOiI3YTM3NWY2MDkzMzA2MDFkYTQxODQwNzQ2ZGQyYjQyMTEwMDY3ZTMwOWQxMWY5MGJiODc3MmQ2N2U5NjMyNzdhIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnR5cGUifSx7InZhbHVlIjoiMWU1YzJhYzRmYTNjN2U1NjQxYTJhMGQ3OGU1MTJjOTg1OGMzODI2NGJmMDMxNmI2ZGY2MDRiOTVkYzUyMmUyOSIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi5tZXRob2QifSx7InZhbHVlIjoiYzIxNjg5M2JhOWY5MjAzNmMyNGFlMGQ3MTQ4NjlkMzhmZjM3ZjgyZDhkYTc2YjBjZmNjYzRlM2RkZjY1YmQ5MSIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi52YWx1ZSJ9LHsidmFsdWUiOiI1ODk2MjA2MGZmZmY4ZDQyMGVjYjA1YjJjYTNiYzc5YWJiNDU4YTRlNzc2OGZkY2ZiYjM2ZmRmOWUyNDJlZDg0IiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnJldm9jYXRpb24udHlwZSJ9LHsidmFsdWUiOiIxYmNmN2M4NWJkODQyNzI1OTEzNzZmMjk1OWUwMjk5MDdmZmM4N2M4MmM2NzE1NGJjMGQ2ZWE2MTAzMmJkZjE2IiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YudHlwZSJ9LHsidmFsdWUiOiIzMzVkYjA4MzdlNDFiNDg0YWI1ZjYxYTI4MTA0M2FhODVmMWM5NzMwNTU4YmUwOGZkZTAwNmI3YTIwMjljMjJmIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YuaWRlbnRpZmllciJ9LHsidmFsdWUiOiI2OWIxMThkZjM0NjQ3YjA1ODhkOTc1OWYzYzM2MzllZDExZDIzNWJhYWUyMzAwMGRjN2M3Y2ZlYjA5Yjc0YmU2IiwicGF0aCI6Imlzc3VhbmNlRGF0ZSJ9LHsidmFsdWUiOiJjNDc4MDVkMmIwNGEzNGQ3Y2UzOGVjMDAxZDI4Y2MxYjk3MzNmODgzYTRlYTJjNGQzYjBlYTRiMWZhOGFjYjkxIiwicGF0aCI6ImV4cGlyYXRpb25EYXRlIn0seyJ2YWx1ZSI6ImQyYWNiZjYwYzEwNDc2ZmNiOTQ0MDg2YTAwODRkMjIzZWJhMjdhNzQyYzNmN2JhNWU5ZWE1YjQ4MTE0NDljN2IiLCJwYXRoIjoiaXNzdWVyLmlkIn0seyJ2YWx1ZSI6IjBlNWVkOGNiMDFiZTA0ZGY2OTg0MzlhYTMyNjZjNTY0MGMxNjRlN2VmMTBjYTJjNGNmNWRiZmQzMWQzYjAxZTEiLCJwYXRoIjoiaXNzdWVyLm5hbWUifSx7InZhbHVlIjoiZTgyMTFhZTc2ZjYyMjI4N2Q2ZWM1MzkyNzg4ZDY1OTk1MGRlZWQ5MTg0MjcxZjRjZTFiZTFmNGU4ZWE0YmJjNCIsInBhdGgiOiJpc3N1ZXIudHlwZSJ9LHsidmFsdWUiOiI0MGE0ZTAwYjY0YjEzMWYwYTM2NTM2MDAyYjNjNjJkY2ZmNTI1ZDUyOGNiZGYzZTAxYTQ5ZDcwMzBhMTQ4MjhlIiwicGF0aCI6InR5cGVbMF0ifSx7InZhbHVlIjoiYWZlOTc0OGZkM2U0MGFmZGQyNWI4NmNlZTA5YTJhNjE3N2MzNDZhMDY4ZjJhNmZkMzk4OTNiN2Q2MTJkZWI0MyIsInBhdGgiOiJ0eXBlWzFdIn1d',
    privacy: {
      obfuscated: [],
    },
    key: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
    signature:
      '0x836a2547654da43f01641b3a0efff6797adc7e8b806d65cb9c67e25b119c70c34aa4c73a14d8138f52c05f6f7e1048ead225c85eb981fac8c2207895e48f14a91c',
  },
} as unknown as v3.SignedWrappedDocument);

export const SIGNED_WRAPPED_DOCUMENT_DID_V2 = freezeObject({
  version: 'https://schema.openattestation.com/2.0/schema.json',
  data: {
    id: 'e9d95822-dfd4-4f0a-9b3a-b21de76fb9e9:string:urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
    shipper: {
      address: {
        street: '76b35ba3-a12b-4626-9d8e-21cbfee7f082:string:456 Orchard Road',
        country: '89273055-befa-4940-bcbf-6cd531d9b060:string:SG',
      },
    },
    consignee: {
      name: '137eb8b9-2da0-4608-8bd3-17e495b332cd:string:TradeTrust',
    },
    notifyParty: {
      name: 'bd6b7b59-c3c4-4ab2-8c4a-b68cf9124f02:string:TrustVC',
    },
    packages: [
      {
        description: '6d3367f0-dee3-475a-989d-e62c97b8557e:string:1 Pallet',
        weight: '8e2ea698-df0d-4e6f-9a3c-a7e4472b86c9:string:1',
        measurement: 'ed505681-9c14-4bb9-943d-455b4fa6d58c:string:KG',
      },
    ],
    $template: {
      type: 'ac26f70e-2932-46f7-bd9a-1a758538289f:string:EMBEDDED_RENDERER',
      name: '0c05e656-2d52-4b38-945c-d9f085588dd3:string:BILL_OF_LADING',
      url: '55896d86-6099-4470-81c6-79091ee301f0:string:https://generic-templates.tradetrust.io',
    },
    issuers: [
      {
        id: '8c61d8e4-5ad3-40bc-975d-babf0a72db7e:string:did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90',
        name: '912d9616-5f69-4296-9b88-1eca73b786df:string:DID_ISSUER',
        identityProof: {
          type: 'f9ae9ee8-dcf0-407b-a53f-8f2e1eb3e1b1:string:DID',
          key: '07c2beca-d6e7-4920-9377-e3d100adbec1:string:did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
        },
        revocation: {
          type: '0e7f7d52-83e3-4df7-9a82-ff9571b45310:string:NONE',
        },
      },
    ],
    blNumber: 'e905d5f9-1562-447a-acab-a747853180fe:string:BL123456',
    scac: '206cf8b4-48fa-4822-8db4-7c9c4c529500:string:OOLU',
  },
  signature: {
    type: 'SHA3MerkleProof',
    targetHash: 'dabd017ef67a553e467806437473d1707a8079328e4fe9a9471be0be536cab9d',
    proof: [],
    merkleRoot: 'dabd017ef67a553e467806437473d1707a8079328e4fe9a9471be0be536cab9d',
  },
  proof: [
    {
      type: 'OpenAttestationSignature2018',
      created: '2024-11-08T09:47:52.546Z',
      proofPurpose: 'assertionMethod',
      verificationMethod: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
      signature:
        '0x6706675e86e388962cc914dda6594850d995088e87f2bb4e6153cd345a3409503a111298efdcf95b9e55416008229e48eeb87f5f6ff3d4058c0681fa3f7d39de1b',
    },
  ],
} as unknown as v2.SignedWrappedDocument);

export const BATCHED_SIGNED_WRAPPED_DOCUMENTS_DID = freezeObject([
  {
    version: 'https://schema.openattestation.com/3.0/schema.json',
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
      'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
    ],
    credentialSubject: {
      id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
      shipper: {
        address: {
          street: '456 Orchard Road',
          country: 'SG',
        },
      },
      consignee: {
        name: 'TradeTrust',
      },
      notifyParty: {
        name: 'TrustVC',
      },
      packages: [
        {
          description: '1 Pallet',
          weight: '1',
          measurement: 'KG',
        },
      ],
      blNumber: '20240315',
      scac: '20240315',
    },
    openAttestationMetadata: {
      template: {
        type: 'EMBEDDED_RENDERER',
        name: 'BILL_OF_LADING',
        url: 'https://generic-templates.tradetrust.io',
      },
      proof: {
        type: 'OpenAttestationProofMethod',
        method: 'DID',
        value: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
        revocation: {
          type: 'NONE',
        },
      },
      identityProof: {
        type: 'DNS-DID',
        identifier: 'example.tradetrust.io',
      },
    },
    issuanceDate: '2021-12-03T12:19:52Z',
    expirationDate: '2029-12-03T12:19:52Z',
    issuer: {
      id: 'https://example.tradetrust.io',
      name: 'DEMO TOKEN REGISTRY',
      type: 'OpenAttestationIssuer',
    },
    type: ['VerifiableCredential', 'OpenAttestationCredential'],
    proof: {
      type: 'OpenAttestationMerkleProofSignature2018',
      proofPurpose: 'assertionMethod',
      targetHash: 'e0de44adc67499777af35e8d94c07df080624d06187dce8901f2f8a435fc7b7d',
      proofs: ['81a2b26f7adbb6181fd44b9321cac6198a760a2c95edd8ef64cad747e935ecbc'],
      merkleRoot: '722e6757c585cbfb60ba1d41fae9285e2ddcc2143f414439bb14dae1820e45ea',
      salts:
        'W3sidmFsdWUiOiIzODk4ZGZhM2Y3NjMyOGM5NmIxM2NiZTU1NTQ2MDIxNDVmY2QzZGIzMzM0NDcxZmIzMzZmMzU3ZWViMGUyNTE5IiwicGF0aCI6InZlcnNpb24ifSx7InZhbHVlIjoiM2MzZGNjOWNhYmJmMzViOWQxZTA2NWEwMmEzNDFhM2JmZmM3Y2Q0YzY4OWY0MjI3ZTU0M2VmMTYzMWJlZmY2MyIsInBhdGgiOiJAY29udGV4dFswXSJ9LHsidmFsdWUiOiI3YzYyMzAxNjk4MjRjYmQ4Nzc0NWUxY2MxNWE5OTViMjE0NmNmOTU4ZjI4MjNiYTcxYWMyNmFjNGRiM2IzYWVhIiwicGF0aCI6IkBjb250ZXh0WzFdIn0seyJ2YWx1ZSI6ImFmYmRlYjlmMzg5MjA5MWY2MDkyMWI3NTdiY2I4ZDNjZTMwNDRjMWRjZjBjOTFlYzIyYzcwY2E2MDEwNDVlOGYiLCJwYXRoIjoiQGNvbnRleHRbMl0ifSx7InZhbHVlIjoiZDY5YTNkNGE2MWEwMDg5YzkyZWFkZDczNDlkYmZkMzllMjUxMWUyNWRmNmE2ZWJmYzYyZWNiMWZlMzM2MmU5YiIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5pZCJ9LHsidmFsdWUiOiIzZGM5Zjc5ZWZhOGU1NmJiNWI0MDE2OTUwOGNiZGFlNWMwNmVmNzdjYWViYjE1ZTU2YTM4YThlYTlmNmQ3ODJiIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNoaXBwZXIuYWRkcmVzcy5zdHJlZXQifSx7InZhbHVlIjoiYjVmOGQ4NDA2OTIwMWVlYWM1NTk5NzcwNjQ5YmQyNTQwMTE0MDhmNzA4NWZiYmNkOTZmN2ZmZGQ2YTI4YWY4NyIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5zaGlwcGVyLmFkZHJlc3MuY291bnRyeSJ9LHsidmFsdWUiOiI2MTY4NzQwYTFmZDFlMzgwNWU3MGQzMDAwMzhhMDgzN2Y4YjJiYzdjMDdhMTMzYzA1YjYzM2M0ZWU3ZTI1NGNlIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LmNvbnNpZ25lZS5uYW1lIn0seyJ2YWx1ZSI6ImQ0YTEwMjNhODkwODE1MDcwYmQ5YmEzMzk5MTNiNmVlMjgwZDVkZDQ1ZDUxMWQ0N2FhMzcwMzViYTUyZTgzYzkiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3Qubm90aWZ5UGFydHkubmFtZSJ9LHsidmFsdWUiOiJmZmRlNTQyMzNlOTQ5MzNjOTM4ZmI3ZmY3NTRhYzc1YTQ0ZjlhMzZkN2M0OWU0MzVjMzkwZjBkNjM2OGE4MzcwIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnBhY2thZ2VzWzBdLmRlc2NyaXB0aW9uIn0seyJ2YWx1ZSI6ImRmMzE5YjViNGM1NDI5NDA0OTBjYTEyODBhMjhmZDc4NTgyZTQwZjZjOTU5YmZmNGVjNGRmZDQ1ZWI1ZTFhMTUiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ud2VpZ2h0In0seyJ2YWx1ZSI6ImE2YTE3YTRkZGMzNzhjYzVkNzExNTZjMDUxODhlMmI1Zjg3NTA0NjdkNjhiY2RkM2Q4NGU0NDcyOGNiZmMzMTYiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ubWVhc3VyZW1lbnQifSx7InZhbHVlIjoiNDk3Y2QyMTkyZDVkM2JlYzg4MjVkZTM2YzIxODgxM2NjZjM2Y2FiOTA0MzQxMTVkZGQ0MjI3OWYyMDRmMDVjZCIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5ibE51bWJlciJ9LHsidmFsdWUiOiIyODk5ZDc3NTNjMDNmZmFlOTBhNzVhY2ZlNjllNzY3Y2Q2OWJiN2UxZWNkZjk1Y2FhNjg2N2I2OGNkMGQ5ZjM4IiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNjYWMifSx7InZhbHVlIjoiY2U4YWVkZTIyZGQ1ZjU2Y2QyNWJmMGM5MjFjODc0YWMzMGM5ODRhNjc2MDUxZGJkMDAxMDM4NWE0ZjMzZDFhNCIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS50ZW1wbGF0ZS50eXBlIn0seyJ2YWx1ZSI6IjY4M2ExYTQ3YjUwYzIyNjlkMTNmNGM5ZmZiYzFjOTI1N2FlZjY3NjgxMmU0ZTgzMzhmYzI5MmNkYTYwODE1YjIiLCJwYXRoIjoib3BlbkF0dGVzdGF0aW9uTWV0YWRhdGEudGVtcGxhdGUubmFtZSJ9LHsidmFsdWUiOiI1ZTViMzQyYzE5N2NhOTc5MjM3NzhhNTBiOTdmYTUwNDFkNTdjOTUyMmQ2ZThiMDQ3ZDM3M2FjMjgwMzFhNDI1IiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnRlbXBsYXRlLnVybCJ9LHsidmFsdWUiOiJkODg3ZDYyZjMzOTI3YzFkMzUyMDk4NDllOTEzMzFhMGY1OGEzZWVjN2VhMjVjNDAyMjYxZDVjYWRlOGVjYTBkIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnR5cGUifSx7InZhbHVlIjoiNWVhNmYwZjlhMzg3Yzc5N2U4OTJiM2IyMGNjNTY4NDJiZTEwYWNkNTA4MjVlMThmMTEyYjY3ZDI2NWY3ODgwZiIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi5tZXRob2QifSx7InZhbHVlIjoiZDc1NGM2OThjOWI3ZDY4ODI4Mzk1YWM1ZWZlMWIzNTgwYzNjYThjNDIwMzJlZDllMTI5MTE0ODEwMDJlYzJlOSIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi52YWx1ZSJ9LHsidmFsdWUiOiJmY2Y2MGJjNDU3NDYyZjRlOTkwM2Y0YjMxMjM1NjdjODc5NGU1ZGQ2YjMxZmZlNzcxNWY0YWE3ODY5Y2NhMzMzIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnJldm9jYXRpb24udHlwZSJ9LHsidmFsdWUiOiIxZTAwYzYxOGFhMmIzYmU5NmJhMTAyMmJkY2E2NWNmNTZhODJiMzQwNzYxYmRiOTEyNTJlZmM2ZjNiMTYyNGFmIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YudHlwZSJ9LHsidmFsdWUiOiI4YjZlODM3NTg5ODE5YjhjNmRhZTY1NDk3ZWY3OGIyNTQ0YWI5MjVmZTIzYThlOGYzZTM5NjU5ZGQ5MjIxYTYxIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YuaWRlbnRpZmllciJ9LHsidmFsdWUiOiJhZjdlNjMyYTE3MjFmNGU1MjVjYTdmZmQxN2FiMjFmODJjOGYyNzNkNTFjZDU3NWJhNTI1OTkxMGI1MWRjNTQxIiwicGF0aCI6Imlzc3VhbmNlRGF0ZSJ9LHsidmFsdWUiOiJiMDlkNTVkYTI4NWM3NzBlODU5YzZiYmViOTYwYzBjNGI4ZGUyZGEzOGU3ODI5ODY5ZjE4YWQ5MDMyZmUwZWRhIiwicGF0aCI6ImV4cGlyYXRpb25EYXRlIn0seyJ2YWx1ZSI6IjZhYzIzNTFlMmNjMjIwMzU0OWEyYzEwOTEwMDU5M2IwZjM5Y2M3YzlkN2RjZTQ5NmJhOWZmM2I5Njg4ZTFiNmIiLCJwYXRoIjoiaXNzdWVyLmlkIn0seyJ2YWx1ZSI6IjA0MGVkNjBkNzFkOTQ1NTY3YjJiZTk5NTdjNzg4OWVlYzFlZjJkNGU4NDFlZjViY2Q2NWFiYzZkMmNmMGQ2MzIiLCJwYXRoIjoiaXNzdWVyLm5hbWUifSx7InZhbHVlIjoiMzM2NmVjNTI1NGU1Y2ZiZDVlYTlhZGFmNzAzYTAyNDk4ZmUyN2QzMDNmNzZlMzk4YWEzZDI4N2UyNGYyOWEwMCIsInBhdGgiOiJpc3N1ZXIudHlwZSJ9LHsidmFsdWUiOiJmN2E4ZTM1MTkwZjNmMDgyYzExODFkZDk5OWMwYTJhNzRkNzdmOGMyMDFlMDBhMDFhOWRjZGY1NmRiOTg0NjVkIiwicGF0aCI6InR5cGVbMF0ifSx7InZhbHVlIjoiNzg5YTRiYWY3NTc4YjM4YTg4ZTdhYWQ2ODAxNWUzYWU1NDg0NDllZjE1ZTRiNTcwN2M4N2FjMzkxNDkxYTBhMSIsInBhdGgiOiJ0eXBlWzFdIn1d',
      privacy: {
        obfuscated: [],
      },
      key: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
      signature:
        '0x376f0104382b08c0b49ade1d3037b1b610b1a4c272ace34fd437d74bd714b6f3577a8f361f788262c01c34c154cf3b8aaca0ef91f7a76d0f91bdcf2f27bd2b5e1b',
    },
  },
  {
    version: 'https://schema.openattestation.com/3.0/schema.json',
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      'https://schemata.openattestation.com/com/openattestation/1.0/OpenAttestation.v3.json',
      'https://schemata.openattestation.com/io/tradetrust/bill-of-lading/1.0/bill-of-lading-context.json',
    ],
    credentialSubject: {
      id: 'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
      shipper: {
        address: {
          street: '456 Orchard Road',
          country: 'SG',
        },
      },
      consignee: {
        name: 'TradeTrust',
      },
      notifyParty: {
        name: 'TrustVC',
      },
      packages: [
        {
          description: '1 Pallet',
          weight: '1',
          measurement: 'KG',
        },
      ],
      blNumber: '20240315',
      scac: '20240315',
    },
    openAttestationMetadata: {
      template: {
        type: 'EMBEDDED_RENDERER',
        name: 'BILL_OF_LADING',
        url: 'https://generic-templates.tradetrust.io',
      },
      proof: {
        type: 'OpenAttestationProofMethod',
        method: 'DID',
        value: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
        revocation: {
          type: 'NONE',
        },
      },
      identityProof: {
        type: 'DNS-DID',
        identifier: 'example.tradetrust.io',
      },
    },
    issuanceDate: '2021-12-03T12:19:52Z',
    expirationDate: '2029-12-03T12:19:52Z',
    issuer: {
      id: 'https://example.tradetrust.io',
      name: 'DEMO TOKEN REGISTRY',
      type: 'OpenAttestationIssuer',
    },
    type: ['VerifiableCredential', 'OpenAttestationCredential'],
    proof: {
      type: 'OpenAttestationMerkleProofSignature2018',
      proofPurpose: 'assertionMethod',
      targetHash: '81a2b26f7adbb6181fd44b9321cac6198a760a2c95edd8ef64cad747e935ecbc',
      proofs: ['e0de44adc67499777af35e8d94c07df080624d06187dce8901f2f8a435fc7b7d'],
      merkleRoot: '722e6757c585cbfb60ba1d41fae9285e2ddcc2143f414439bb14dae1820e45ea',
      salts:
        'W3sidmFsdWUiOiI1ZDYxMGI5ZDgyYjUwZGI4OTE0MjhiNzJkOWNhMmNiMDQyNzMwZTJjNWYxMjA0OTA0YmVlZjBlZTgxNDgxMDgzIiwicGF0aCI6InZlcnNpb24ifSx7InZhbHVlIjoiNTQ0ZmRjOWQ1NmIzODhiNjAyNWFkZWRjNTkwNTNmZDEwNjMxMDc5YjE4MjkzY2QyNTdkMDc2ZDViYjhiM2I4NSIsInBhdGgiOiJAY29udGV4dFswXSJ9LHsidmFsdWUiOiI1OTZhYTYzODE3ZmQxNTJkY2QxYjRmMmJjNzVlNDUwMmQ2ZjUxNzEzNWQ0NmRmOWIwM2NkMDBjZjk4YmFjOWZiIiwicGF0aCI6IkBjb250ZXh0WzFdIn0seyJ2YWx1ZSI6IjRmMTU5ZjUxY2YzOGRkNzgyZDEzOTY0N2ZjNjExMGRjNWI5OGIwMmY5ZjcxZDc1ZTE5MTZiYWUyZGFmZjUzNmQiLCJwYXRoIjoiQGNvbnRleHRbMl0ifSx7InZhbHVlIjoiZGQ4MGViM2QxYmY0YWFmZTE4ZDE0OTc0NjM4NmFkMTlkNjRhZmQ4MGZiNDI4YmMxZWIwNDhiZDliYzg1NzEwMSIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5pZCJ9LHsidmFsdWUiOiJhNGM4MWE0MzE4OGU2NTQ2OTI1OGQxZTdiY2JiOWVjNDk5MTJkNjA5MzBkODFjYzc3MGZhODM5NjRmYzZkZjdmIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNoaXBwZXIuYWRkcmVzcy5zdHJlZXQifSx7InZhbHVlIjoiMWI2NjU1ODA1N2M0YTI3OGJjMDNiZTcxYmQ4Y2U3M2I1Zjg4OGNlZTRhYTE1N2M5NDEwOGIyYzBmOTgxYTc5ZSIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5zaGlwcGVyLmFkZHJlc3MuY291bnRyeSJ9LHsidmFsdWUiOiI0NTI3MGFjNjBlNGYyYjIyMzZhNTUzYjUzODY4MGQ2NWJiOGE0NWY3MGIyOGI0MjQ2MmY1YjM1YTAxOWIzYjExIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LmNvbnNpZ25lZS5uYW1lIn0seyJ2YWx1ZSI6ImVkZmU1YzNjN2RiYjE0M2E3M2I3N2I1YWM3ZGI2NjEyYTJlYTAwMDI2YWQzYjYyM2Y5NWZiMTdmMWNlNmNlYjciLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3Qubm90aWZ5UGFydHkubmFtZSJ9LHsidmFsdWUiOiI5NWRmOTk4MTgzOTBmOWUyNGUxMjhmZjE1ZmVlMmMzYTM1MjE0MGZkNGU0OGIwNjMwNzllN2QyOTIzYjc2YzliIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnBhY2thZ2VzWzBdLmRlc2NyaXB0aW9uIn0seyJ2YWx1ZSI6ImJhMjNkMzk5YTI4YjVhZDJjZWRjYWU0MDRmMTdlZTcxY2NjOTNlMzY3YWVlMzBkYjdmOGU1NjMxMDk1ZDkwNjIiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ud2VpZ2h0In0seyJ2YWx1ZSI6ImY3ZTI5YWFhZDJkNWQ0NTVjMGI2Mjg3MzY4NGE5NDM1YWE4N2Y5ZmE3MjMwOTg0MGQ0M2MwYzRmZjEzOGE1YzQiLCJwYXRoIjoiY3JlZGVudGlhbFN1YmplY3QucGFja2FnZXNbMF0ubWVhc3VyZW1lbnQifSx7InZhbHVlIjoiMWU2Mjc0NDViZmIyMTlmZTYzMWZiZTBlZWNmMTUzZDMxYjk4MWQzNWZmOGQ5ZTdjY2NlMjVhYThhZWNkMjgyOSIsInBhdGgiOiJjcmVkZW50aWFsU3ViamVjdC5ibE51bWJlciJ9LHsidmFsdWUiOiIzZmYwNDhmZGY0NDdlYjk2Nzk4NzBkMWZjMjhiNTI3Mzk4OGI2ZmRjMzExODhhNzdkMGVkY2U4OTAxODhkMWMyIiwicGF0aCI6ImNyZWRlbnRpYWxTdWJqZWN0LnNjYWMifSx7InZhbHVlIjoiMTI0ZTc4OTRlZjc2MDY2ZTNiYjkzYzhiZDJkMDkyMWU2NzZlNTE4ZDRhMzI5MTVlMmEzODg5Mjc0ZTU4YWMyMCIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS50ZW1wbGF0ZS50eXBlIn0seyJ2YWx1ZSI6ImE4NjZiNWIyZGFhMTUzMTFiMTFmOGRiMDZlMGNmNjQwNGQ4NzZmNTBiN2M3NjA4YWRjZjNkYTE5MjhmYzhiNTUiLCJwYXRoIjoib3BlbkF0dGVzdGF0aW9uTWV0YWRhdGEudGVtcGxhdGUubmFtZSJ9LHsidmFsdWUiOiI1OWQ3ZTE0ZGI1NDYzMmI4MDU2YWMxOWQ0YWQ0YWRjZDY0ZTM1ZjNlNTJhNGQ4OWJmNDZlMDhlZTlkMjBmYTMwIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnRlbXBsYXRlLnVybCJ9LHsidmFsdWUiOiIyNmEzZTZlM2M5Mzk2ZGFkMzIxMzIxMWRmNmVjODJjYzdlYjRmNGNiYjIyYjk3MDJmYWNlOTZlMWM1OWEwZDU0IiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnR5cGUifSx7InZhbHVlIjoiYjM0Mjc1NThlMTFhYjkxNThjNzVjNDQ0NWEyNDZlOWQ5ZTVhMWJmYjc3MzhmMWE1Y2I2ZTRhYzhkNmYyYjA4MCIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi5tZXRob2QifSx7InZhbHVlIjoiZTdhM2VjOTNlMDQ1ZDJhNGUxODUwYjllOTA4Zjc0ODNiYjVlYTZjMzBjNGQxMGNiNzY3MjlkYzBmM2NhZGVjOSIsInBhdGgiOiJvcGVuQXR0ZXN0YXRpb25NZXRhZGF0YS5wcm9vZi52YWx1ZSJ9LHsidmFsdWUiOiJjOTM2NTVmYzY5YjU1ZjhjMjJlMDgwOGNjMmQzYTQ3NWM2Y2U0N2E3MzhlMWM2N2IzNWE2NTgzNzY5M2Q2MDhlIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLnByb29mLnJldm9jYXRpb24udHlwZSJ9LHsidmFsdWUiOiJjMTQ2ZTMxYTBjYzI1OTZkOWY0MzJiMjJkZTczOGFlNGI5MzE0ZjFkODk4NGIwYzIzYTYyZDQ4MTNlZGNmZjUyIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YudHlwZSJ9LHsidmFsdWUiOiJjY2Y5ZDY2Y2ExYzFjMDYyZjlkODY4ZTYxY2RjNTk5MmYxZDQzM2E3Y2E4MTE0MTFkNWQ0NmI0MjY1OGU1NGJmIiwicGF0aCI6Im9wZW5BdHRlc3RhdGlvbk1ldGFkYXRhLmlkZW50aXR5UHJvb2YuaWRlbnRpZmllciJ9LHsidmFsdWUiOiJmMTk0ZmQzMmM4MjRiMGY0YjYyNWY0NDhmODdkZjM1YzMzMmM4MjgwZjY4NmNjNmMwZGNlN2NkNmJhYjI4YWU4IiwicGF0aCI6Imlzc3VhbmNlRGF0ZSJ9LHsidmFsdWUiOiJlNzhkZGFjMmZiZjVhMTJhNjBmMzkxMDVjM2NjMmVhNzFhNjQ5NmYwOTAwYjUzMWU0OTljNzBkODhjMjA1YjE1IiwicGF0aCI6ImV4cGlyYXRpb25EYXRlIn0seyJ2YWx1ZSI6IjlhY2JhYmFmN2ViZjExZWU0Y2Q0MzUyNzRlZDkyYmQ0NzdkNWY3OWZkNjk5YjllNmM0YThiMTAxZjVlMGZkMzEiLCJwYXRoIjoiaXNzdWVyLmlkIn0seyJ2YWx1ZSI6IjExNzBjNjhhNjdkMjBhYjg5YmMwN2JhMmU1NjM1NDc0MGRkZTUyNGNhN2NkYjg5ZTA0ZWY2NWE5NTdiNTZlNzAiLCJwYXRoIjoiaXNzdWVyLm5hbWUifSx7InZhbHVlIjoiOGJlNmU4YzY2MDA0NzFkMmQ2Y2MwNTY5NTk0M2FjZDdmZjc0MzliOTU0NDU3ZmFiNmUyMTdiNzk0YjRhMjQ3NyIsInBhdGgiOiJpc3N1ZXIudHlwZSJ9LHsidmFsdWUiOiIyOWM5OGMzZmM2ZGI0ZDM2ODY0MzNhN2MwYmI4ODA2NzRjNmExODcyMmJiMGI4ZGI5MGY5YTliMWU2MzQ0ZjZhIiwicGF0aCI6InR5cGVbMF0ifSx7InZhbHVlIjoiMWM5ZDEwYjk1OTBhNGFlODVmZjhiMTc0YTRmNDc4OWQxODk3NTFmOWVhYjk4NWRjNGNjZTRlNDA3NTEyNTVkYyIsInBhdGgiOiJ0eXBlWzFdIn1d',
      privacy: {
        obfuscated: [],
      },
      key: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
      signature:
        '0x376f0104382b08c0b49ade1d3037b1b610b1a4c272ace34fd437d74bd714b6f3577a8f361f788262c01c34c154cf3b8aaca0ef91f7a76d0f91bdcf2f27bd2b5e1b',
    },
  },
] as v3.SignedWrappedDocument[]);

/* W3C */
export const W3C_VERIFIABLE_DOCUMENT = freezeObject({
  id: 'urn:uuid:0192b20e-0ba5-76d8-b682-7538c86a4d69',
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3c-ccg.github.io/citizenship-vocab/contexts/citizenship-v1.jsonld',
    'https://w3id.org/security/bbs/v1',
    'https://w3id.org/vc/status-list/2021/v1',
  ],
  credentialStatus: {
    id: 'https://trustvc.github.io/did/credentials/statuslist/1#1',
    type: 'StatusList2021Entry',
    statusPurpose: 'revocation',
    statusListIndex: '10',
    statusListCredential: 'https://trustvc.github.io/did/credentials/statuslist/1',
  },
  credentialSubject: {
    name: 'TrustVC',
    birthDate: '2024-04-01T12:19:52Z',
    type: ['PermanentResident', 'Person'],
  },
  expirationDate: '2029-12-03T12:19:52Z',
  issuer: 'did:web:trustvc.github.io:did:1',
  type: ['VerifiableCredential'],
  issuanceDate: '2024-04-01T12:19:52Z',
  proof: {
    type: 'BbsBlsSignature2020',
    created: '2024-11-11T00:43:34Z',
    proofPurpose: 'assertionMethod',
    proofValue:
      'hPm0Ef9HdptikoYojeF+X3xPyznAfPUROX5cBTzeINsvZJB0utLFfSMPrkgJCh9mYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i+CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx/IAvLVniyeMQ==',
    verificationMethod: 'did:web:trustvc.github.io:did:1#keys-1',
  },
} as SignedVerifiableCredential);

export const W3C_TRANSFERABLE_RECORD = freezeObject({
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3c-ccg.github.io/citizenship-vocab/contexts/citizenship-v1.jsonld',
    'https://w3id.org/security/bbs/v1',
    'https://trustvc.io/context/transferable-records-context.json',
  ],
  credentialStatus: {
    type: 'TransferableRecords',
    tokenNetwork: {
      chain: 'MATIC',
      chainId: 800002,
    },
    tokenRegistry: '0x6c2a002A5833a100f38458c50F11E71Aa1A342c6',
    tokenId: '39020f777ea6748b89970cb50a90edd8e89537e1fb5245131aa444043c46fc99',
  },
  credentialSubject: {
    name: 'TrustVC',
    birthDate: '2024-04-01T12:19:52Z',
    type: ['PermanentResident', 'Person'],
  },
  expirationDate: '2029-12-03T12:19:52Z',
  issuer: 'did:web:trustvc.github.io:did:1',
  type: ['VerifiableCredential'],
  issuanceDate: '2024-04-01T12:19:52Z',
  id: 'urn:bnid:_:0193ced8-7282-7663-ab42-20e6c09d0f0a',
  proof: {
    type: 'BbsBlsSignature2020',
    created: '2024-12-16T09:41:52Z',
    proofPurpose: 'assertionMethod',
    proofValue:
      'seYte8TT/NwueUn/Hv9xSi+vQ6cSIcFUaI+D9WfV6And6zn7iXeK80VUhmIqvdryHsbruL1g0+VqjyUT1XoDDHDX2iSUvep/tRw8MDt9uShoT12Ljbkx0CkqOlUk57TwQUZVBXdBhChjvOc13+2v6g==',
    verificationMethod: 'did:web:trustvc.github.io:did:1#keys-1',
  },
} as SignedVerifiableCredential);

// Freeze fixture to prevent accidental changes during tests
function freezeObject<T>(obj: T): T {
  return deepFreeze(obj) as T;
}

function deepFreeze(obj: unknown) {
  if (obj && typeof obj === 'object' && !Object.isFrozen(obj)) {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach((prop) => deepFreeze(obj[prop as keyof typeof obj]));
  }
  return obj;
}
