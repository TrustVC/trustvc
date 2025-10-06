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

export const RAW_DOCUMENT_DID_TOKEN_REGISTRY_V2 = freezeObject({
  id: 'urn:uuid:0194cf82-6d06-7d96-bb82-70ef2da9fb5f',
  $template: {
    name: 'BILL_OF_LADING',
    type: 'EMBEDDED_RENDERER',
    url: 'https://generic-templates.tradetrust.io',
  },
  network: {
    chain: 'MATIC',
    chainId: '80002',
  },
  issuers: [
    {
      name: 'DEMO TOKEN REGISTRY',
      tokenRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
      identityProof: {
        type: 'DNS-TXT',
        location: 'example.openattestation.com',
      },
      revocation: {
        type: 'NONE',
      },
    },
  ],
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
} as v2.OpenAttestationDocument);

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

export const WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V2 = freezeObject({
  version: 'https://schema.openattestation.com/2.0/schema.json',
  data: {
    id: 'bd4ab982-4196-4d5e-9ed4-c3fc90bfc06a:string:urn:uuid:0194cf82-6d06-7d96-bb82-70ef2da9fb5f',
    $template: {
      name: '17251738-2bc9-40ea-abd8-526ef83ff554:string:BILL_OF_LADING',
      type: '17b02a26-92dd-4841-9a4f-51327f63770b:string:EMBEDDED_RENDERER',
      url: '850621fa-7a59-4db3-98fb-34048300233b:string:https://generic-templates.tradetrust.io',
    },
    network: {
      chain: 'ea931fed-37c4-460e-9fd0-a8b14ff916f1:string:MATIC',
      chainId: '4a8eaa58-0da9-4d9a-83ef-89a78e5d776d:string:80002',
    },
    issuers: [
      {
        name: '9355209a-852d-4f12-9940-5202b25d165e:string:DEMO TOKEN REGISTRY',
        tokenRegistry:
          '16cc79da-7fa9-4fce-b354-cae8226ee783:string:0x71D28767662cB233F887aD2Bb65d048d760bA694',
        identityProof: {
          type: '93f41e11-b826-4244-8984-e5c774720c69:string:DNS-TXT',
          location: '21c6ed7f-146b-49e3-9cee-da088bd78ee3:string:example.openattestation.com',
        },
        revocation: {
          type: '6104d6b3-4df5-4acd-85a3-df2e912c3e11:string:NONE',
        },
      },
    ],
    shipper: {
      address: {
        street: '3c264a40-afce-4a76-9901-80d54e6caaea:string:456 Orchard Road',
        country: '72509e84-c349-4edb-8e6d-b62cd2aac078:string:SG',
      },
    },
    consignee: {
      name: '0e896de8-ce73-48a4-94e7-5798d00b79b3:string:TradeTrust',
    },
    notifyParty: {
      name: '9da274d5-1f4b-427e-b5da-571a4d458ddf:string:TrustVC',
    },
    packages: [
      {
        description: '9014b4f2-bae9-4db0-b198-0629d2db03db:string:1 Pallet',
        weight: '31b7f713-eeb8-4072-a414-8c1c253e87fd:string:1',
        measurement: '5ab98b9c-ac22-4a0d-9b49-69b57f7d8534:string:KG',
      },
    ],
    blNumber: '8985ac3b-7698-4e12-8b88-498ab5151525:string:20240315',
    scac: '67ad072b-c428-40be-9439-5e8a50ed3c7f:string:20240315',
  },
  signature: {
    type: 'SHA3MerkleProof',
    targetHash: 'c999d6bf0b5e18bc6051bf60779e2a6891dc41294a35f0b0e0ea9addd774294c',
    proof: [],
    merkleRoot: 'c999d6bf0b5e18bc6051bf60779e2a6891dc41294a35f0b0e0ea9addd774294c',
  },
} as unknown as v2.WrappedDocument);

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
      chainId: 80002,
    },
    tokenRegistry: '0x6c2a002A5833a100f38458c50F11E71Aa1A342c6',
    tokenId: '23f719b016c88ba1ef2e10c0718d7d0f0026b1dc6e219629f81e2f0f811c4e3e',
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
  id: 'urn:bnid:_:0194cfc4-6b6c-7553-9b67-1ed41632eb2a',
  proof: {
    type: 'BbsBlsSignature2020',
    created: '2025-02-04T07:02:26Z',
    proofPurpose: 'assertionMethod',
    proofValue:
      'ouPsZgRPF5nIEYenlfQbRPVAunre6mhcOy6YswI24/FFSTJ5mHujBEBi1qmNjJEBM4Gwr2jteoyAIIz5w7vohD0tk9aBaHRSAyj6fhgrq8Ahbi4qhudCMuPu8FIY1xInSl+RZckKKYIEXP/R789sZQ==',
    verificationMethod: 'did:web:trustvc.github.io:did:1#keys-1',
  },
} as SignedVerifiableCredential);
// export const ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0 = freezeObject({
//   '@context': [
//     'https://www.w3.org/ns/credentials/v2',
//     'https://w3id.org/security/data-integrity/v2',
//     'https://w3id.org/vc/status-list/2021/v1',
//     'https://trustvc.io/context/transferable-records-context.json',
//     'https://trustvc.io/context/attachments-context.json',
//     'https://trustvc.io/context/qrcode-context.json',
//     'https://trustvc.io/context/bill-of-lading.json',
//   ],
//   qrCode: { type: 'TrustVCQRCode', uri: 'https://localhost:3000/qrcode' },
//   credentialStatus: {
//     type: 'TransferableRecords',
//     tokenNetwork: { chain: 'MATIC', chainId: '80001' },
//     tokenRegistry: '0xE0a94770B8e969B5D9179d6dA8730B01e19279e2',
//     tokenId: '96435d29f3b0ce55e452d699fd09a85efdb7200493c5e77f09cbe0b63b2e3d88',
//   },
//   credentialSubject: {
//     billOfLadingName: 'TrustVC Bill of Lading',
//     scac: 'SGPU',
//     blNumber: 'SGCNM21566325',
//     vessel: 'vessel',
//     voyageNo: 'voyageNo',
//     portOfLoading: 'Singapore',
//     portOfDischarge: 'Paris',
//     carrierName: 'A.P. Moller',
//     placeOfReceipt: 'Beijing',
//     placeOfDelivery: 'Singapore',
//     packages: [
//       { packagesDescription: 'package 1', packagesWeight: '10', packagesMeasurement: '20' },
//       { packagesDescription: 'package 2', packagesWeight: '10', packagesMeasurement: '20' },
//     ],
//     shipperName: 'Shipper Name',
//     shipperAddressStreet: '101 ORCHARD ROAD',
//     shipperAddressCountry: 'SINGAPORE',
//     consigneeName: 'Consignee name',
//     notifyPartyName: 'Notify Party Name',
//     links: 'https://localhost:3000/url',
//     attachments: [
//       { data: 'BASE64_ENCODED_FILE', filename: 'sample1.pdf', mimeType: 'application/pdf' },
//       { data: 'BASE64_ENCODED_FILE', filename: 'sample2.pdf', mimeType: 'application/pdf' },
//     ],
//     type: ['BillOfLading'],
//   },
//   renderMethod: [
//     {
//       id: 'https://localhost:3000/renderer',
//       type: 'EMBEDDED_RENDERER',
//       templateName: 'BILL_OF_LADING',
//     },
//   ],
//   validUntil: '2029-12-03T12:19:52Z',
//   issuer: 'did:web:trustvc.github.io:did:1',
//   type: ['VerifiableCredential'],
//   validFrom: '2024-04-01T12:19:52Z',
//   id: 'urn:uuid:0198a36a-e37b-7aa6-a715-cf85b6019301',
//   proof: {
//     type: 'DataIntegrityProof',
//     created: '2025-08-13T12:32:28Z',
//     verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-1',
//     cryptosuite: 'ecdsa-sd-2023',
//     proofPurpose: 'assertionMethod',
//     proofValue:
//       'u2V0AhVhAX3jgXNIsqyCUgAexhykylzIFcd3e5IYSZUcENyh5-dGj9dofOMWl_KZF4evDJdzgUAmeDLnqcR9CpqAZbRTKVFgjgCQDmbT57c_Tgi3whdpjj8xECa73XTJlKIQPCA3BTPGDFutYIHx-Rew_DEy5XIdKQc9Am37-2GSGk3kox8dhKgoOflS-mC5YQAZy5CHM6vKL77ZGtfv3wE1iVxz9Qq0h71Gw6aACtn-wdUbYhF3toi8Nd5RkXxBqKRkzWnS_GbRF4cSdj9wN8udYQKowz5C8RzQM8NuLYTPH-3bujsmzoqYYMNZDI32v1wE3-mxWu11cAJ5l6w2_Jd81ElbdDMSkjIeeltEWRfvsIAFYQEJU3m9S4reGE6Ki6OUkP2G9zW3xe8Wc0E6Uimf1oqttFKE6SSMXvKRokcOQ09HDtVRgp5Zed8lmLl3M38xyentYQD8o--_SpwEOWgGn-uZfMPjDaGjaOMSeE7t1Y10lFpswjgx-2oX_6DxTTfcq784R9Jc-b5giwzfhTFIQT7avDkpYQEB9Ewgc6J8Pr_NP9gz4kiIGfHVJZT16ENhp-4QA7MhdksJuxU3UK4aCail5rcM4nGg9KQQiVNMKObVqbdNe2lZYQLNUXVA7ld_LYfGo1RLNTyXpIqYQAPhNdswJWuHO5aU6R0wYJ2obBvSTmY7XgB9uBl5ytBecxai2OQF6Bt2khqRYQLRL8DMQwhMWXUUgahHlSOI87-zltHXHwvQbhK-73t-n9L4sFUHfRtRNEhRfx1SvYZtRhg-v3djuADHpcdOBk6BYQOpBNFhO9O6dd50fvWJUJetEnbbWg8NTmO30gzPcDpa4MMeJjHL83OI81ZROav8ol8OOS2qeXbSTmUJT6kdycCBYQDiAv_rwDe6tVtjjazQzxOccOIWvkdVkUUXKUCT1gLoGsbUH5uuSs98y7PEUDFOmtXVxlSTTrxd-9d7mJzyr_4lYQKkeAtOratchWur9oLQs9vT6RnjPeg_mDJxXd9cqa6FPDPss3R4Cg9T2FSG6u86J62XfQGVgnWmJcfFfLoMsL05YQJjtbnO3OdGjQ3ZT12uMHcat0RJXxSery6nsuPNN-6k5Cn0H053P7jlfdDdXiNajK6kpnepESUKpo_0zeGU643dYQL2Eg6aYFBqWLc_qvEv5RX_GXuIGgOzCm2N9wBLp3pWBwzpQ3kWQu9-EPfKN4UM3QdlSnEePsoa44c-7ynyL71JYQBI7F__JL6LXWWzvaW3a-DNheFPfApcCb0dCHpsSGR_9l4f0gTxqZZH5tS57W0v62h6IzVpz76qmk7SjtPOYQcBYQDKYI8xN4Qk-gdF08uf774Qay3k3f94szWTWtrl-O9p_1XMltqxqrguWp-CoMA9aHJd-TL0PTJSbQ1KctYvu-WFYQFhH4WxSreYkUtcxqPKhfefyI5DIl8xoZVZoZswySmcxmIC2eI-_4JfLobkdo9-N_vhlyTu5K1ZfAp2SE2SlUUhYQF9pEhyultl8EBpQdXUtb3kfD3UVNjiOhLmzr2cEBpN8OLX5JCO-NLRswp7ytaqgFEX33aYYDIT-w-pVOI3zAftYQNDtlcfBBi5Qd8GCjqTVGm6qg7urCXkrzBFiHzqOIYCfaA0ip0-l2HY50YdxYd1MNmTQFszcTZDuEQpFuRgPX2VYQBvdqItd15wfxfA70BwgCCguTU7RH0Zabwy_vxndDLyLSw2Xsfy-IhhUyVmbcCyY7uIqPNnPLd-Lprbt2pgbM6xYQE-ozaFo3mS_0LAhBJ4bR7SRg3GQLwH80UEpQxuWDdMfBAS255aUok1Nv-MtG_z_fJOJx4X0D-W8ARFUq2VMo0tYQBIse9iDOZQ96Yzk9u4a1sAslF7muc453oaJiP9AreMO5GD614b1FNyjVB70DDhCAjJR_hODqYO-QzhiyzNzwm9YQMNjdjqv5XN5uBzyxMLFN8pXSEI3wMVNNN7XA6px0n0SHmse94klMa7EQejBW5xjD-C08KrcxZ3n8zL4XUi96kVYQJH2kIvVdh9XUuOLSFrqQppm8kyHuM4BJFJsUmdBT-OxX9-FHCtIgGArcIlxX_kVuok-6sv9fvO6-bvnjRXq8JdYQDsM7f6WjhmbDPlsZTFcfZ06qQ3tKEsqVPPpmpDM6WqRwlIzDevcqauzHfUvlfcLehR777izO0sKYMSbESL_WH9YQBUuJleMjPotYsrazAjp3NOy6OCXloec6jehqVlGR7c8s4gukJPCy9O7IBjER0_yyGESF2pZM-cEPVhmxLNwoUNYQOn_PRW9xsRKLmV7TsDQwvQnBQbYYmT1nWhEdACBf9mBVNkbrsBQAwZ1aUUb55hk5-EXUHoKLE8HP9y25Et0aFlYQESxH6MpwVXehGEA8kuM8muhyBHXCzVPMXPO0CTNguRlcL9WevE_L_Y7ldJUbvBRsEnTaOZ3S4RJnQokr0jIGoZYQI6kxmtR5hVtBcStCzHFdqLD0tYodQv0jT9JIqYJtiPRk5IW9JcIJt5IT3Kkd10k0WBp4yn_5T5oqWw4bXlGe9dYQHNCnsqLYLwu98vQkxI18SAjwN8meF_tPf4yk1y5X_slJuLjHAI2g2yq8wHddmam4wGKxCOg8ZeGe1MZoEl0DfZYQGPGZWTd6DV66I-VvLFORw4UfnAi7rP_MJqjejdk604ByQrwPvDZlRnjKdVf2EGGpqKrbcwdOXSEoSZ1W_XdSLZYQK7qYaSzOnqDBx6n9qMYpQfRae_DM2krRWv59NcNtSjly-kjkhd-pytTuEsgJOQbQkfBaNcqh745bfkdUUNgGtRYQEBR3peXmp1Q1pmutQ66iw24zMsIIiFdzO8EfJZNFmX69pqshet068jMktoFWtmCAGmRcV5p9jI2XCotD3yVFuBYQP8AxwRqfef3CaPihqx4F8OxUhhySQmaYOZGYVGOmSfC99pUrN-tsNbmHOB3Yr3HY9YvqWXe3IqzuOMbbRf8I4xYQCAbs7MBJGjVgZEE6GOrqub_glf2AslIrPSZLTYW0n2E2Kcg_y09uC4wC5UaOWgMQRVNgs645mAu6KayeQN7k_1YQHKArZtvjaBNyijHj24qDQRDhQNr6GAmCDDmsKsHaHAfDWWA301CLWFYw_0OmMeF2OBBdymPbghNImt2l_AUQ35YQOdAMei-zIX-uWw8ii5d0r3OSj9IXKzAj__Fd7Jo6oSWk2H_XR88b_nVNUeHlVpJjnwXuMeCjAPfIchAR4XIldJYQGn78Irvp9aBYMOCwulF8_GhpzUdT3AV2c213VA87jZ0dfPfb3tkbS44OoF50P5UTCLD2Y-MYx9jHrWJaJDWxWdYQLVSTwmnliLV4heL9lv1pa5vE8hGhRz35TEG4gHrkWB-O3Z4x9PPTPXn5O9tE4MjLzkkRPv0M7_zQ0ge6Z7x9eFYQHpKtwDNfm8UN6jpouUInO-tyJrxMnQN7SrKvlv4Drj6LWE_9bIfDGrZl9UJTMf1EBp1_wiV6bYMEkIhz_kfPmRYQPkY6DkpKGIBy4SWSZrIHj1UuG9UMMdkCOClQjPGqcXYCiwlC8uuW2C6Jrr_28PJvwnAS-0le25TP-TALuXSCGhYQLhFn1rEv2NJ_6N1jFZLCoeDvHMFWJ9aIlj9huCQuJJcnOONp_8qbAbP4db_rKyxUclacddLeX6MLnI29om_rYBYQMg1y6VkfsnfA8nZ7TeksPU48eyOBy3PRMkIdPB7QWWy_c-90CdTbPZD3C_Bw4w82w-uyDtC3vZr3aaii524sf1YQG8ZcfLuVfWxwpNzi9W6u2rg0b17lI86XGDCBpfv_4nMaEgGlVWmn-nn63NbsquKHPkCCNq9_ejEwjiwdNHNuPxYQAAXhoenzuHU6T5C5_Y6dYRNwR9V08ABjrwfUn-OsEm7zx7CORGcNBJ-zN3svFJfOrhCAof6jxWc5WXnJuj93SRYQEmfQSDgxPkWiD64pLJwBk4kJjJe_rdmJO9zL-rPb7O9sL-0Af8tgiUnREE7Qn8y2l7PoY2ytC4b3h_TJ0NDlM5YQD_NiL6Ojj7D0EVEJ3d0cZBQ0X8nE1CscGfrV_NbFQhYAxHHIjnTSLEN_oF76conYHts6xpgnYx4a6ttRbLwQKpYQNzuO2DpnS1bg9ZMoNgeBHJETxIbHm6Grk3vLb8KTk5koyY2jhjHDdp1uTezCG5nXbP_gVLAcowSotH_c5G9XLiCZy9pc3N1ZXJqL3ZhbGlkRnJvbQ',
//   },
// });
export const ECDSA_W3C_VERIFIABLE_DOCUMENT_V2_0 = freezeObject({
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3id.org/vc/status-list/2021/v1',
    'https://trustvc.io/context/transferable-records-context.json',
    'https://trustvc.io/context/attachments-context.json',
    'https://trustvc.io/context/qrcode-context.json',
    'https://trustvc.io/context/bill-of-lading.json',
    'https://trustvc.io/context/render-method-context-v2.json',
  ],
  qrCode: { type: 'TrustVCQRCode', uri: 'https://localhost:3000/qrcode' },
  credentialStatus: {
    type: 'TransferableRecords',
    tokenNetwork: { chain: 'MATIC', chainId: '80001' },
    tokenRegistry: '0xE0a94770B8e969B5D9179d6dA8730B01e19279e2',
    tokenId: '8b44d0a7a2e5f083945f4132a06a23fbe58c2e567a3ad89ac0239e02d2d71cf4',
  },
  credentialSubject: {
    billOfLadingName: 'TrustVC Bill of Lading',
    scac: 'SGPU',
    blNumber: 'SGCNM21566325',
    vessel: 'vessel',
    voyageNo: 'voyageNo',
    portOfLoading: 'Singapore',
    portOfDischarge: 'Paris',
    carrierName: 'A.P. Moller',
    placeOfReceipt: 'Beijing',
    placeOfDelivery: 'Singapore',
    packages: [
      { packagesDescription: 'package 1', packagesWeight: '10', packagesMeasurement: '20' },
      { packagesDescription: 'package 2', packagesWeight: '10', packagesMeasurement: '20' },
    ],
    shipperName: 'Shipper Name',
    shipperAddressStreet: '101 ORCHARD ROAD',
    shipperAddressCountry: 'SINGAPORE',
    consigneeName: 'Consignee name',
    notifyPartyName: 'Notify Party Name',
    links: 'https://localhost:3000/url',
    attachments: [
      { data: 'BASE64_ENCODED_FILE', filename: 'sample1.pdf', mimeType: 'application/pdf' },
      { data: 'BASE64_ENCODED_FILE', filename: 'sample2.pdf', mimeType: 'application/pdf' },
    ],
    type: ['BillOfLading'],
  },
  renderMethod: [
    {
      id: 'https://localhost:3000/renderer',
      type: 'EMBEDDED_RENDERER',
      templateName: 'BILL_OF_LADING',
    },
  ],
  validUntil: '2029-12-03T12:19:52Z',
  issuer: 'did:web:trustvc.github.io:did:1',
  type: ['VerifiableCredential'],
  validFrom: '2024-04-01T12:19:52Z',
  id: 'urn:uuid:0198bd46-6b8e-7661-a19c-8d608f1f2a77',
  proof: {
    type: 'DataIntegrityProof',
    created: '2025-08-18T13:02:45Z',
    verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-1',
    cryptosuite: 'ecdsa-sd-2023',
    proofPurpose: 'assertionMethod',
    proofValue:
      'u2V0AhVhAaza3_cFVdDWARDWR4cV4SQOQ0SIFR6OGALPOEM5X8U4BkD_kgTvSSnIrZmRwyNemEtI5BQ7JmWk9sDcYcrgN8lgjgCQCeUnpYnpjxzQXARbt9qNebaTK4njyttXsD2UR9tayRHZYIEFAgdS7BRlH4W-vOfnUu-L5j-AyWzpodqk-mUuROA31mClYQK9a3Fc9lHVOPnS--UgAfVQRENIedf6jrMoLN5ckrJPNO7OBPJMglh-5D0T7Qp_CnOrwch2f3dlFwfwz42z_eM9YQOxxcs-LvJ4k1PHzN2JMNxE19NfAIIPe1mCP_IjI9ekVJG-DiPJetAR_WtQS5rQODVuapz3X424ICeQOrgfgJhRYQAUYDOFKeTsNSkoovWCwuuurZJsRBMuVvd6-FPo3dOXPCj6eno_Ur2clUA2RvIkWdklqGD6GE8cBBnBs9OVv_NVYQKHvH16Y_xKT9_4NKSKdV7IPD2zuy1p6_FkhYa0aRAXU_8FBpBWpn_qFocnkMO5FHQDkCpyLyQa-yHTo2DGfWItYQIbJVco8TOvokwZRjHuezXBiWDtQY0CGTr6XI04qWPKHHAV6qv_cPv9QN95S8ImDFd9Jq5wnKk9mMzFZqQxFu2dYQLldGs8mZDDyerrujluO-OaNcJfru01Sy5_espg3NokKMxcCrafo8CEH6iOmWwt-ntRb56bwGE3saFAGXXNNjRdYQFPOZOPMxVrSGnt3A4yE0CYCZfeP8nmPZCNs2deHRxPKbvBB7miIihku5ak4GxOHikrKXnE8-SS3WUHG1VMt_-1YQPHLvSmGXpJ6PMlu_qG7vq4CxCJoi6RbDsiONxMJCalg9Fm0SNYJZWtkCxH-ktXCbqUpP1z4vgh8x9MvSnEUMvBYQPkEhQD5m70pJWqG9sCx1FPJwVbLXac0N-EKbUJGJ7OoxXHeUV71RiJIZjmM-3a1L0eMyk15r9dAllaMV7LB4RVYQIhjlQWv18OBNKxHTeTnclUZ3whr8vZ-Lev_1WgEo3usutBwzAoWZ03kXv-oHlhGq3-MTX8du4FKmzN4MlwtSBtYQHnVGf7THennsSBUu6d3riOnF68uQYceJUKJOAsY54m4DHv1vBVrXwxvUvLdbe5IpcTuY0RdfmzRHcIv3rV7Eu9YQCUVkdeN5FU5XEp5AgVK-H2vsMdK0ZvHRX2aCQe_3wlMyI9xWajWNDxaCXNslNOAw4eXD0phRj0BzpRzih5oIvFYQAXv0iIMKEHa3TJTIUoAXudyixqmwPB80D4_qXRhfC8esLm1R2ZdppBPI3In64GUHuD8lJYRjFt0PKbxMcyT6KdYQGbW6YOwuaFwghMzOWj4QjR9hhBEtoIx6mAMJfdqSCmT2U4lwS0QcPmjhqME_2OLJojY-K0YusWyZj1pCOh5RIxYQJ0mPNCvuPYv08tOm9cbBZPS7R0AKkF6T4A3tzbdVZ2WovDeIBdA0AbGjpxlKOEKtBThYa-trRsT7yU-Tsp2VP9YQA2rDWql138q5S5foj6VZVNpawhP2ynzelT_K381qsksj7e-4rC0inhyGvh2HXjj7_F8RhjBWy1Y8SqAP_D6iXtYQHXbn2RAJX1kHo47xhHB2TT4RgKUL7BcO4u697PVYlC6ndBxO-hOuM_U6eh2FdlDvuGQaUlSoLm8S0Pn5vMhT-NYQIcz0Hi1oN6viLHKUo0HqSK-pbci1Z7rusQVUOQdEVerfE-GzW5fAIDr74wQHVokqzetzD9inA1AWdvN-1foTYlYQHg5Mv3TJ4immMQdzwd2vOPnr2wKDQgvDJ22g8hxd5YGgUPRJjSH9MMKcRXuBVIZXmChGxmhPfzsUcCXTleZ8pBYQNcCSxhPDknei_wPKHbtSiVmFsi1ypRCCGnJZGopDC2xdPHjtb7v4lrtzWF3_zvGFDeSlLca-1QZS-YxOv4MvwNYQCeeG0E6s5rFc9Cno0C1evT9FJlIX8lcENULh1eAE0cRsLy_rgz_P1eYV-_Du4mp9JrQBDTyyFxWUFexTceia45YQIvh-c0E8a_s9sbmfvEz_upibAgg7Kqqka2lAifbHOHTtbermTaNs95nuP8bIWWFZz9qVvsl3sf9nD4ckAOmTINYQJwaa_zKwnOfq3ST4KpMwYmpufGvxtrct84ZoI7B4kFTE2n6Z4wVuu0WLqtq4afYTmrQ7Qhkr9gi3VFTJNWNFmdYQBpXKx9u6AhU7U-wE14jdW9vVE8Sl2sFN22i9JyMkhKQhI9n33-KPF20MwSGxfzKncAdxukS1cTFeaUIFzcx7XxYQG5OD4CnjTTA1Ki8yM1iAx1wwGRl5KO0g1XFgAPgF6gHOXA6UY_f0Rf4_1eU6lwd9IHvi3GHR4Ea2NQCFydNIzdYQIkFHeY4JnlwI-XN3tlGlZN15YGEoNdFvOmBnI7ANB9pjm9VYt0fZaZwU0kHFJUOaqJmlxehSpywLKYewUFWMgRYQLbyvcEAByxAnc6RSZHjpBhuXkIgDgCxOwsatwg62XSqh9Ou-wKaBg5d5ARKofSI7-v68y0xzPyjrPp1MQGehfFYQGgZC8rut-CFKrmNhsZw2wqA4iJMoRT_Ww2koVfuCGxxYQBQW23zzkXALVMWdttqY4lIet0rH6_f-ylmQrB5q7FYQMkpTM-NT4yCn1UY4U_HnoY9Eopg1sgmYsaA5AMo9WFovRQkd7HRHhAgi9Iuodqxw9MjFGYX07ASd_d-BragZBZYQLEkpg2PiDfh0zvtJKEnWhPRX4yUChIZ86cQ1eCKvNsbVqT64bwFzRRx8lab0FMpQgTgOFB9ACO_kKWdf3xgdFBYQH6emAuiM0fBbnUU7jT5QnRNckC1l3a44zTGHfyVakFueo5MbjgKEwneDAQ9AzGjGtqK2aAMQETa5sYGUqoUo6RYQKtGocAHRPPkAqSoHt2rKmB7hC-nxTPMPNZ_3oUMvrtf2hF0w7yX20DsC1HWf2Z4DavjxI1jfSvCcnSV58b8WC9YQFazPwizz1aWq7XPvbLcfMc8MlO-pH-2_uY85DS6xBAiQZuB0kZcNkz_QoKchVNlQyay2DPyjDr35LLj8zSicGpYQBVewABn9dgauraK4EDNx0oPFlybXMlhQicfXT3ZmuRtsFvnH24t_G_vlW54XBkKlThv9ZCMederOQT0pAi0rZtYQCuu_uF3gW_FfxgCY4GJUb0zmo7iEa8mW6ja9inaBbGKX9ZUSHlHvCMOb3niQwzkCOkkwgYT-AXWKCJ2YBvf6i5YQH3VHg6LJpkG0oBaFut9pm8gDNt040IfQV_eZjGQ1kAfmUrPdviW4WqX8EVpn3TOC7CW3iyVLmglv2DGuRzrWAlYQDVKKuNxCV44iP8hrqV6VOClixZAjeh5FW720VyZIm43mRBMTbcXUOJS8FHGcMWaDCh179ygQy7c5xE9l9MBrctYQCJZrscuL2qDTz80-SxUJ2L5UsDf7q-XXz4op1eOqiUUpAxrKg7FaZ8xcDiBQrZP-HHMgq2yUYtm6Q17D324jVhYQIc_3DEB-otsaFo-sb9iH9DKQXoH166eDM3COv7ylyBMrfqvCLrH_8X0oyYCmamEH2XvwehWlV4B0wLgzTeOi3hYQB-3W-IFyl1ATK2RO5ktsCls-7N9hAheltxt_-yGzc779Psz_KbYF9mWpUQ1_XehDMaOV4ilySmAQrOPgCAvFKFYQJRkqfn9L_fE2gH55Xc2Z1kM601URF-sof2DQSPwWKebqiCGtTJt2bos_hkvbqGzPwHX54wmWqTwKYmfdz1vs_GDZy9pc3N1ZXJqL3ZhbGlkRnJvbXEvY3JlZGVudGlhbFN0YXR1cw',
  },
});

export const ECDSA_W3C_DERIVED_DOCUMENT_V2_0 = freezeObject({
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3id.org/vc/status-list/2021/v1',
    'https://trustvc.io/context/transferable-records-context.json',
    'https://trustvc.io/context/attachments-context.json',
    'https://trustvc.io/context/qrcode-context.json',
    'https://trustvc.io/context/bill-of-lading.json',
  ],
  id: 'urn:uuid:0198a36a-e37b-7aa6-a715-cf85b6019301',
  type: ['VerifiableCredential'],
  issuer: 'did:web:trustvc.github.io:did:1',
  validFrom: '2024-04-01T12:19:52Z',
  credentialSubject: {
    type: ['BillOfLading'],
    billOfLadingName: 'TrustVC Bill of Lading',
  },
  proof: {
    type: 'DataIntegrityProof',
    created: '2025-08-13T12:32:28Z',
    verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-1',
    cryptosuite: 'ecdsa-sd-2023',
    proofPurpose: 'assertionMethod',
    proofValue:
      'u2V0BhVhAX3jgXNIsqyCUgAexhykylzIFcd3e5IYSZUcENyh5-dGj9dofOMWl_KZF4evDJdzgUAmeDLnqcR9CpqAZbRTKVFgjgCQDmbT57c_Tgi3whdpjj8xECa73XTJlKIQPCA3BTPGDFuuDWEBCVN5vUuK3hhOioujlJD9hvc1t8XvFnNBOlIpn9aKrbRShOkkjF7ykaJHDkNPRw7VUYKeWXnfJZi5dzN_Mcnp7WEDDY3Y6r-Vzebgc8sTCxTfKV0hCN8DFTTTe1wOqcdJ9Eh5rHveJJTGuxEHowVucYw_gtPCq3MWd5_My-F1IvepFWECR9pCL1XYfV1Lji0ha6kKaZvJMh7jOASRSbFJnQU_jsV_fhRwrSIBgK3CJcV_5FbqJPurL_X7zuvm7540V6vCXoQBYIMN9Xgpjiq0TdOyfvtotDMTAv150nwqhFrWdtIFgOhfwgwACAw',
  },
});

export const ECDSA_W3C_DERIVED_DOCUMENT_V1_1 = freezeObject({
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3id.org/vc/status-list/2021/v1',
    'https://trustvc.io/context/transferable-records-context.json',
    'https://trustvc.io/context/render-method-context.json',
    'https://trustvc.io/context/attachments-context.json',
    'https://trustvc.io/context/qrcode-context.json',
    'https://trustvc.io/context/bill-of-lading.json',
  ],
  id: 'urn:uuid:0198a75a-de81-7ff8-9ee1-78c4dd730bd3',
  type: ['VerifiableCredential'],
  issuer: 'did:web:trustvc.github.io:did:1',
  issuanceDate: '2024-04-01T12:19:52Z',
  credentialSubject: {
    type: ['BillOfLading'],
    billOfLadingName: 'TrustVC Bill of Lading',
  },
  proof: {
    type: 'DataIntegrityProof',
    created: '2025-08-14T06:53:27Z',
    verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-1',
    cryptosuite: 'ecdsa-sd-2023',
    proofPurpose: 'assertionMethod',
    proofValue:
      'u2V0BhVhA3CXgOMU0EF4qmDn6RSOu7WPpuxjeYbVEk0-tyGCrH3yjG3YY7IXfMz-cL-ligsoQyCWAovEVNvzUB2m0KOUdPlgjgCQD5O3ZFudt4c2ulEYKV5eG7CGWez-e0hoPCYDpm72VGX2DWECLRAcjn-vZFIVZvDw53RpNPBsafE4LW_1A565bZL79-KuFQua5LW7FIUvzKJJs7R1N9iZr0UgQ4poXaOsmVuaUWEB8L389YKMZOS-v0TZ6gmcgorTyeFGS0hCG6A-wpvDlvlvNjQlVGCVFKPokYuIBqWa6bsae93-j3zfX_kbvw0p3WEBb1hc959fOgYowJVy3XAUfBUm6eWnWlMILP51XdzcN4qW8eZ_3fIT02XDQ11ez8yddErKkLRN8bpx32F-UwwXboQBYIFDsDNQlJGfWpg0PWoTxndRra142ri4cbifmOKiInsHWgwACAw',
  },
});

export const ECDSA_W3C_VERIFIABLE_DOCUMENT_V1_1 = freezeObject({
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3id.org/vc/status-list/2021/v1',
    'https://trustvc.io/context/transferable-records-context.json',
    'https://trustvc.io/context/render-method-context.json',
    'https://trustvc.io/context/attachments-context.json',
    'https://trustvc.io/context/qrcode-context.json',
    'https://trustvc.io/context/bill-of-lading.json',
  ],
  qrCode: { type: 'TrustVCQRCode', uri: 'https://localhost:3000/qrcode' },
  credentialStatus: {
    type: 'TransferableRecords',
    tokenNetwork: { chain: 'MATIC', chainId: '80001' },
    tokenRegistry: '0xE0a94770B8e969B5D9179d6dA8730B01e19279e2',
    tokenId: '044905d97399d520ee96e08fe13621e45810e404e9b16ffd43a11dea52a72c91',
  },
  credentialSubject: {
    billOfLadingName: 'TrustVC Bill of Lading',
    scac: 'SGPU',
    blNumber: 'SGCNM21566325',
    vessel: 'vessel',
    voyageNo: 'voyageNo',
    portOfLoading: 'Singapore',
    portOfDischarge: 'Paris',
    carrierName: 'A.P. Moller',
    placeOfReceipt: 'Beijing',
    placeOfDelivery: 'Singapore',
    packages: [
      { packagesDescription: 'package 1', packagesWeight: '10', packagesMeasurement: '20' },
      { packagesDescription: 'package 2', packagesWeight: '10', packagesMeasurement: '20' },
    ],
    shipperName: 'Shipper Name',
    shipperAddressStreet: '101 ORCHARD ROAD',
    shipperAddressCountry: 'SINGAPORE',
    consigneeName: 'Consignee name',
    notifyPartyName: 'Notify Party Name',
    links: 'https://localhost:3000/url',
    attachments: [
      { data: 'BASE64_ENCODED_FILE', filename: 'sample1.pdf', mimeType: 'application/pdf' },
      { data: 'BASE64_ENCODED_FILE', filename: 'sample2.pdf', mimeType: 'application/pdf' },
    ],
    type: ['BillOfLading'],
  },
  renderMethod: [
    {
      id: 'https://localhost:3000/renderer',
      type: 'EMBEDDED_RENDERER',
      templateName: 'BILL_OF_LADING',
    },
  ],
  expirationDate: '2029-12-03T12:19:52Z',
  issuer: 'did:web:trustvc.github.io:did:1',
  type: ['VerifiableCredential'],
  issuanceDate: '2024-04-01T12:19:52Z',
  id: 'urn:uuid:0198a75a-de81-7ff8-9ee1-78c4dd730bd3',
  proof: {
    type: 'DataIntegrityProof',
    created: '2025-08-14T06:53:27Z',
    verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-1',
    cryptosuite: 'ecdsa-sd-2023',
    proofPurpose: 'assertionMethod',
    proofValue:
      'u2V0AhVhA3CXgOMU0EF4qmDn6RSOu7WPpuxjeYbVEk0-tyGCrH3yjG3YY7IXfMz-cL-ligsoQyCWAovEVNvzUB2m0KOUdPlgjgCQD5O3ZFudt4c2ulEYKV5eG7CGWez-e0hoPCYDpm72VGX1YILfHPtzGHotFmZE0vGWFsH5T_mliaK_VXZRZaqVlkS6NmDFYQFNp6GH_bDmDGlCb3f4hhIpE5vCY8v3vc9xEeR6elSND7XlmdXbYpfXfzeDgMkNrGv9Awpt8q_cNTGuZ-Py_bTRYQFMU55RQG280KLBU3KpLXNXfBqaVzIq0oA9zhQZuEkKPpUhKfwHBYGVXj0jzOdLSIe7-5925ivAlYD8-xCrKQA1YQC4YuskhD6qyu058dcYb8gFan83OTts9WpNdpLIgelUkLztuG_31-nc0zJtSoknuyA-v_On7FGnmne1zJ3S_9P1YQItEByOf69kUhVm8PDndGk08Gxp8Tgtb_UDnrltkvv34q4VC5rktbsUhS_MokmztHU32JmvRSBDimhdo6yZW5pRYQAmaDDThptdD3KEXfWzGgBBn5kK_VrrvazQ4bzaYtwlqEZDFCaLePMP9CY8iUUbyQ1JvRX_4HPschYrubl_SliBYQM_90CuoXHgIsO9W0eTxi1YbVioCPOcBAykqYGoQmDoK3Mr1GGCsbZ_tcTw7uGXFWLPZOjNJL1QQ40jaPFkLcFdYQHxdfcvJsoIHJyUi_6yfmGffYgkUGspLEASaicOMRRkQDnt3u1vLElAF8e8HApVD1JjWAYYgP7H8mFZU8_ZqM-NYQBUhIJCPnSBtyBI59FDm5dN5MluYtgouJJmMRWnwz_rXDEuheKMrWaBfO_GhSRIuEbuChSUiF2yxiwCa3ARedDtYQCXzZOV9hPPg8qhHUYYrRhLL0xGau9-oPHCdtFONSiaUAK6FTpwMl26qeBHKnBT8ZYe87KQbhgjFAEC4XTt9CVpYQBzXkKy9B75xEqSKgZ5t0WETWjs18Mew6EPRbAxu-hkGMu2IV5_j-da_MaP3SdyDVKWW5UXGiZXcDNL2yTH6QzJYQNZLKD0MIbDGkK51RSefR2r3SRw9qRZpjfIHNHI-EI_klkKUgTvzT6mIn6il7kb2lEorcfBCnbQsQTF72oRzl4BYQMUWmS1kOEX6zaLurcFTf0qUi-Pr5QipxwRx7zqn0-Nf4V25L5eGC3O5s-zVQVh3YmHw5zN_Ilt35-6N23bfZRhYQGdZiNKgfhsjjaomqm_XtYcWoAfI4NI12foNiArZosb-uTU1nt8YY408RXOCc5r2KbUcAPoLyKP_y8d3l8wgFb1YQETMUxQLarqOhmXJQNRENHdQgiPuhfS4-v_Qutdixnzf5FPWaFJa68cGqfZedZrdJtB84PQ9mKwfUOPvyqMVCa1YQA2B_DMpryEbZz2_LhwIyFDaEz-GQkbHgnNTc02U_eYuVDb6u9VQHLaGh8Xf2X8lCQWLV4-M--_qdA7SYggRChZYQP36at2BmNsBu5mCVUj_cYI2cdRpWRtLpU3V1MvbRap0yl8yFugjmCYhVr_FX0Z1pmy6PIFjOi9Ek3tLTYQnCFhYQKIojqtv-O343E_oKB0IonrzK23TbhnYLUZIvdT3tBSNKJOcsP37D38FoAUQo6ujz92dwGfnGLNuraFMoyuP8EFYQBiILoJ2CDQmvDTkOUeT7l8HTI24ok4-Rod7BiieT_52Kk9fIBOJb0J3yxz8tcJ7Er5fI4GTuGz8sK2fyZzKbwJYQHYQSaSA4ng1mY0M5vsESj6wsUQ3OKT5ZKcI5I85zzB7z33ajC5D72dZpJ27euGQZoij0fDHyB3Bzjs-rzD0ZoJYQDzpKNkh8edZb12ESX-2ANfMbaupt_lgXfYn3X-P1V5yZQ-AtWWH4tKo9ZB13KdNgiV_tok98H6wiRZOhWX6xLlYQHwvfz1goxk5L6_RNnqCZyCitPJ4UZLSEIboD7Cm8OW-W82NCVUYJUUo-iRi4gGpZrpuxp73f6PfN9f-Ru_DSndYQFvWFz3n186BijAlXLdcBR8FSbp5adaUwgs_nVd3Nw3ipbx5n_d8hPTZcNDXV7PzJ10SsqQtE3xunHfYX5TDBdtYQMXPmVJBWMvyyZ6xK-bTDa91uJwPMnpuTpr9J6FNu07vgajiawNwfnUaLkEwac_3xaWtThnqLJKPLHOcE_IeYEJYQBhkGzbcCAFTF03u2Rm2lHUVyQhcZ5KbVuiZHz_lR53BhOCCz4ra47lNLFiS4X7kSBhEtwQ8ZOcqOtM9oBTaikZYQF_ivjUPc6PjNlaANCW9nwDKZjLahZNSq-bh2QckN3yPx7XRN9fHtLNEU1cpmgKrti4p-7r23YwUSor7pWwDHdZYQLr6dyAHcJRaY1PUQhX3jHHNP5ewPY52O6ylBdzrPGcNpJcgBrNhxw1Q6oZaCRAmH8Guq2a8QyYVeVnlkXKXszhYQASCBN5CVB1rxS3Pa2VCw6Z60MwumIlqArUVo-pAa8h6yydyqyC6rCZQW2xP33KxIr7bpMLw2Ii_fqTxuw2tbPZYQBDGQ8CNVHvLyV_XFaCWcOwCNJRoq_hA3PF4sGQWSyLLY3hP7jmH0mwC_JSqsejowQrm-E2vWEu45CSHbrklCEJYQKch-XDAV0uJJ0KSfX02tyC1Yd1y3_aEskRJtPTc40CbIf0vxb0ViR2Zlcrrl-W4RZZ2QBuqZj1S9039_Y51nElYQPzNf34Ae3oi7F9KXrKLYhatXwFsGAmfhLVYsbytmFneTTY4tlu28GzeVofsxoMQfJSOKfAvZPIjOi41-Ge6F6pYQESu3zp8w1-nZA1V0rP-7-MtRHxghwVamsoMlxyNpvsy83FzfEzVYDmArVPWa2DFBlfy3QW9wApblgPDT0cpDONYQPa-1KuGZk1CmZnw4zS2WdC7E6LloIiiS2luFQmBvswty8FKl_aBUSD8E1hiPF9dob8ywhK2t-RrxblUX-zgwypYQCDS6ek8fzFVYStPVciblZoZZj8h-jGiJavg3y8qMVjhc558zekPTYuLseSxXy_VeaLj8UVWeZgiq4OdkZro81hYQEr2Jkj05F-O-ggBabmOlPh7tajG-BEjIEuhDHhE6oKQUARVuGo_sbcJPbAKvBqNDeD7P8F_tNwhK91S2lao9xRYQOsZGPEFIKPzocTX9gkuzuYkzDmS8UrZK8hExnKeLZt4f5zmHV81znitcGe-olTCpvEMt3tp1S9H6mclIxcTF5xYQKx7MZiCYjBGo-O7csc8Eo-aEhjU_1mL5M2VpUXEN0DDRyZuKNlXfu2KhKGecHYh3mBi1BQoOa301A483MPFJ05YQEBJBkhFQT2Ne5dt7QpJJPC6f432ufaibx9p2NDUuaxEUEjxL7plXIwFUIkbugqEMzM7FEp_R2ePMsVJEJRDHmBYQDhEPSM9Bxgtx2rW7Z8BbznEnMZ9uiQWdgWd8CJc1pg2ORYhoxk7LfUMHVmMiCZG175wq88OK9R4GjtVHGTN0eZYQDIFbMaBycQ5DsPp_AxTxkjAH8IKdAUtfsP173xfLmDPUP0FgchQ1hd02LSlTtEhgDYg0hLbJhzJWYt24H3zvbVYQEQaVNVyrVw6XgPrQeqreuR-1Oi29rIaqoWx0riJuCQerAN0MHBWdwgFcWhXftzhnGWhH9Gn7hFj8tRECcT8BghYQD0xlUOIxleK0jMJJBO46yLRYnfwHS8r8QEEV63EYBMTt1dX9YNbB77jDZkZ2ZO6g-O6BBoJtG3P1KvV09D3HixYQLIf5c_l5JNY8vVPBPDOdz4G-EhAX1MIZHn1bgXoPtTRGUEuvNQIy94A8NcjtFPky2t9XnHOoo0emSMxiEZTmb9YQEfu6GoEvOyGMRJZASZDS53O_j4YxuTVtc12Vqfuuc7z9Ed-lMlmDFMltm8YciXfbBEkx4xk8v5w20enAkYhrKNYQMJYmPp6KY6ocP1ZDBAfNBbmEGVqdV9BXXLgnNhg9zQN1bHiEHh_Sx3p3BtPd6FETjs9Yb5nadjWFMX8tvoqEk5YQOfjQpsPlZKx3oyAl9Cqq22t1SJNpgSWD2XC44q1-vancr4XyxNt4KEuINKzwJOzwtOJXbZrSMkaOEuVNTQHi45YQJXXJr5AnDEUEWYMzdRPN-0G2fr4FQNNDTeZNzh2weVfNEqpwfNcaz2dGvFytCk1WBZl5aw0UCRP8kk8rDSsupdYQOD8HclLNZr1XYB_XFusbUp_jjco7k_SMKVLNL1wiIOq-18lwQvafroOj1m4FeeS83dZEVYTlbsTEiFm9KLb6qlYQBBLvuQk5A_KDqcCNTPf2dvJ0LTbr9X30FtxN9cq3093Yy5kke0zhBcbn6FzL5BnqGQf2-k7RWZfJG9M3oipZaBYQPGaq3YmgoBA51P7Hq8VSvNdYDcg6VtpQP8xumCgnElHHZZ9KwOqa1q-Ud8xOIvuEImOT3aWFXdDb4y_V4GZshyCZy9pc3N1ZXJtL2lzc3VhbmNlRGF0ZQ',
  },
});

export const BBS2023_W3C_VERIFIABLE_DOCUMENT_V2_0 = freezeObject({
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
    'https://trustvc.io/context/transferable-records-context.json',
    'https://trustvc.io/context/attachments-context.json',
    'https://trustvc.io/context/qrcode-context.json',
    'https://trustvc.io/context/bill-of-lading.json',
    'https://trustvc.io/context/render-method-context-v2.json',
  ],
  qrCode: { type: 'TrustVCQRCode', uri: 'https://localhost:3000/qrcode' },
  credentialStatus: {
    type: 'TransferableRecords',
    tokenNetwork: { chain: 'MATIC', chainId: '80001' },
    tokenRegistry: '0xE0a94770B8e969B5D9179d6dA8730B01e19279e2',
    tokenId: 'c9f954f5cd10aa6eb4d02a9047ed45d70205e0206425cdd7238d45b3a2529491',
  },
  credentialSubject: {
    billOfLadingName: 'TrustVC Bill of Lading',
    scac: 'SGPU',
    blNumber: 'SGCNM21566325',
    vessel: 'vessel',
    voyageNo: 'voyageNo',
    portOfLoading: 'Singapore',
    portOfDischarge: 'Paris',
    carrierName: 'A.P. Moller',
    placeOfReceipt: 'Beijing',
    placeOfDelivery: 'Singapore',
    packages: [
      { packagesDescription: 'package 1', packagesWeight: '10', packagesMeasurement: '20' },
      { packagesDescription: 'package 2', packagesWeight: '10', packagesMeasurement: '20' },
    ],
    shipperName: 'Shipper Name',
    shipperAddressStreet: '101 ORCHARD ROAD',
    shipperAddressCountry: 'SINGAPORE',
    consigneeName: 'Consignee name',
    notifyPartyName: 'Notify Party Name',
    links: 'https://localhost:3000/url',
    attachments: [
      { data: 'BASE64_ENCODED_FILE', filename: 'sample1.pdf', mimeType: 'application/pdf' },
      { data: 'BASE64_ENCODED_FILE', filename: 'sample2.pdf', mimeType: 'application/pdf' },
    ],
    type: ['BillOfLading'],
  },
  renderMethod: [
    {
      id: 'https://localhost:3000/renderer',
      type: 'EMBEDDED_RENDERER',
      templateName: 'BILL_OF_LADING',
    },
  ],
  validUntil: '2029-12-03T12:19:52Z',
  issuer: 'did:web:trustvc.github.io:did:1',
  type: ['VerifiableCredential'],
  validFrom: '2024-04-01T12:19:52Z',
  id: 'urn:uuid:01999f97-53b3-7337-b852-24fc22e6dab7',
  proof: {
    type: 'DataIntegrityProof',
    verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-2',
    cryptosuite: 'bbs-2023',
    proofPurpose: 'assertionMethod',
    proofValue:
      'u2V0ChVhQkxEIPZQRcCYa_DVdzn94xbcFe1OjSOH2CbwFV3O2fmyzppXKGt1iZg87FnNFKUKpL9591HkwCmKKuQwRkdnexNHPfsTju0WYkOjhuRQNVNNYQD9WZttHrlLy5Yt4KX5JlbD4AqxyPhcyoKk-Wo6FkAtp78zG_THkeDFZZiI-UUYKjRf-169_cRJcvK5pKH1lTFFYYI39K3Wi-5P1hP7ChGf2V9wmQ-egtRazAMNEt_X4g4iitVcZ-PE0kQ-Xsh-ea5CEmQ3V8Yco8ZXCQvfZyu-lahTHpzH70s6N2ZB70Mn52xzHM7_BM1n1ywQ0k4E27OiBN1ggXL67s8-x7caeAOr0kGYLCkwYNN4cyVPSfp7csMhs0DWDZy9pc3N1ZXJqL3ZhbGlkRnJvbXEvY3JlZGVudGlhbFN0YXR1cw',
  },
});

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
