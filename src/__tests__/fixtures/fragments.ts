// Verification Responses

export const whenW3CDocumentNotIssued = [
  {
    name: 'TransferableRecords',
    type: 'DOCUMENT_STATUS',
    data: {
      details: [
        {
          address: '0x8Fc57204c35fb9317D91285eF52D6b892EC08cD3',
          issued: false,
          reason: {
            code: 1,
            codeString: 'DOCUMENT_NOT_ISSUED',
            message:
              'Certificate 0xda7a25d51e62bc50e1c7cfa17f7be0e5df3428b96f584e5d021f0cd8da97306d has not been issued under contract 0x8Fc57204c35fb9317D91285eF52D6b892EC08cD3',
          },
        },
      ],
      issuedOnAll: false,
    },
    reason: {
      code: 1,
      codeString: 'DOCUMENT_NOT_ISSUED',
      message:
        'Certificate 0xda7a25d51e62bc50e1c7cfa17f7be0e5df3428b96f584e5d021f0cd8da97306d has not been issued under contract 0x8Fc57204c35fb9317D91285eF52D6b892EC08cD3',
    },
    status: 'INVALID',
  },
  {
    data: true,
    status: 'VALID',
    name: 'W3CSignatureIntegrity',
    type: 'DOCUMENT_INTEGRITY',
  },
  {
    name: 'W3CIssuerIdentity',
    type: 'ISSUER_IDENTITY',
    data: true,
    status: 'VALID',
  },
];

export const whenW3CDocumentHashInvalid = [
  {
    data: false,
    reason: {
      message: 'Invalid signature.',
    },
    status: 'INVALID',
    name: 'W3CSignatureIntegrity',
    type: 'DOCUMENT_INTEGRITY',
  },
  {
    name: 'W3CIssuerIdentity',
    type: 'ISSUER_IDENTITY',
    data: true,
    status: 'VALID',
  },
  {
    name: 'TransferableRecords',
    type: 'DOCUMENT_STATUS',
    tokenRegistry: '0xFeF3cAF0BA0c184b6b102cE6C32f030Ed647689D',
    status: 'VALID',
  },
];

export const whenW3CDocumentValid = [
  { type: 'DOCUMENT_INTEGRITY', name: 'W3CSignatureIntegrity', data: true, status: 'VALID' },
  {
    name: 'TransferableRecords',
    type: 'DOCUMENT_STATUS',
    tokenRegistry: '0xFeF3cAF0BA0c184b6b102cE6C32f030Ed647689D',
    status: 'VALID',
  },
  {
    name: 'W3CIssuerIdentity',
    type: 'ISSUER_IDENTITY',
    data: true,
    status: 'VALID',
  },
];

export const whenW3CDocumentIssuerIdentityInvalid = [
  {
    type: 'DOCUMENT_INTEGRITY',
    name: 'W3CSignatureIntegrity',
    data: true,
    status: 'VALID',
  },
  {
    name: 'TransferableRecords',
    type: 'DOCUMENT_STATUS',
    tokenRegistry: '0xFeF3cAF0BA0c184b6b102cE6C32f030Ed647689D',
    status: 'VALID',
  },
  {
    name: 'W3CIssuerIdentity',
    type: 'ISSUER_IDENTITY',
    data: true,
    status: 'INVALID',
  },
];

export const whenOADocumentHashInvalid = [
  {
    data: false,
    reason: {
      code: 0,
      codeString: 'DOCUMENT_TAMPERED',
      message: 'Certificate has been tampered with',
    },
    status: 'INVALID',
    name: 'OpenAttestationHash',
    type: 'DOCUMENT_INTEGRITY',
  },
  {
    name: 'OpenAttestationEthereumDocumentStoreStatus',
    type: 'DOCUMENT_STATUS',
    data: {
      issuedOnAll: true,
      revokedOnAny: false,
      details: {
        issuance: [
          {
            issued: true,
            address: '0xF02F69B0c9F9Fc74110545E20a4A8CE7e0575fb4',
          },
        ],
        revocation: [
          {
            revoked: false,
            address: '0xF02F69B0c9F9Fc74110545E20a4A8CE7e0575fb4',
          },
        ],
      },
    },
    status: 'VALID',
  },
  {
    reason: {
      code: 4,
      codeString: 'SKIPPED',
      message: 'Document issuers doesn\'t have "tokenRegistry" property or TOKEN_REGISTRY method',
    },
    name: 'OpenAttestationEthereumTokenRegistryMinted',
    status: 'SKIPPED',
    type: 'DOCUMENT_STATUS',
  },
  {
    name: 'OpenAttestationDnsTxtIdentityProof',
    type: 'ISSUER_IDENTITY',
    data: [
      {
        status: 'VALID',
        location: 'example.tradetrust.io',
        value: '0xe59877ac86c0310e9ddaeb627f42fdee5f793fbe',
      },
    ],
    status: 'VALID',
  },
];
