# TrustVC

## About
TrustVC is a wrapper library that facilitates the signing and verification of TrustVC W3C [Verifiable Credentials (VC)](https://github.com/TrustVC/w3c/tree/alpha) 1.0.0-alpha, adhering to the W3C [VC](https://www.w3.org/TR/vc-data-model/) Data Model v1.1 and OpenAttestation [Verifiable Documents (VD)](https://github.com/Open-Attestation/open-attestation/tree/beta) v6.10.0-beta.


## Functions
### 1. **Signing**

> Independent signing function for TrustVC W3C VC and OpenAttestation VD

  1. OpenAttestation Signing (signOA), supporting only OA Schema [v4](https://github.com/Open-Attestation/open-attestation/tree/beta/src/4.0)
    
  > [!NOTE]
  > Do not confuse OA Schema V4 with OA package version.

```ts
import { wrapOA, signOA } from '@trustvc/trustvc';

const rawDocument = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://schemata.openattestation.com/com/openattestation/4.0/context.json',
  ],
  type: ['VerifiableCredential', 'OpenAttestationCredential'],
  credentialSubject: {
    id: '0x1234567890123456789012345678901234567890',
    name: 'John Doe',
    country: 'SG',
  },
  issuer: {
    id: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90',
    type: 'OpenAttestationIssuer',
    name: 'Government Technology Agency of Singapore (GovTech)',
    identityProof: { identityProofType: 'DNS-DID', identifier: 'example.openattestation.com' },
  },
}

const wrappedDocument = await wrapOA(rawDocument);

const signedWrappedDocument = await signOA(wrappedDocument, {
  public: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
  private: '<privateKey>',
});
```

  2. TrustVC W3C Signing (signW3C)

```ts
import { signW3C } from '@trustvc/trustvc';
import { VerificationType } from '@trustvc/w3c-issuer';

const rawDocument = {
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
  issuanceDate: '2024-04-01T12:19:52Z'
}

const signingResult = await signW3C(rawDocument, {
  id: 'did:web:trustvc.github.io:did:1#keys-1',
  controller: 'did:web:trustvc.github.io:did:1',
  type: VerificationType.Bls12381G2Key2020,
  publicKeyBase58:
    'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ',
  privateKeyBase58: '<privateKeyBase58>',
});
```

### 2. **Verifying**

> Single verifying function to simplify the process

  1. Verify

```ts
import { verifyDocument } from '@trustvc/trustvc';

const signedDocument = {
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
    created: '2024-10-14T04:11:49Z',
    proofPurpose: 'assertionMethod',
    proofValue:
      'l79dlFQMowalep+WCFqgCvpVBcCAr0GDEFUV6S7gRVY/TQ+sp/wcwaT61PaD19rJYUHlKfzccE4m7waZyoLEkBLFiK2g54Q2i+CdtYBgDdkUDsoULSBMcH1MwGHwdjfXpldFNFrHFx/IAvLVniyeMQ==',
    verificationMethod: 'did:web:trustvc.github.io:did:1#keys-1',
  },
}

const resultFragments = await verifyDocument(signedDocument);
```

## Running the code
```
npm install
npm run build
npm run test
```
