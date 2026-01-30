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
  qrCode: {
    type: 'TrustVCQRCode',
    uri: 'https://localhost:3000/qrcode',
  },
  credentialStatus: {
    type: 'TransferableRecords',
    tokenNetwork: {
      chain: 'MATIC',
      chainId: '80001',
    },
    tokenRegistry: '0xE0a94770B8e969B5D9179d6dA8730B01e19279e2',
    tokenId: '15648d77abd5a02ebde2c072dd3378c1b2f89ac1bb40d9a2b2612b0f497f02d9',
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
      {
        packagesDescription: 'package 1',
        packagesWeight: '10',
        packagesMeasurement: '20',
      },
      {
        packagesDescription: 'package 2',
        packagesWeight: '10',
        packagesMeasurement: '20',
      },
    ],
    shipperName: 'Shipper Name',
    shipperAddressStreet: '101 ORCHARD ROAD',
    shipperAddressCountry: 'SINGAPORE',
    consigneeName: 'Consignee name',
    notifyPartyName: 'Notify Party Name',
    links: 'https://localhost:3000/url',
    attachments: [
      {
        data: 'BASE64_ENCODED_FILE',
        filename: 'sample1.pdf',
        mimeType: 'application/pdf',
      },
      {
        data: 'BASE64_ENCODED_FILE',
        filename: 'sample2.pdf',
        mimeType: 'application/pdf',
      },
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
  id: 'urn:uuid:0199c3d9-47a1-7aad-ab31-f17c85c35b24',
  proof: {
    type: 'DataIntegrityProof',
    verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-2',
    cryptosuite: 'bbs-2023',
    proofPurpose: 'assertionMethod',
    proofValue:
      'u2V0ChVhQicHeGgo-ngEAkIlaL1O_b2XhL8XEX94FRrW5AOC9Hnx0FQTFqA9iVz2HSese9dNpJKDYhTUGpH0ctt8ZZB5_doDVwYVFRXmTAJk7kqK-_h5YQD9WZttHrlLy5Yt4KX5JlbD4AqxyPhcyoKk-Wo6FkAtpDWl0V5eBqRG3QfLSfc4qG9tRFNkt0RSNMTTit-pOc6JYYLDx2EM7LXGzSqyTOC8ZKJ9hgD0GHrf59LhRlLV3-pK34L5ohGo8I-g81SD6xVKofBMNiXxFLrp7w56sQlEOkcpISekB2jtn0DeTWzNHrnVwuejhZPM1PPtOuxtkbzj6J1ggaQbwf84CJ4iQHGBFKYxYIBQP3qvdSn1isizeXkY-fGODZy9pc3N1ZXJqL3ZhbGlkRnJvbXEvY3JlZGVudGlhbFN0YXR1cw',
  },
});

export const BBS2023_W3C_DERIVED_DOCUMENT_V2_0 = freezeObject({
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
    'https://trustvc.io/context/transferable-records-context.json',
    'https://trustvc.io/context/attachments-context.json',
    'https://trustvc.io/context/qrcode-context.json',
    'https://trustvc.io/context/bill-of-lading.json',
    'https://trustvc.io/context/render-method-context-v2.json',
  ],
  id: 'urn:uuid:0199c3d9-47a1-7aad-ab31-f17c85c35b24',
  type: ['VerifiableCredential'],
  issuer: 'did:web:trustvc.github.io:did:1',
  validFrom: '2024-04-01T12:19:52Z',
  credentialStatus: {
    type: 'TransferableRecords',
    tokenNetwork: {
      chain: 'MATIC',
      chainId: '80001',
    },
    tokenRegistry: '0xE0a94770B8e969B5D9179d6dA8730B01e19279e2',
    tokenId: '15648d77abd5a02ebde2c072dd3378c1b2f89ac1bb40d9a2b2612b0f497f02d9',
  },
  credentialSubject: { type: ['BillOfLading'], billOfLadingName: 'TrustVC Bill of Lading' },
  proof: {
    type: 'DataIntegrityProof',
    verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-2',
    cryptosuite: 'bbs-2023',
    proofPurpose: 'assertionMethod',
    proofValue:
      'u2V0DhVkF0IoMJuP2cjbd_u5EDovRaWnAazxjEwFveZdWE9ovyg7ES9qgAidZbuY8-AGIU9HdV4pSNvqj0GSuXml7K3dT8SjCkyQQQ357nPfVkGPOtBFwcfCOw1BURZscQb16MB7nLYyTvAKHaC20Xw3thMyqZU_g6h8RWYRyljBesFgwpzdJuoCVS-FKjiDus99iLrYx9BOmVCfIGwtcox4vvW5cxrdQ2_71L0ZgRtctpkUbQ1rdDw_nD5Bjc9fnoeAX0_AZRnx6k6ITPDxzfTScwrk9f3pU6hTR5yWpjETAEmWgkq1vgVQghMNispZznFgJ01NedwY8hqRRFrnympaW2aKxyT1YenMSusyTwLdLu37k4xrcW2X1vLesOPVkzpxsGYIRsby6cJs8fHyWPKsUBCR7N2kWt2k1MVZM8wEpPR1c-hkjgEqoPxjcRJWLKoGLbcGEgUdik68FFz7TGvgY8VEIgTz-t4Hs_I2LtgFcwkPMW5W2Qp6eISFn08smoWR874uI7AlW7j56-Z0VTILPcfsD1TVDl4pvP3_SB87hBEb9ixi-tKf_7YcrmvnAZnGOfgr7wBaXP_WgzD3Ms7BJAYC-IAcxpXlKCTbQcvw6dM9VjMNAR8xFqadlfz2pGkMPjMiXb1Sg6QAtLp6COMnFL1x7pRxO9jNK8b2v4PC08r1cUeRKdx1ZveMG8J4zFp8RzwQAvDVsAffpG3j528csobWUeo-B5HLoVJyUoQMuBrjVlBnbMEdaAdMh5VScDfaPM4m6s1OgEtEOuI9WpHUzQgkY4O9w7M1CWFX0I9M2NIn662KS3yZXRlpNcFQPuxjBCbIuCR36E0b_KbLWS9_e0Etsm8qQkQzUt-w8m7Ja6RUEK6-wE_zBGzNZ0PaqqlqDjpqxzleCaXWf2aKNYC_VeRGiGlZx0mxEltC6WySJbCeVzM51zVgxyTR3XqIg0tNS-0BoHwpb4WLvJQpIbFlSvnxWRfJx6nTHaBgBKLrYTPFt1tPRQ9VNF42DmgTcXzS34cifLsj12UNdXld91nD4JaFIw2c6BJ5wrB_Gbe5kJ4Q1IQSOJbSM-2RZAUxpt2pg-aIhSwSxhq3fvxN9fyWEs1_Vy8Jui5PXLg8NfQ6xNza8qGZEKiJTXu2gFKjOxZhORbem3c0mTlvsGgmcvXOnxd2sLddeEPs3tWCSgdJwnlpV2osZZrJi3_l1TJThbeMN9qKTiVuXQRbA4jvBsYy4iyCNBRzqsYPW6-M2mmx7D_KPqxaXVzM_13hcSI8OXACQ4Lu8Z-HvrQKJ9_CsFwNTERWbvVUQnLSl-GStX1n6Y-ow2XKLxr4KIhjyHVCqQdXV6oIZzzLogEfiQLLGvSjt90ozMoWkPVl1OJlYah2lVJaPpekdOlh0d-6dQowaMGGVmxfNfpjAXFbYmIaX96GgBf-b-1cyqGD3hg7UnKTQzhtbCVSuggrsf_jVLg3wBxRgmrD4AmY9gZZsirdRyCIXSIzgT3YRb4sDfY-V-OzA6pRLBpfRZKT8mSiGHH4VuLWGD3L7w5rSOGoFmeDXmtqjDBq73OpO-4j08YAMStjPFFip8zklkPEGJ_zY0nrqj_FIBpLNDSbz13VIacX07aMn7ofLa6Gy2zQ5EgdO3lgL3Motg6E8XgRbwsrI_qFRcqfQ4Ok1KBaVvURjwe8fOPDpV805QZsVUVPwFlcErdoXTIlxEPwZpBYvea6HQUx7PCA5rxdAA0tMzLhr_Ic2mLZ_UdIxXOdhyy9hrn55SldDk1xKA2rMLLolbIsZeReks1-HBmheDhukb9Ogb4UVIss3zgpfES1CBCrkMbhFs3LIbGl0yamlgo0u5w48yVpvwLcT2jK-GALpZBlirOYqVf9N9ymWod-U4RfM5c-e-e1ZnHuf3usgM9G0rf_0nUv-V9EFVSnzTBp55LIWf5J3sGqg2yDDEOxDv0IPb422D3mE7jqJuUpldBTaMh63zbF7Hq3jcaZ9l6MABAECAgGKAAEDBAUGBwgLDIMDCQpA',
  },
});

export const OPENCERT_VERIFIABLE_DOCUMENT_V2_0 = freezeObject({
  schema: 'opencerts/v2.0',
  data: {
    id: 'dc24bc12-3c9f-49da-8a79-e5d258de6264:string:01DC201210904BSCISM_3104204_000704',
    $template: {
      name: '523873c1-f165-4bb3-aed1-b99a711a157c:string:SMUCertificate1',
      type: 'f5b797ad-169a-450a-b235-089e22daf6e6:string:EMBEDDED_RENDERER',
      url: '53ac0e37-78ee-4b2c-8385-b5427adc41a6:string:https://ecert-renderer.smu.edu.sg/remote-renderer/',
    },
    description: 'e70cbd56-fe71-467b-8cfb-e2930e26144f:string:Degree',
    issuedOn: '36d4f809-10da-42fb-8d94-ba7f55702a4c:string:2022-03-01T09:42:00.000Z',
    admissionDate: '01cfc3be-cacd-4522-9397-64bd008b06f5:string:2008-08-18T00:00:00.000Z',
    attainmentDate: '34db5ed5-c325-455a-a396-00424165ef3b:string:2012-05-25T00:00:00+08:00',
    qualificationLevel: [
      {
        frameworkName: 'b39a34c5-e48e-4725-bcc4-b27d59f3b644:string:singapore/ssec-eqa',
        frameworkVersion: 'bf25d8f5-eb6b-4a25-afc1-6b764e3a949c:string:2015',
        code: '971d7b24-6db6-431e-b709-70259e993d29:string:70',
        description: "d78fe519-be88-40c0-a073-1d0aebafd94a:string:Bachelor's degree or equivalent",
      },
    ],
    fieldOfStudy: [
      {
        frameworkName: '90acd821-ccd1-4735-ad1f-5650108a1856:string:singapore/ssec-fos',
        frameworkVersion: '748d09ee-8be7-40d6-b8d2-38b212af6da1:string:2015',
        code: 'ca0944e0-60d3-45ba-939b-c2aa34fe7518:string:0912',
        description:
          'b0a05813-5da9-4682-a03f-b774b7b2b21c:string:Information Systems (including MIS, system design)',
      },
    ],
    name: '573a744c-1c86-4e3c-84ec-b8d7d9769318:string:Bachelor of Science (Information Systems Management)',
    issuers: [
      {
        name: '534b6aca-0b20-45ba-9141-55a1a473f9ea:string:Singapore Management University',
        did: '5070c901-91d4-4318-b885-08881db017c7:string:DID-SG-UEN: 200000267Z',
        url: '56fd655a-2da1-4552-a881-b0dafb27a4a4:string:https://www.smu.edu.sg',
        email: '2fcfc306-cee4-4235-97e5-9c350578ecf2:string:digitalcert@smu.edu.sg',
        certificateStore:
          '514e59c7-6025-488d-89b0-ebbbe8f9b562:string:0xCFa2B7Fc3FdD5CA55715581e34420268CCcd3039',
      },
    ],
    recipient: {
      name: '351f1b0f-558d-4954-970c-fbe517de6bd1:string:POH HENDRY',
    },
    additionalData: {
      honors: '42fc0536-197d-4cf0-8a65-6c3980cfa8c5:string:Merit',
      serialNumber: 'cfa1013a-1f97-46b9-a757-3691bdd7fc0b:string:201210904',
      Signature1:
        '822c6acb-8de2-4600-88de-40bb555311b7:string:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAkAAAADwCAQAAABCxhPhAAAACXBIWXMAAC4jAAAuIwF4pT92AAADGGlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjaY2BgnuDo4uTKJMDAUFBUUuQe5BgZERmlwH6egY2BmYGBgYGBITG5uMAxIMCHgYGBIS8/L5UBFTAyMHy7xsDIwMDAcFnX0cXJlYE0wJpcUFTCwMBwgIGBwSgltTiZgYHhCwMDQ3p5SUEJAwNjDAMDg0hSdkEJAwNjAQMDg0h2SJAzAwNjCwMDE09JakUJAwMDg3N+QWVRZnpGiYKhpaWlgmNKflKqQnBlcUlqbrGCZ15yflFBflFiSWoKAwMD1A4GBgYGXpf8EgX3xMw8BSMDVQYqg4jIKAUICxE+CDEESC4tKoMHJQODAIMCgwGDA0MAQyJDPcMChqMMbxjFGV0YSxlXMN5jEmMKYprAdIFZmDmSeSHzGxZLlg6WW6x6rK2s99gs2aaxfWMPZ9/NocTRxfGFM5HzApcj1xZuTe4FPFI8U3mFeCfxCfNN45fhXyygI7BD0FXwilCq0A/hXhEVkb2i4aJfxCaJG4lfkaiQlJM8JpUvLS19QqZMVl32llyfvIv8H4WtioVKekpvldeqFKiaqP5UO6jepRGqqaT5QeuA9iSdVF0rPUG9V/pHDBYY1hrFGNuayJsym740u2C+02KJ5QSrOutcmzjbQDtXe2sHY0cdJzVnJRcFV3k3BXdlD3VPXS8Tbxsfd99gvwT//ID6wIlBS4N3hVwMfRnOFCEXaRUVEV0RMzN2T9yDBLZE3aSw5IaUNak30zkyLDIzs+ZmX8xlz7PPryjYVPiuWLskq3RV2ZsK/cqSql01jLVedVPrHzbqNdU0n22VaytsP9op3VXUfbpXta+x/+5Em0mzJ/+dGj/t8AyNmf2zvs9JmHt6vvmCpYtEFrcu+bYsc/m9lSGrTq9xWbtvveWGbZtMNm/ZarJt+w6rnft3u+45uy9s/4ODOYd+Hmk/Jn58xUnrU+fOJJ/9dX7SRe1LR68kXv13fc5Nm1t379TfU75/4mHeY7En+59lvhB5efB1/lv5dxc+NH0y/fzq64Lv4T8Ffp360/rP8f9/AA0ADzT6lvFdAAA79WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNyAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxOS0wOS0wOVQxMzoyNjowNiswODowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE5LTA5LTE3VDE1OjM4OjAzKzA4OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxOS0wOS0xN1QxNTozODowMyswODowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9wbmc8L2RjOmZvcm1hdD4KICAgICAgICAgPHBob3Rvc2hvcDpDb2xvck1vZGU+MTwvcGhvdG9zaG9wOkNvbG9yTW9kZT4KICAgICAgICAgPHBob3Rvc2hvcDpJQ0NQcm9maWxlPkRvdCBHYWluIDIwJTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICAgIDx4bXBNTTpJbnN0YW5jZUlEPnhtcC5paWQ6ZjVhN2I0NmQtYWM5Mi00ZjczLTgxMGEtODQ0YzA1NTgxZjZlPC94bXBNTTpJbnN0YW5jZUlEPgogICAgICAgICA8eG1wTU06RG9jdW1lbnRJRD5hZG9iZTpkb2NpZDpwaG90b3Nob3A6ZmJhOTQ4OWUtMTM1MC0xMTdkLWE2ZjQtOGYwNWUwYjVhNWY0PC94bXBNTTpEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06T3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6YjBjYjQ5MTUtMDUyNS00YTA1LWFjY2MtY2I3NDIyMGY4YTEzPC94bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpIaXN0b3J5PgogICAgICAgICAgICA8cmRmOlNlcT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+Y3JlYXRlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOmIwY2I0OTE1LTA1MjUtNGEwNS1hY2NjLWNiNzQyMjBmOGExMzwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxOS0wOS0wOVQxMzoyNjowNiswODowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOmI2YWM4ODhjLWM0YWUtNGQ1NS05Y2ExLTQyZDNmM2FjNTE0Yzwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxOS0wOS0wOVQxMzoyODozNyswODowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOmY1YTdiNDZkLWFjOTItNGY3My04MTBhLTg0NGMwNTU4MWY2ZTwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxOS0wOS0xN1QxNTozODowMyswODowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG1wTU06SGlzdG9yeT4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+MzAwMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+MzAwMDAwMC8xMDAwMDwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT42NTUzNTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+NTc2PC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjI0MDwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hw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',
      Signature2:
        '677cc601-eac9-4a1e-868b-239a68e16a7d:string:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABXgAAAJHCAYAAAAqgD7BAAAACXBIWXMAAFxGAABcRgEUlENBAAAHXGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDE5LTA5LTIzVDEwOjA1OjI1KzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOS0wOS0yM1QxMToxMDoxOSswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAxOS0wOS0yM1QxMToxMDoxOSswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpjODdmMDUwZS1hOTEzLTQzNGItYWMwMi1jZDI3OTAyYmMzOTgiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDpmZjA5ZjExOS04YTJhLTU4NDQtODg5Zi0xNTk3MmZlNDE2M2MiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDphOTJmYTNiNi00Nzg4LTRhZjYtYWY1Zi1hZWMxNjZhZWUyZmEiPiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6ZjdhYWYwOGItYTc3ZS0xMTdjLTgyYmQtZjY0MTY3NmZhNzcyPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6YTkyZmEzYjYtNDc4OC00YWY2LWFmNWYtYWVjMTY2YWVlMmZhIiBzdEV2dDp3aGVuPSIyMDE5LTA5LTIzVDEwOjA1OjI1KzA4OjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjFhNGYzMjEwLTdjYTgtNDI1NS04NDhmLTMwOGVjMmQ3NDgyMiIgc3RFdnQ6d2hlbj0iMjAxOS0wOS0yM1QxMDowOToyMiswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjODdmMDUwZS1hOTEzLTQzNGItYWMwMi1jZDI3OTAyYmMzOTgiIHN0RXZ0OndoZW49IjIwMTktMDktMjNUMTE6MTA6MTkrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdl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',
      Signature3:
        '8b8829d8-77fa-4673-8041-cc8a5585f2b8:string:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAYgAAAEMCAQAAAB0a+ljAAAACXBIWXMAAC4jAAAuIwF4pT92AAADGGlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjaY2BgnuDo4uTKJMDAUFBUUuQe5BgZERmlwH6egY2BmYGBgYGBITG5uMAxIMCHgYGBIS8/L5UBFTAyMHy7xsDIwMDAcFnX0cXJlYE0wJpcUFTCwMBwgIGBwSgltTiZgYHhCwMDQ3p5SUEJAwNjDAMDg0hSdkEJAwNjAQMDg0h2SJAzAwNjCwMDE09JakUJAwMDg3N+QWVRZnpGiYKhpaWlgmNKflKqQnBlcUlqbrGCZ15yflFBflFiSWoKAwMD1A4GBgYGXpf8EgX3xMw8BSMDVQYqg4jIKAUICxE+CDEESC4tKoMHJQODAIMCgwGDA0MAQyJDPcMChqMMbxjFGV0YSxlXMN5jEmMKYprAdIFZmDmSeSHzGxZLlg6WW6x6rK2s99gs2aaxfWMPZ9/NocTRxfGFM5HzApcj1xZuTe4FPFI8U3mFeCfxCfNN45fhXyygI7BD0FXwilCq0A/hXhEVkb2i4aJfxCaJG4lfkaiQlJM8JpUvLS19QqZMVl32llyfvIv8H4WtioVKekpvldeqFKiaqP5UO6jepRGqqaT5QeuA9iSdVF0rPUG9V/pHDBYY1hrFGNuayJsym740u2C+02KJ5QSrOutcmzjbQDtXe2sHY0cdJzVnJRcFV3k3BXdlD3VPXS8Tbxsfd99gvwT//ID6wIlBS4N3hVwMfRnOFCEXaRUVEV0RMzN2T9yDBLZE3aSw5IaUNak30zkyLDIzs+ZmX8xlz7PPryjYVPiuWLskq3RV2ZsK/cqSql01jLVedVPrHzbqNdU0n22VaytsP9op3VXUfbpXta+x/+5Em0mzJ/+dGj/t8AyNmf2zvs9JmHt6vvmCpYtEFrcu+bYsc/m9lSGrTq9xWbtvveWGbZtMNm/ZarJt+w6rnft3u+45uy9s/4ODOYd+Hmk/Jn58xUnrU+fOJJ/9dX7SRe1LR68kXv13fc5Nm1t379TfU75/4mHeY7En+59lvhB5efB1/lv5dxc+NH0y/fzq64Lv4T8Ffp360/rP8f9/AA0ADzT6lvFdAAA79WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4KPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxMzggNzkuMTU5ODI0LCAyMDE2LzA5LzE0LTAxOjA5OjAxICAgICAgICAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIKICAgICAgICAgICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgICAgICAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgICAgICAgICAgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPHhtcDpDcmVhdG9yVG9vbD5BZG9iZSBQaG90b3Nob3AgQ0MgMjAxNyAoTWFjaW50b3NoKTwveG1wOkNyZWF0b3JUb29sPgogICAgICAgICA8eG1wOkNyZWF0ZURhdGU+MjAxOS0wOS0wOVQxMzoyNjowNiswODowMDwveG1wOkNyZWF0ZURhdGU+CiAgICAgICAgIDx4bXA6TW9kaWZ5RGF0ZT4yMDE5LTA5LTA5VDEzOjQyOjMyKzA4OjAwPC94bXA6TW9kaWZ5RGF0ZT4KICAgICAgICAgPHhtcDpNZXRhZGF0YURhdGU+MjAxOS0wOS0wOVQxMzo0MjozMiswODowMDwveG1wOk1ldGFkYXRhRGF0ZT4KICAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9wbmc8L2RjOmZvcm1hdD4KICAgICAgICAgPHBob3Rvc2hvcDpDb2xvck1vZGU+MTwvcGhvdG9zaG9wOkNvbG9yTW9kZT4KICAgICAgICAgPHBob3Rvc2hvcDpJQ0NQcm9maWxlPkRvdCBHYWluIDIwJTwvcGhvdG9zaG9wOklDQ1Byb2ZpbGU+CiAgICAgICAgIDx4bXBNTTpJbnN0YW5jZUlEPnhtcC5paWQ6MGYyNWZkZmQtMjNkMy00M2I4LWIzODUtMThmYjkzNTBjZTU2PC94bXBNTTpJbnN0YW5jZUlEPgogICAgICAgICA8eG1wTU06RG9jdW1lbnRJRD5hZG9iZTpkb2NpZDpwaG90b3Nob3A6YzJiNGE5YmItMTM1Mi0xMTdkLWE2ZjQtOGYwNWUwYjVhNWY0PC94bXBNTTpEb2N1bWVudElEPgogICAgICAgICA8eG1wTU06T3JpZ2luYWxEb2N1bWVudElEPnhtcC5kaWQ6ZDM2MDI3MjMtMTYzZi00ZWI5LTlmNTctYWIxYzUwMDU5M2ZkPC94bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ+CiAgICAgICAgIDx4bXBNTTpIaXN0b3J5PgogICAgICAgICAgICA8cmRmOlNlcT4KICAgICAgICAgICAgICAgPHJkZjpsaSByZGY6cGFyc2VUeXBlPSJSZXNvdXJjZSI+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDphY3Rpb24+Y3JlYXRlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOmQzNjAyNzIzLTE2M2YtNGViOS05ZjU3LWFiMWM1MDA1OTNmZDwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxOS0wOS0wOVQxMzoyNjowNiswODowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjM4NTI4Y2E1LWNhZWMtNGZiMy1hNzA3LTIxYWEzNmQyMmZkODwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxOS0wOS0wOVQxMzo0MDo0OSswODowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICAgICA8cmRmOmxpIHJkZjpwYXJzZVR5cGU9IlJlc291cmNlIj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OmFjdGlvbj5zYXZlZDwvc3RFdnQ6YWN0aW9uPgogICAgICAgICAgICAgICAgICA8c3RFdnQ6aW5zdGFuY2VJRD54bXAuaWlkOjBmMjVmZGZkLTIzZDMtNDNiOC1iMzg1LTE4ZmI5MzUwY2U1Njwvc3RFdnQ6aW5zdGFuY2VJRD4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OndoZW4+MjAxOS0wOS0wOVQxMzo0MjozMiswODowMDwvc3RFdnQ6d2hlbj4KICAgICAgICAgICAgICAgICAgPHN0RXZ0OnNvZnR3YXJlQWdlbnQ+QWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKE1hY2ludG9zaCk8L3N0RXZ0OnNvZnR3YXJlQWdlbnQ+CiAgICAgICAgICAgICAgICAgIDxzdEV2dDpjaGFuZ2VkPi88L3N0RXZ0OmNoYW5nZWQ+CiAgICAgICAgICAgICAgIDwvcmRmOmxpPgogICAgICAgICAgICA8L3JkZjpTZXE+CiAgICAgICAgIDwveG1wTU06SGlzdG9yeT4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+MzAwMDAwMC8xMDAwMDwvdGlmZjpYUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6WVJlc29sdXRpb24+MzAwMDAwMC8xMDAwMDwvdGlmZjpZUmVzb2x1dGlvbj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MjwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT42NTUzNTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFhEaW1lbnNpb24+MzkyPC9leGlmOlBpeGVsWERpbWVuc2lvbj4KICAgICAgICAgPGV4aWY6UGl4ZWxZRGltZW5zaW9uPjI2ODwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgIAo8P3hwYWNrZXQgZW5kPSJ3Ij8+l7tqYgAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAVt0lEQVR42uxdu3bbuBbdyMoPaGrfRtMppadwKrnwfAL1BXd5iqlyb6F0ZDqncKZKoXwC9QnOWtY0mSmcznanFJPuFs4n4BaiKIAESQAERcncW40s8wEeYOMcnAcoJAiC2OIFRUAQJARBkBAEQUIQBAlBECQEQZAQxw0RiUhIkYoJZXEgPcI4xEGIf4VE/kl5kBAUP3JK/C4fKRGaTMQG53hFIZAQxA5vKAKaTBS/BikoE2oIgvMTCUGQEiQEQUqQEEQ1pACkkAIzPCiU+MJAHQkxVCQAIJf4ffMNAPAaH8WUoqF+HnpnxAopGLumhhi8AfVOIcQ5zikRagh2SIQ0+/qARzmjREgIdorUl90ETaZhm05iZzpxxiIhCG01QUqQEAQpwTUEYeie7QL7L/kHpUFCEARNJoIgIQiChCAIEoIgSAiCICEIgoQgCBKCIEgIgiAhCIKEIAgSgiBICIIgIQiCICEIgoQgCBKCIEgIgiAhCIKEIAgSgiBICIIgIQiChCAIEoIgSAiCICEIgoQgCBKCIEgIgiAhCIKEIAgSgiBICIIgIQiChCAIEoIgCBKCIEgIgiAhCIKEIAgSgiBICIIgIQiChCAIEoIgSAiCICEIgoQgCBKCIEgIgiAhCIKEIAgSgiBICIIgIQiChCAIEoIgSAiCeD4QMv/ETUdSWkfZwbvvUlAeFVKKkZj/Uy2zlxTb8VKBqJFThLReimZS0GQ6ni6eiEh8oRyaiCAiIYWso0NOGU44R9zRUyQ4d1P/A5TReZWRBCABcK7K0CQ5EuJItAM+mulAQihkODfKKKOIfJcdtfuFhDja7k4RVf2PhABEbCTDCqsNEcyD3iQ5Lqr3P7S3A3nWig4zRIgAfPBqxRu8dm3FQUs0Kshmgwf5aHz2GpAQ++w6qf9lN7cXlfj2LDFBBOBv/xZkvyTlOfQ4JWqjMatdsdvTnT+IISEl+HGUm+FH57Oi/PcIEhJxu/tnn/go5Rm7P4d6jrOUmi7JId6WDs0yrO5wRMHocISU8CFD8SzzMTSZ9rPkS9qtNzbekoJpY23q1C3Jn4ehZGN8ikjthaozWgTmRMqhbuMwFalGh+9Y4qHZyScm2jD+jpk6/IVEhEeru0cFOjxgiSVebxJ7sMx+fSVOjkKakYgKMltK0UwHEWmhumXNGTSZOlbtt7piR2RlyU4L50XF61rdfVK4ikSMaYUpFR2hoZRaGkr6eWkL05KECNqBsd3SrjCQY18LH2mznX08hMjcCLvPLSbOZ90irj+La4h9rRwSU4ioAlqShp9TVMQF73zie6WDkOUU59rTrLDCSj46n5XIPxtu5czS+8PVEEjzz9kBtEX989re+aedGfnN3CXdEDWYCClODlo33OtPY6kb9LO+WJ3lbwT4ux/34Njs2QCoN1XqpOgap7C4f2xxXHw8ppKvm9nuvD2nf288BM11S+7X1XwPiVwekL53iAQXPCheaRUiLcjinUuc9wCRujlYN5VxRbesbcZXX/UQSUhKNPjr9752sB2QjURa+txdXzkc77qhTForB6shRuGU/rhPH1M3kdGCL6d35W/hVK04ou1zFL1affRGn2awIX7tbDzvkRA4s/MEtxoEbyzPmtgssDxaM1GWs6kLZTDBl/zXf3zWQLi297Yrlvk/YddbOPN1BNSuHe7rHSWISm6E1NMd4djdty0IkYYnRDGAZfkUMW7tvNjSWz61S1kTIeJ2LgHt/MbIhTLYQk5OU8SZZycOSocmaZbiPf73921k7CGs+9Cd4BfAyomZBidEaiefIiEw1SLabY2lNNTkhNhlaBUmp7glte61cNrUmgxt7+xHiJYzeRp8AFqLob3juP2VlSPjMq1b0sFC8ynDLTZrI0x3Q80zSUUG0/v3ZjpgaiBD2lY3uR38xZsQetPPgtNBWp6RhumyhtZcuwQ3lbVDa1PUJmSl3D8KNW2ULPg2MRQ9oBaZRgsipIWw2+bpW4cX/Q6OWtEh0EB0pkOwLmvnsykZTK3a46olbYa6Td1A+1oPm7XD/nuyh1ymMEXxmr955hyr8A57NbbG0fPfLjimRh1cawI66IfgvWxzt8B36l5D+IXew6Qm1PinA6Z3tKnbatMe9/WQzSrQZo6uM5XCJZ003quDBB2/QyP/W/RLB/+nCOdOriBE3IYOzhk+UXtCmPw7bYsDqnrHKLNOwomdE6K48AkS+nGhw7V+79CEcF5+RoYf7z20w7W7TJX7nVn1WHVo8aQ0X7/Rw5It1w9ZCxEhKgQcWwTduiKEQ0gr/HJa81DfV/mnS/e/zYtzPJ7C0kEYexMibtFxqdFhGld67G/LVXMVPVYXaTeWHrV1aevXM8YYWgXduiJE7EuHIISwjuhqAo1NEYD908FIiEZa10ohqmhR7Nd7zdKtjgu3k65y9m0/ZHAihPvDmh4pbKqGQ7BqWk5v2L+5VEEI/8V0oSCyWjr2vVffrnJ9srY1ThxIP9yWasEVHX8ohHAcSnjThV/HVj9od0+3gybskgxnivFm/WR6GM4ryJkWn8vQHu26ijQaAndakO+keUWoHxOMEPrnCyK7Grl+CBG7dVvbwJPPjGyRXh1CP3glsrTXmeZnqNbGLnqsXkKFlUNcLfdwA3E/NOg8MFcoU+mtuL/TnbHTPoKUeWhqWdinqeLK4aSx/9KjXvY17zb01D41wWx9+2iRwPohgBPaP+bRNLf6rXLq5n+bvY18NESoqMwBa4jKjRv3sPF6Dy8j7LV+23eTTNc6cP0+oSRbmbbSZ+Gr49zcHAg70esNwi2pLZLSdo7MtCac17pGTAsgRX46Dl9arKFSCZwYqsQKV3YtAzLP0AW/WGprGVQeNTHGYgKGbjtfVDtFhgvlN6EI0RQwUhyCxnKSkPV6vqq9pbN161SNa7OI8oCjEj5zTymJfUKrTc7dTcjQ7FI9TkJYhJD0DteCLZPubHbtPtOG+HZLkTfdyzIyMvG9b2UMV2uRu+QbrmIxARTKWKNcw8TZx9ziGFO3MXY4hEitOz3rhHDLpLru1UyYabv4dk3Uu9itjl1nGnBeRCyGxowD1l3ypUSMqHCnxtBYqdJtI6/7mlNiI4GnB00IJayT2ppLhlBYKELEJTKk+Cf/86zCdr/3iinvtsZsbe36lLta+GNSnJRDkFqLU1tdVMgkihSpWl+nUnOZPoXdOQ7Bx2RHCEvr27ggC/SQVdexS4H2SrFo7trUW9C+u3nHhoS6tPmX1kMh9SR+JRUs7h8dASFc5/AO9EON/yNUzpFDs2LPYRJsE7Lybhuu+2/YPHfAIRV3GaU5qDiEOYLqc51aL7fiofaJOTQd51jQmQifLeY9vOxVbyLVfpt1E5dwjTpsjtdbbHcNKdSzhOwjVt1ICLskDJ+3L7cL4NgPXftBUvuSsCUefAdb20SWqsFVfLIuwme+V/E7T6dEL6QIkVCnbMOY+oXzsquk5nBVYXEXFaoJIstAYaUJYaj/2myemGrPo4bFZH1WaI2542KPn5XadFaQl7pEvfZf4RjMuvt+IgLFnF2t37efsx7XEM2Z9FVFKY75T9Pq7SVrFriNLjqbDKhy/ZfhXWz5dmKubly/TdqUbSE1f72VVDwLaarvtVdKTI3BO2lw6MbhS4Zg35muRzjFtye4rRvclYJpDhRGFtFTi4WffwS+cP3ISleWX9ZYSdBwyQ/5IOs1NJaTwtq1EbLVLQ2muu197QmBGGn9XF9RUBi5GAIWZEirZ5zigK4q4mxqu5frMm7IizoIh2VwUsROUQ2LFyrugxBfqrthl2xmUaXV+P6v+qCOT0pgoaavYSPE8orBNk3PjRClMGDFk1YQIsh2jgdEiqg2EdCQ2Kiv+zokhN286RvOc/DFx54PGDUHuXyDju3dElWdYZk5exBpcQeSZ9QygvEiiDvQsyZg+zY06yjCOylCbBQpYiE1h6Vt7KSzPH0Rl9+LhsTN4ShneOaQm9fHdeqGfRmADkdWZmoT5Ar7pA1XjwzFqI3Uk0uRdFG0cxzEqOuZdpJ46RvS8t/eV79ylx3ZHNBzuntw/RBmo+AhUcEmKt4OL1p25XfMKobJX9UzomKw7Kv8MsF3EWlmyQNe2+2XnZ3zHY+eejBR5aZ+DNHwJZZOBqQYMh20/gk0Pbz0a0T+9e+q1YP8Q3zIvk7EVP6ZDw9kA2SFFbC32tlzRHil/L1CIv+2OnNrzvy3w9rpFVabIQ7CbRxOCjZM6z7yIISYInZqwCskYpXP1LsB+eceZXeufH/AEivXu3u6DSbanc142LMsngcZpqVJDli1T2186dGQJG9GvXdpt+g7Lw2LVY9D4NF+JhZtl/2vlCdPCt2V5O0hHVynmcg0ppDIxz0TQkSIczrM6mdN+U48GjfzmgF46EmWMwDfHY6PlPN0Seye7IPdneVSPCLdXanP7WuOmg4pTvC6tGL9Aw/t6QA4heV8gh8hgyZtQzn+RTmumx6Uw2fbc5578Kyf0Fy4O7yo1QZJAMKJPl2Eyv1m/fpjjF4lInQvt8YLly71a4LqaexDWNnH2UAJEitJu+u6AzRmYhF3eG1pDsOFlelLHzrg2ScJNA1iu9k+rIf88OmABBCP4ddG1ZujdrAOc0ofs6hQezbWam1ao11a4CEUze85N/Ue1yHHR0W26z/dvWXO1e26os88Cy/aQHW0Js9fLnIp/oeP+I9INl7GAFI2S63LIKmThrjvv5ZqT3PdpOpdbW578CFF9oKowfiBovaFStmLI4OWx3ajId4NRjvkAbXyPKfph6YAY4IHrACLePXz0RJbvRiLCZxDsCKGKZCba9mu01tqVofiBB+UBO3ZkEJJeUr2B/nfGpEtQ8RGn7H0AOABj021GiJSxllVbsASy72MP7ul5WADQJHvgpohtGCfvVYCNsQhmGJcgyWzU+vjP+0dCVJIsd9KwJfsOrcog0gpH+vh/E608K71Mw2/YLfVLYmLVmufb1c9Tkp42BdJn1YJNUQ1Hoo1cmKi5t/LGUXkMtc369ZDkCgJUTaK4nyNUPRqqN6QhJJypMVRTCA0mQwqu4IoU9U7zgX18wQJYY9zrfqNeJagyVTUAxWWrjhTg5Ssdnu2/c+qlQqBFHZh8q0GIWgyPffFIelAQlBvUAYkBGGiA6MPJATpkOGBy2kSYuh0UKsflqQDCTFsOqhb8WQ7sBIkxFDpoO5iyx1YSYjBa4ePSjLfv0mHga0YiWqBMPZADUEQJARh0gXUDyQEQTqQEAQA/a1If5EOXENSKFuhrPA7910aFlgPYUKCBCussDpMOuTR8xVdwSTEPlYN78SBDjYRYYJdvV4CEoIm04A7K8I1/qWsdbiRJjXEYMlQfGnIktvgkBBU41ujjr6vjkC3K+lAUEOQDAQ1xDERYSIikRbo8ND3q4WpIYie6ICPhXfoPGDJqEM/Opnou0tivCrtMc5abmqIwdIh0X5IgCG9zIyEIHZkSFF8xxo1AwkxYDrQUOod9DIdjqmk0yGRgnQgIbhy2NKB75+gyTRQMqhvdQbA4Bs1BOmww5J0oIYYrqEEmkokBGFeN5AOh9ArjFQfiKm0wop0oIYYLh2u9ZUDq9+4qB6sqSQkUqUUFEjkjHSghqCFCoBOVmoIgnQgIQjSgYQg6sAQHAlBKHTgNjIkxOCR5FspM5P1IMHA3L4FPsnSvJd0tJIQBEGTiSBICIIgIQiChCBCLukuxJOQYm517FzcCSnGlBoX1e0fe4x15T+/Yokf8lMv7brDKQDgJ/mjjgq4wEX2x8/yG4cxNURLyG9SSIHfjP88xRUW4klEB0rmq4w0RCdDY9AfXGVfbvJfLnGT//tq7+25wBMk5hZH3mVfxhL8hPsMfQ2xNTc+5xPEJ/kr3mZ/zO2s+YDT02f5kxTyvcWhX/emkW5oMg1da77HdkheHeyidU8rB3GJMQlB7Oboy4FLYj6sxyUhzDriR558dzFkOYgFxiQEoZokA/bzi/nw9CMJUYVSHECMxFysxRoAxIW4E1KshaY/xKmYiychhRRSXAmDbhFjMc/+n4o5IObisvT/7B7l4SluhBRSPInaYdrUiuweWQBq8+ouIcW60JKRSHE1RONg2G7Xy+xLydGJRfblTgIjzHM351oCF/lhTwYXrqxy2+IUT6VjLrP/Fe5ROnOtXxlzs9u1rhXaPaQERoqLWZNCfnX9MwAXLwlRRYjtAFxIIMUi/3uNsTasR9nxN5BYb4Y3onzYpcoVR3iCRLoZVjhFqhFCu4eRSE/Z1S9wB2mOQ9S3AikWO0JgjDUWGEtgXHG1hZmeJMTgCKHMkBf5b08ZIW6Q5sNtrszLd1tySGCUD7FL7Zp3pbtclihTGIIYYQ2JJ3WwqsO6oB0aWpE/h8RaebaxSaeRECTENl4sDTP8zc6IKlxlrFNHu8adNogXJT10WZrhi4TYGEGR4Y4aIexaoTzHhSHyfTd0QnBRnTlXxWm+JF3gJvc0/WZYZs+Mvvqv8rO2Ntv+dSpG2beRwWfVGJMW4+zqWg22/GaIVNu1In8O/cjMqzYa+kAgIbbRhruNXwZ3uatxiV+0nNPN92+G7NIISvJHyXF7oRFP8+XIT41ZtZdZW4r47N2KHzVetTEJQQDAJ7xVZutveItf5KwuBVt1c2IEYOtOzT/54NrOups5fSEWwmUevtSGdaVb2LoVBAlhE4aT7+XbfBT9LN9L++S5jbH1VoqKz6dc42yH+JOwzJHKhrlN5pJtKwgSomOM7GZgucyzaIE51mJhQYpxrZnj0QqChNgPLGZ8+R4zZWhfYt2YXj4O3wqChNjPstwCcil/UvQEcGVZcTEO2QqChOgSmzl/JCwHo3wvhbKAvxKnjdeGRdGoYysIEqKzBXm+LjAtiy9MtdnyLX7OXaSXQQjh0QqChOgCW3/UhdH8mW+Hql6KKb/JX7Mz6wb75/zaozCtIEiIjqEUE5VWBGKO09yBOy6ZMxvDaVR77a/ZMYtArSBIiM7xSVkR3GyNE3EhFrjSkjOujAbRV6trR+owF6f5tUbOrSBqZxZuQ1NI4qs8NtUTvo3/K36elNzTdfE+WU7tZSnF7sm44YzEzSYhD3PIPEXv0q0Vu+s1P12e8ztituuwcl1l815IyrE3pkIZZdiqn4tShcVaSxnX82kvTa3BuFAcpBcIScyxzqsymlsR5V8Xxl9Tw69XEhjjRs/MJSGe02OPK/5xYTx6bnNkaX5+KiRYrw1XSWvusVBaqw/0G+34K23A17TC9BxKbeDuszbSfEENwY/rvnuLvPhmbtAhI5wqRZypXuPQcO3teXdZPdwcEgvTFepb4fhEo+xaNy5tPeYP3yBEEPQyEQQJQRAkBEGQEARBQhAECUEQJARBkBAEQUIQBAlBECQEQZAQBEFCEAQJQRAkBEGQEARBQhAECUEQJARBkBAEQUIQBAlBECQEQRAkBEGU8P8BAJke4PdIbq05AAAAAElFTkSuQmCC',
      Signature4:
        'ab36ae22-61a6-483e-b8b3-2878ad059fb5:string:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAx4AAAFBCAQAAABTdLG+AAAACXBIWXMAAC4jAAAuIwF4pT92AAAFFWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDIgNzkuMTY0NDYwLCAyMDIwLzA1LzEyLTE2OjA0OjE3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgMjEuMiAoTWFjaW50b3NoKSIgeG1wOkNyZWF0ZURhdGU9IjIwMjEtMDEtMTZUMDg6MTE6MjUrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIxLTAxLTE2VDA4OjEyOjQxKzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIxLTAxLTE2VDA4OjEyOjQxKzA4OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMSIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9IkRvdCBHYWluIDIwJSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoxYWY1NTExMi1iMjc3LTQ3ZDUt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',
      Seal: '765e15ce-685e-4447-af7e-412817f34e0f:string:data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeEAAAHlCAYAAADC20QYAAAACXBIWXMAAAsTAAALEwEAmpwYAAAE9WlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDAgNzkuMTYwNDUxLCAyMDE3LzA1LzA2LTAxOjA4OjIxICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0ZURhdGU9IjIwMTktMDktMjNUMDk6MTU6NTgrMDg6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDE5LTA5LTIzVDA5OjI3OjUzKzA4OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE5LTA5LTIzVDA5OjI3OjUzKzA4OjAwIiBkYzpmb3JtYXQ9ImltYWdlL3BuZyIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOmY2N2YzN2YzLTM4YTUtNDE2Yy05MzkxLWZiMThkNmZlYTFiZSIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpm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',
    },
  },
  privacy: {
    obfuscatedData: [],
  },
  signature: {
    type: 'SHA3MerkleProof',
    targetHash: 'b99d389c879eb6b240990f421d5af6469d3f4a47bc91c91b2b5a7d6f0c07d62b',
    proof: [
      '9b8c017bf053e4aa83689a5834867211759771157c839774911430217ef1974f',
      'a193420581609f99e4b0cc88b101a71adc38866deabb4f147065f4a6ce249669',
      '727e2671a3f8c087544450b63487ca83ed7a1ac7d6612d0a76d7e08ce84b7e9f',
      '0ffeac523166c53a53c6cb9f18732e9b08423f959fde8f904eb3bceae702a714',
      '95ca09769464fb5e96902e4a23ee34eda41939e758f1b08c01f54642faf032fe',
      'f872d0b8aefc6720fc3575243b10fe94a4bf764e170f4da6fc356aa18d2f7703',
      'c31332c1e8fc62f6a1726179f747071c4c62da2ef9794d524d7780000ce5c1ec',
      '09304533db2ab6a0223c7bc473284bb2b78c0e89903eb7e4f2b93f03e555ba37',
      'b7d49cc9a620717b8243052b1f44ec4c7d16f12b22313ac2e943c06ff5d56e55',
      'f773e82da96644cfe0500a7283c896a5f63f3dbe8f8299f5ef15ddf8cabe83f1',
      'fd16533c89050c19a6a0a856857f0f6e68d156aa885f3fa3f43d1d78234d58b5',
      '3e68d84085528c7a10402c16bbce31d5ab32d4d0d4be43229e27b547ad6ad7ad',
    ],
    merkleRoot: '63965ab8809437705f62c616c5e5a585ff6ea09c5f95c0b71fee850ee048744c',
  },
} as unknown as v2.WrappedDocument);

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
