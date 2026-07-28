# TrustVC

## About

TrustVC is a comprehensive wrapper library designed to simplify the signing and verification processes for TrustVC W3C [Verifiable Credentials (VC)](https://github.com/TrustVC/w3c) and OpenAttestation Verifiable Documents (VD), including OpenCert Verifiable Documents, adhering to the W3C [VC](https://www.w3.org/TR/vc-data-model/) Data Model v2.0 (W3C Standard). It ensures compatibility and interoperability for Verifiable Credentials while supporting OpenAttestation [Verifiable Documents (VD)](https://github.com/Open-Attestation/open-attestation) v6.9.5. TrustVC seamlessly integrates functionalities for handling W3C Verifiable Credentials and OpenAttestation Verifiable Documents, leveraging existing TradeTrust libraries and smart contracts for [Token Registry](https://github.com/TradeTrust/token-registry) (V4 and V5) and for **Obligation Registry** (electronic Bill of Exchange / BoE flows via `TrustVCToken` + `ObligationEscrow`). For W3C credentials it supports both [`did:web`](https://w3c-ccg.github.io/did-method-web/) (**recommended for production**; host a DID document on a domain you control, which acts as the trust anchor) and [`did:key`](https://w3c-ccg.github.io/did-key-spec/) (self-certifying, no hosting required; best for ad-hoc or ephemeral issuers, but requires an out-of-band trust binding) issuers across the `ecdsa-sd-2023` and `bbs-2023` cryptosuites. Additionally, it includes essential utility functions for strings, networks, and chains, making it a versatile tool for developers working with decentralized identity and verifiable data solutions.

## Table of Contents

- [TrustVC](#trustvc)
  - [About](#about)
  - [Installation](#installation)
  - [Functions](#functions)
    - [1. **Wrapping**](#1-wrapping)
      - [a) wrapOADocument](#a-wrapoadocument)
      - [b) wrapOADocuments](#b-wrapoadocuments)
    - [2. **Signing**](#2-signing)
      - [a) OpenAttestation Signing (signOA) v2](#a-openattestation-signing-signoa-v2)
      - [b) TrustVC W3C Signing (signW3C)](#b-trustvc-w3c-signing-signw3c)
    - [3. **Deriving (Selective Disclosure)**](#3-deriving-selective-disclosure)
    - [4. **Verifying**](#4-verifying)
      - [Classic ETR / general VC (`verifyDocument`)](#classic-etr--general-vc-verifydocument)
      - [Obligation / BoE (`verifyObligationDocument`)](#obligation--boe-verifyobligationdocument)
    - [5. **Encryption**](#5-encryption)
    - [6. **Decryption**](#6-decryption)
    - [7. **TradeTrust Token Registry**](#7-tradetrust-token-registry)
      - [Usage](#usage-2)
      - [TradeTrustToken](#tradetrusttoken)
      - [a) Token Registry v4](#a-token-registry-v4)
      - [b) Token Registry V5](#b-token-registry-v5)
      - [c) Obligation Registry (BoE)](#c-obligation-registry-boe)
        - [Lifecycle](#lifecycle)
        - [SDK usage](#sdk-usage)
        - [Status & verification](#status--verification)
        - [Endorsement chain](#endorsement-chain)
        - [Low-level contracts](#low-level-contracts)
    - [8. **Document Builder**](#8-document-builder)
    - [9. **Document Store**](#9-document-store)
    - [10. **Transaction Cancel**](#10-transaction-cancel)
  - [Obligation Registry user guide](#obligation-registry-user-guide)

## Installation

**Prerequisites:**
- Node.js >= 20.0.0

```ts
npm install
npm run build
npm run test
npm run test:e2e
```

- `npm run test` — Vitest unit tests
- `npm run test:e2e` — Hardhat e2e (classic token-registry + obligation/BOE). See [`src/__tests__/e2e/README.md`](src/__tests__/e2e/README.md).

## Functions

### 1. **Wrapping**

> This module provides utility functions for wrapping OpenAttestation documents of version 2 (v2). These functions validate the document version and apply the appropriate wrapping logic using the OpenAttestation library. Note that wrapping is not required for W3C-compliant documents, as they follow a different format and standard.

#### a) wrapOADocument

#### Description

> Wraps a single OpenAttestation v2 document asynchronously.

#### Parameters

> **document: OpenAttestationDocument**
> The OpenAttestation document to be wrapped.

#### Returns

> **Promise<WrappedDocument>**
> A promise that resolves to the wrapped document.

#### Throws

> **Error**
> If the document version is unsupported or if an error occurs during wrapping.

```ts
import { wrapOADocument } from '@trustvc/trustvc';

const document = {
  /* OpenAttestation v2 document */
};
const wrappedDocument = await wrapOADocument(document);
console.log(wrappedDocument);
```

#### b) wrapOADocuments

#### Description

> Wraps multiple OpenAttestation v2 documents asynchronously.

#### Parameters

> **documents: OpenAttestationDocument[]**
> An array of OpenAttestation documents to be wrapped.

#### Returns

> **Promise<WrappedDocument[]>**
> A promise that resolves to the array of wrapped documents.

#### Throws

> **Error**
> If the documents include unsupported versions or if an error occurs during wrapping.

#### Example

```ts
import { wrapOADocuments } from '@trustvc/trustvc';

const documents = [
  {
    /* doc1 */
  },
  {
    /* doc2 */
  },
];
const wrappedDocuments = await wrapOADocuments(documents);
console.log(wrappedDocuments);
```

---

### 2. **Signing**

> The TrustVC Signing feature simplifies the signing process for OA documents and W3C-compliant verifiable credentials using ECDSA signature. This feature allows you to easily sign W3C Verifiable Credentials (VCs) and ensure they comply with the latest standards.

The signing functionality is split into two methods:

1. signOA: Designed specifically for signing OpenAttestation documents.
2. signW3C: Tailored for signing W3C-compliant verifiable credentials.

#### a) OpenAttestation Signing (signOA) [v2](https://github.com/Open-Attestation/open-attestation/tree/master/src/2.0)

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
};

const wrappedDocument = await wrapOA(rawDocument);

const signedWrappedDocument = await signOA(wrappedDocument, {
  public: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
  private: '<privateKey>',
});
```

#### b) TrustVC W3C Signing (signW3C)

The `signW3C` function signs W3C Verifiable Credentials using the provided cryptographic suite and key pair. By default, it uses the **ecdsa-sd-2023** crypto suite unless otherwise specified. It also supports **bbs-2023** for modern BBS signatures.

```ts
import { signW3C, VerificationType } from '@trustvc/trustvc';

const rawDocument = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3id.org/vc/status-list/2021/v1',
    'https://w3c-ccg.github.io/citizenship-vocab/contexts/citizenship-v2.jsonld',
  ],
  credentialStatus: {
    id: 'https://trustvc.github.io/did/credentials/statuslist/1#1',
    type: 'BitstringStatusListEntry',
    statusPurpose: 'revocation',
    statusListIndex: '10',
    statusListCredential: 'https://trustvc.github.io/did/credentials/statuslist/1',
  },
  credentialSubject: {
    type: ['Person']
    givenName: 'TrustVC',
    birthDate: '2024-04-01T12:19:52Z',
  },
  issuer: 'did:web:trustvc.github.io:did:1',
  type: ['VerifiableCredential'],
  validFrom: '2024-04-01T12:19:52Z',
  validUntil: '2029-12-03T12:19:52Z'
};

// Using default ecdsa-sd-2023 crypto suite
const signingResult = await signW3C(rawDocument, {
  '@context': 'https://w3id.org/security/multikey/v1',
  id: 'did:web:trustvc.github.io:did:1#multikey-1',
  type: VerificationType.Multikey,
  controller: 'did:web:trustvc.github.io:did:1',
  publicKeyMultibase: 'zDnaemDNwi4G5eTzGfRooFFu5Kns3be6yfyVNtiaMhWkZbwtc',
  secretKeyMultibase: '<secretKeyMultibase>'
});

// You can also specify mandatory pointers for selective disclosure with ecdsa-sd-2023 / bbs-2023
const signingResultWithPointers = await signW3C(
  rawDocument,
  {
    '@context': 'https://w3id.org/security/multikey/v1',
    id: 'did:web:trustvc.github.io:did:1#multikey-1',
    type: VerificationType.Multikey,
    controller: 'did:web:trustvc.github.io:did:1',
    publicKeyMultibase: 'zDnaemDNwi4G5eTzGfRooFFu5Kns3be6yfyVNtiaMhWkZbwtc',
    secretKeyMultibase: '<secretKeyMultibase>'
  },
  'ecdsa-sd-2023',
  {
    mandatoryPointers: ['/credentialStatus']
  }
);

// Using BBS-2023 cryptosuite
const signingResultWithBbs2023 = await signW3C(
  rawDocument,
  {
    '@context': 'https://w3id.org/security/multikey/v1',
    id: 'did:web:trustvc.github.io:did:1#multikey-2',
    type: VerificationType.Multikey,
    controller: 'did:web:trustvc.github.io:did:1',
    publicKeyMultibase: 'zUC75kRac7BdtjawFUxowfgD6mzqnRHFxAfMDaBynebdYgakviQkPS1KNJEw7uGWqj91H3hSE4pTERb3EZKLgKXjpqHWrN8dyE8SKyPBE3k7kUGjBNAqJoNGgUzqUW3DSaWrcNr',
    secretKeyMultibase: '<secretKeyMultibase>',
  },
  'bbs-2023'
);

// ⚠️ DEPRECATED: BbsBlsSignature2020 is no longer supported
// Use 'ecdsa-sd-2023 or bbs-2023' cryptosuite instead as shown above
const signingResultWithBbs = await signW3C(
  rawDocument,
  {
    id: 'did:web:trustvc.github.io:did:1#keys-1',
    controller: 'did:web:trustvc.github.io:did:1',
    type: VerificationType.Bls12381G2Key2020,
    publicKeyBase58: 'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ',
    privateKeyBase58: '<privateKeyBase58>',
  },
  'BbsBlsSignature2020' // This will return an error
);

```

##### Signing with a `did:key` issuer (self-certifying, no hosting)

The examples above use [`did:web`](https://w3c-ccg.github.io/did-method-web/), which requires hosting a DID document at `https://<domain>/.well-known/did.json`. For use cases where you don't want to host anything — ad-hoc credentials, ephemeral issuers, mobile wallets — use [`did:key`](https://w3c-ccg.github.io/did-key-spec/) instead: the public key is encoded directly into the DID identifier, so the verifier reconstructs the DID document deterministically with no network call.

```ts
import { generateDidKeyPair, CryptoSuite } from '@trustvc/w3c-issuer';
import { signW3C } from '@trustvc/trustvc';

// 1) Mint a fresh did:key DID + private key. Supported cryptosuites:
//    - CryptoSuite.EcdsaSd2023 (P-256)
//    - CryptoSuite.Bbs2023 (BLS12-381 G2)
const { did, didKeyPairs } = await generateDidKeyPair(CryptoSuite.EcdsaSd2023);
// did:           'did:key:zDna...'
// didKeyPairs:   Multikey private key pair scoped to the new DID

// 2) Sign a credential issued by the new did:key. No hosting required.
const rawDocument = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
  ],
  type: ['VerifiableCredential'],
  issuer: did,                       // ← string form, OR { id: did, name: 'My Org' }
  validFrom: '2024-04-01T12:19:52Z',
  credentialSubject: {
    type: ['Person'],
    givenName: 'TrustVC',
  },
};

const signingResult = await signW3C(rawDocument, didKeyPairs, 'ecdsa-sd-2023', {
  mandatoryPointers: ['/credentialSubject/givenName'],
});
// signingResult.signed.proof.verificationMethod === didKeyPairs.id
//   (which is the canonical did:key form `did:key:<multibase>#<multibase>`)
// signingResult.signed.issuer === did
```

> __Trust model caveat:__ `did:key` proves *the holder of this private key signed this credential*, not *who in the real world holds that key*. For regulated contexts (Bills of Lading, KYC, etc.), bind the `did:key` to a real-world entity out-of-band — via a trust registry, a chained credential issued by a known `did:web` authority, or a sidechannel exchange. The cryptographic identity check alone is not a substitute for issuer attestation. See the [`did:key` guide in `@trustvc/w3c-issuer`](https://github.com/TrustVC/w3c/tree/main/packages/w3c-issuer/src/did-key) for the full discussion.

Verification of `did:key`-issued credentials works through the same `verifyDocument` call shown below — no extra configuration. The default document loader resolves `did:key` URIs entirely in memory.

---

### 3. **Deriving (Selective Disclosure)**

> When using ECDSA-SD-2023 or BBS-2023 crypto suites, we can derive a new credential with selective disclosure. This means you can choose which parts of the credential to reveal while keeping others hidden.

```ts
import { deriveW3C } from '@trustvc/trustvc';

// This is a signed document using ecdsa-sd-2023
const signedDocument = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3c-ccg.github.io/citizenship-vocab/contexts/citizenship-v2.jsonld'
  ],
  credentialStatus: {
    id: 'https://trustvc.github.io/did/credentials/statuslist/1#1',
    type: 'BitstringStatusListEntry',
    statusPurpose: 'revocation',
    statusListIndex: '10',
    statusListCredential: 'https://trustvc.github.io/did/credentials/statuslist/1'
  },
  credentialSubject: {
    type: ['Person'],
    givenName: 'TrustVC',
    birthDate: '2024-04-01T12:19:52Z'
  },
  issuer: 'did:web:trustvc.github.io:did:1',
  type: ['VerifiableCredential'],
  validFrom: '2024-04-01T12:19:52Z',
  validUntil: '2029-12-03T12:19:52Z',
  id: 'urn:uuid:0198e4a3-b601-7117-9d02-8c9a9a54ab5d',
  proof: {
    type: 'DataIntegrityProof',
    created: '2025-08-18T14:38:51Z',
    verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-1',
    cryptosuite: 'ecdsa-sd-2023',
    proofPurpose: 'assertionMethod',
    proofValue: 'u2V0AhVhAWvyp4W7vt4DBhJy2JjKdbDjNSjh3mFsIfPv68Xk2uc4PSFf1iiAeq19rvnHou1LW_Ff0MrRxzcmuTsBO54q3vVgjgCQDz9CT1s28B8Wsk-i8hgzexvcOZgInRbK9VpG6pMwSfbNYIA0xoaqSwjMxAISQ2l2uRmBFlIdL3XFduNUlo93wj5EMilhA24fPUQHaYlpN2hezHkI2QbUpUzVdIoRFA9KdzA1JNWM9GuCKWF0A62W91QmN82237JIiF1d2aLq3lnCpgR_Y-VhAdhqKN1MXPH5BNYAmM1rSZLHGF92dYt2k3XLb84UsgBYNx0f5VKOKFKNY-ZNho59RdsSTRNbsUzU-zzH1CLkc-lhAKgI6LHZPLePwB-Vsad2jOO-_PGHoHas5-uNJDDSp-xTO2auFGmpI6OGx-U_xwcKYX3su3qwtYCJ3nf2-l-t5SFhAfNLg1QbwjJBStUFCcVZWzu1wDh1d9owiox2nNm9EDun4DU40ThWLoWJEEGtqJYE0XFeMxCNkGJGvBQkXJxKZYlhAXBhzKu4D8oXuUHymh5rXvp-a4cUHI0Mh0H0eEifx41FqPc_hNNhCEZKAl_lB6mxIAA-5rqDkUH8zj-gH0TDgq1hA8GZCjLF6wE5feS14DscTe_oVIAfe_2YYTdDLwtklycGXiIGjMs3XmX002URnASJU2RcX1hROupc2tpXFGOQZmlhAPwgkCD6aSL2gusl56goodXi7lg5GDJyh3iYSSA2qL0HkBs7q3FsbijIvscH3-bIEWZHUX127ZC3f1UL85WPR01hAQi-48VLrcfPC1aFuwuUQm_UEwkZ4LZsEvvPrPtrC1WjtGq7-NDAfNkz6cO9MgsUwjAncXliJW-tTNX3ujDfEA1hAARmh7uujgnsv7CoQt4suDhtVJKZA5UdKahJkUvqXZKRFfhRmJHPwJKnM04IV_AcQd8RH--v2ZUzD6IUGYXCUIVhABjkqmiaLL9PY20li9JBOd0VR7udnu0eM8JMGnnHm_gEIKM3eHWPqyfJyw9AfFymBwm0fgBqRxf0LIo9uDkLlwYJnL2lzc3VlcmovdmFsaWRGcm9t'
  }
};

// Derive a new credential with only specific fields disclosed
const derivationResult = await deriveW3C(signedDocument, {
  // Only reveal the credential type and givenName, hide birthDate
  selectivePointers: ['/type', '/credentialSubject/givenName']
});

```

---

### 4. **Verifying**

> TrustVC exposes **two** W3C document-status pipelines. Pick the one that matches the credential:
>
> | Pipeline | Entry point | Document status fragment | Use for |
> |----------|-------------|--------------------------|---------|
> | Classic (`src/verify`) | `verifyDocument` | TransferableRecords (`tokenRegistry`) | ETR / Title Escrow, BitstringStatusList, OA VDs |
> | Obligation / BoE (`src/verify-obligation`) | `verifyObligationDocument` | ObligationRecords (`obligationRegistry`) | electronic Bill of Exchange |
>
> Do **not** run BoE documents through `verifyDocument` expecting ObligationRecords — that fragment lives only in the obligation pipeline. Classic ETR docs passed to `verifyObligationDocument` get ObligationRecords **SKIPPED**.
>
> For ECDSA-SD-2023 and BBS-2023 signed documents that normally require derivation before verification, both pipelines derive automatically when needed.

#### Classic ETR / general VC (`verifyDocument`)

```ts
import { verifyDocument } from '@trustvc/trustvc';

const signedDocument = {
  '@context': [
    'https://www.w3.org/ns/credentials/v2',
    'https://w3id.org/security/data-integrity/v2',
    'https://w3c-ccg.github.io/citizenship-vocab/contexts/citizenship-v2.jsonld'
  ],
  credentialStatus: {
    id: 'https://trustvc.github.io/did/credentials/statuslist/1#1',
    type: 'BitstringStatusListEntry',
    statusPurpose: 'revocation',
    statusListIndex: '10',
    statusListCredential: 'https://trustvc.github.io/did/credentials/statuslist/1'
  },
  credentialSubject: {
    type: ['Person'],
    givenName: 'TrustVC',
    birthDate: '2024-04-01T12:19:52Z'
  },
  issuer: 'did:web:trustvc.github.io:did:1',
  type: ['VerifiableCredential'],
  validFrom: '2024-04-01T12:19:52Z',
  validUntil: '2029-12-03T12:19:52Z',
  id: 'urn:uuid:0198e4a3-b601-7117-9d02-8c9a9a54ab5d',
  proof: {
    type: 'DataIntegrityProof',
    created: '2025-08-18T14:38:51Z',
    verificationMethod: 'did:web:trustvc.github.io:did:1#multikey-1',
    cryptosuite: 'ecdsa-sd-2023',
    proofPurpose: 'assertionMethod',
    proofValue: 'u2V0AhVhAWvyp4W7vt4DBhJy2JjKdbDjNSjh3mFsIfPv68Xk2uc4PSFf1iiAeq19rvnHou1LW_Ff0MrRxzcmuTsBO54q3vVgjgCQDz9CT1s28B8Wsk-i8hgzexvcOZgInRbK9VpG6pMwSfbNYIA0xoaqSwjMxAISQ2l2uRmBFlIdL3XFduNUlo93wj5EMilhA24fPUQHaYlpN2hezHkI2QbUpUzVdIoRFA9KdzA1JNWM9GuCKWF0A62W91QmN82237JIiF1d2aLq3lnCpgR_Y-VhAdhqKN1MXPH5BNYAmM1rSZLHGF92dYt2k3XLb84UsgBYNx0f5VKOKFKNY-ZNho59RdsSTRNbsUzU-zzH1CLkc-lhAKgI6LHZPLePwB-Vsad2jOO-_PGHoHas5-uNJDDSp-xTO2auFGmpI6OGx-U_xwcKYX3su3qwtYCJ3nf2-l-t5SFhAfNLg1QbwjJBStUFCcVZWzu1wDh1d9owiox2nNm9EDun4DU40ThWLoWJEEGtqJYE0XFeMxCNkGJGvBQkXJxKZYlhAXBhzKu4D8oXuUHymh5rXvp-a4cUHI0Mh0H0eEifx41FqPc_hNNhCEZKAl_lB6mxIAA-5rqDkUH8zj-gH0TDgq1hA8GZCjLF6wE5feS14DscTe_oVIAfe_2YYTdDLwtklycGXiIGjMs3XmX002URnASJU2RcX1hROupc2tpXFGOQZmlhAPwgkCD6aSL2gusl56goodXi7lg5GDJyh3iYSSA2qL0HkBs7q3FsbijIvscH3-bIEWZHUX127ZC3f1UL85WPR01hAQi-48VLrcfPC1aFuwuUQm_UEwkZ4LZsEvvPrPtrC1WjtGq7-NDAfNkz6cO9MgsUwjAncXliJW-tTNX3ujDfEA1hAARmh7uujgnsv7CoQt4suDhtVJKZA5UdKahJkUvqXZKRFfhRmJHPwJKnM04IV_AcQd8RH--v2ZUzD6IUGYXCUIVhABjkqmiaLL9PY20li9JBOd0VR7udnu0eM8JMGnnHm_gEIKM3eHWPqyfJyw9AfFymBwm0fgBqRxf0LIo9uDkLlwYJnL2lzc3VlcmovdmFsaWRGcm9t'
  }
};

const resultFragments = await verifyDocument(signedDocument);
```

#### Obligation / BoE (`verifyObligationDocument`)

Prefer the high-level wrapper (returns `{ valid, fragments }` plus status helpers):

```ts
import {
  verifyObligationDocument,
  getObligationDocumentStatus,
} from '@trustvc/trustvc/obligation-registry-functions';
// also re-exported from `@trustvc/trustvc`

const { valid, fragments } = await verifyObligationDocument(signedBoeVc, {
  rpcProviderUrl: 'https://rpc.sepolia.org',
  // or provider,
});

const status = getObligationDocumentStatus(fragments);
// { obligationRegistry, status, terminationReason } | null
```

Raw fragment array (same pipeline, no `{ valid }` wrapper):

```ts
import { verifyObligationDocumentFragments } from '@trustvc/trustvc';

const fragments = await verifyObligationDocumentFragments(signedBoeVc, {
  rpcProviderUrl: 'https://rpc.sepolia.org',
});
```

**ObligationRecords** fragment outcomes:

- Valid minted BoE → `VALID`
- Classic ETR (`tokenRegistry` only) → `SKIPPED`
- Invalid obligation (e.g. not minted / wrong registry) → `INVALID`

Low-level fragment builders live under `@trustvc/trustvc/verify-obligation` (and `verifyObligation` namespace). Full SDK flow (deploy → mint → lifecycle) is in [§7c Obligation Registry (BoE)](#c-obligation-registry-boe).

---

### 5. **Encryption**

> The `encrypt` function encrypts plaintext messages using the **ChaCha20** encryption algorithm, ensuring the security and integrity of the input data. It supports custom keys and nonces, returning the encrypted message in hexadecimal format.

#### Function Signature

function encrypt(message: string, key: string, nonce?: string): string;

#### Description

The `encrypt` function is a utility for encrypting text messages using **ChaCha20**, a stream cipher known for its speed and security. This function ensures that the key meets the 32-byte requirement and that a valid 12-byte nonce is either supplied or generated.

The output is a hexadecimal string representing the encrypted data.

#### Parameters

- `message` (string): The plaintext message to encrypt.
- `key` (string): The encryption key, which will be transformed into a 32-byte key.
- `nonce` (string, optional): A 12-byte nonce for encryption. If omitted, a new nonce will be generated automatically.

#### Returns

- `string`: The encrypted message encoded in hexadecimal format.

#### Errors

- Runtime errors: Issues during key transformation, nonce generation, or encryption.

#### Usage

#### Example 1: Basic Encryption

```ts
import { encrypt } from '@trustvc/trustvc';

const message = 'Hello, ChaCha20!';
const key = 'my-secret-key';
const encryptedMessage = encrypt(message, key);

console.log(`Encrypted Message: ${encryptedMessage}`);
```

#### Example 2: Encryption with a Custom Nonce

```ts
import { encrypt } from '@trustvc/trustvc';

const message = 'Secure this message.';
const key = 'another-secret-key';
const nonce = '123456789012'; // Custom 12-byte nonce

const encryptedMessage = encrypt(message, key, nonce);
console.log(`Encrypted Message with Nonce: ${encryptedMessage}`);
```

#### Internal Dependencies

The function uses the following utilities:

1. `stringToUint8Array`: Converts strings to `Uint8Array`.
2. `generate32ByteKey`: Ensures the key is exactly 32 bytes.
3. `generate12ByteNonce`: Produces a valid 12-byte nonce if none is provided.

It also relies on the `ts-chacha20` library for encryption operations.

#### Output Format

- The encrypted message is returned as a **hexadecimal string**.

#### Notes

1. Always ensure the key and nonce are securely stored and not reused.
2. ChaCha20 requires a unique nonce for each encryption to maintain security.
3. Hexadecimal encoding is used by default for simplicity and readability.

---

### 6. **Decryption**

> The `decrypt` function decrypts messages encrypted with the **ChaCha20** algorithm. It converts the input from a hexadecimal format back into plaintext using the provided key and nonce.

#### Function Signature

```ts
function decrypt(encryptedMessage: string, key: string, nonce?: string): string;
```

#### Description

The `decrypt` function is a utility for decrypting hexadecimal-encoded messages that were encrypted using the **ChaCha20** stream cipher. It ensures the key meets the 32-byte requirement and validates or generates a 12-byte nonce if not supplied.

The function returns the original plaintext message in UTF-8 format.

#### Parameters

- `encryptedMessage` (string): The encrypted message, in hexadecimal format.
- `key` (string): The decryption key, which will be transformed into a 32-byte key. Defaults to `DEFAULT_KEY` if an empty key is provided.
- `nonce` (string, optional): A 12-byte nonce used during encryption. If omitted, one will be generated.

#### Returns

- `string`: The decrypted plaintext message in UTF-8 format.

#### Errors

The function throws an error if:

- The key is invalid or transformation fails.
- The decryption process encounters unexpected issues.

#### Usage

#### Example 1: Basic Decryption

```ts
import { decrypt } from '@trustvc/trustvc';

const encryptedMessage = 'e8b7c7e9...';
const key = 'my-secret-key';
const decryptedMessage = decrypt(encryptedMessage, key);

console.log(`Decrypted Message: ${decryptedMessage}`);
```

#### Example 2: Decryption with a Custom Nonce

```ts
import { decrypt } from '@trustvc/trustvc';

const encryptedMessage = 'f3a7e9b2...';
const key = 'another-secret-key';
const nonce = '123456789012'; // Custom 12-byte nonce

const decryptedMessage = decrypt(encryptedMessage, key, nonce);
console.log(`Decrypted Message with Nonce: ${decryptedMessage}`);
```

#### Internal Dependencies

The function uses the following utilities:

1. `stringToUint8Array`: Converts strings to `Uint8Array`.
2. `generate32ByteKey`: Ensures the key is exactly 32 bytes.
3. `generate12ByteNonce`: Produces a valid 12-byte nonce if none is provided.

It also relies on the `ts-chacha20` library for decryption operations.

#### Output Format

- The function accepts the encrypted message in **hexadecimal format** and returns the decrypted message in **UTF-8 format**.

#### Notes

1. Always use the same key and nonce pair that were used during encryption for successful decryption.
2. If a custom nonce is not provided, the function will generate a new one, which may not match the original encryption nonce and will result in decryption failure.
3. The default key, `DEFAULT_KEY`, should only be used for fallback scenarios and not in production environments.
4. Suggestion: If available, consider using the value of the key Id inside the document as the encryption key. This can simplify key management and enhance the security of your encryption process.

---

### 7. **TradeTrust Token Registry**

> The Electronic Bill of Lading (eBL) is a digital document that can be used to prove the ownership of goods. It is a standardized document that is accepted by all major shipping lines and customs authorities. The [Token Registry](https://github.com/TradeTrust/token-registry) repository contains both the smart contract (v4 and v5) code for token registry (in `/contracts`) as well as the node package for using this library (in `/src`).
> The TrustVC library not only simplifies signing and verification but also imports and integrates existing TradeTrust libraries and smart contracts for token registry (V4 and V5), making it a versatile tool for decentralized identity and trust solutions.

#### Usage

> To use the package, you will need to provide your own Web3 [provider](https://docs.ethers.io/v5/api/providers/api-providers/) or [signer](https://docs.ethers.io/v5/api/signer/#Wallet) (if you are writing to the blockchain). This package exposes the [Typechain(Ethers)](https://github.com/dethcrypto/TypeChain/tree/master/packages/target-ethers-v5) bindings for the contracts.

#### TradeTrustToken

> The `TradeTrustToken` is a Soulbound Token (SBT) tied to the Title Escrow. The SBT implementation is loosely based on OpenZeppelin's implementation of the [ERC721](http://erc721.org/) standard.
> An SBT is used in this case because the token, while can be transferred to the registry, is largely restricted to its designated Title Escrow contracts.
> See issue [#108](https://github.com/Open-Attestation/token-registry/issues/108) for more details.

#### a) Token Registry v4

#### Connect to existing token registry

```ts
import { v4Contracts } from '@trustvc/trustvc';

const v4connectedRegistry = v4Contracts.TradeTrustToken__factory.connect(
  tokenRegistryAddress,
  signer,
);
```

#### Issuing a Document

```ts
await v4connectedRegistry.mint(beneficiaryAddress, holderAddress, tokenId);
```

#### Restoring a Document

```ts
await v4connectedRegistry.restore(tokenId);
```

#### Accept/Burn a Document

```ts
await v4connectedRegistry.burn(tokenId);
```

For more information on Token Registry and Title Escrow contracts **version v4**, please visit the readme of [TradeTrust Token Registry V4](https://github.com/TradeTrust/token-registry/blob/v4/README.md).

#### b) Token Registry V5

> Token Registry v5 is the newest version. It allows you to manage token-based credentials and ownership transfers through smart contracts.
> The Tradetrust Token Registry now supports **encrypted remarks** for enhanced security when executing contract functions. This guide explains how to use the updated title-escrow command with encrypted remarks and highlights the changes introduced in this version.
> A new **rejection function** feature has been introduced, allowing a new holder or owner of a document to reject the transfer of the document. This provides an additional layer of control and flexibility for holders and owners to refuse ownership or custodianship if required.

> [!IMPORTANT]
> This new version uses:
>
> - **Ethers v6**
> - **OpenZeppelin v5**
> - Contracts are upgraded to **v 0.8.20**
> - Runs on **Compiler v 0.8.22**

> The `remark` field is optional and can be left empty by providing an empty string `"0x"`.
> Please note that any value in the `remark` field is limited to **120** characters, and encryption is **recommended**.

#### Connect to Token Registry

In Token Registry v5, the way you connect to a registry hasn’t changed much, but it's **important** to ensure you're using the **updated contract and factory from Token Registry v5**.

In TrustVC, you will use the token-registry-v5 module to access the Token Registry v5 contracts.

```ts
import { v5Contracts } from '@trustvc/trustvc';

const connectedRegistry = v5Contracts.TradeTrustToken__factory.connect(
  tokenRegistryAddress,
  signer,
);
```

#### Issuing a Document

In Token Registry v5, there is a slight change when you mint tokens. You will now need to pass `remarks` as an optional argument. If no remarks are provided, ensure you pass `0x` to avoid errors.

```ts
await connectedRegistry.mint(beneficiaryAddress, holderAddress, tokenId, remarks);
```

**If no remarks are passed, the method expects '0x' as the value for remarks**:

```ts
await connectedRegistry.mint(beneficiaryAddress, holderAddress, tokenId, '0x');
```

#### Restoring a Document

The restore method remains mostly the same, but you'll now also have the option to include remarks.

```ts
await connectedRegistry.restore(tokenId, remarks);
```

**If no remarks are passed, use '0x'**:

```ts
await connectedRegistry.restore(tokenId, '0x');
```

#### Accepting/Burning a Document

You can burn or accept a document in Token Registry v5 by passing remarks as an optional argument.

```ts
await connectedRegistry.burn(tokenId, remarks);
```

**If no remarks are passed, use '0x'**:

```ts
await connectedRegistry.burn(tokenId, '0x');
```

#### Connecting to Title Escrow

When connecting to Title Escrow, the process is similar. You will use the updated contract from Token Registry v5 or TrustVC depending on your installation choice.

> [!IMPORTANT]
> A new `remark` field has been **introduced** for all contract operations.
>
> The `remark` field is optional and can be left empty by providing an empty string `"0x"`.
> Please note that any value in the `remark` field is limited to **120** characters, and encryption is **recommended**.

```ts
import { v5Contracts } from '@trustvc/trustvc';

const connectedEscrow = v5Contracts.TitleEscrow__factory.connect(
  existingTitleEscrowAddress,
  signer,
);
```

#### Surrender to Return to Issuer

In Token Registry v4, the method to return the title to the issuer was surrender(). With Token Registry v5, this has been updated to returnToIssuer().

```ts
await connectedEscrow.returnToIssuer(remarks);
```

**If no remarks are provided, you must pass '0x' as the argument**:

```ts
await connectedEscrow.returnToIssuer('0x');
```

#### Rejecting Transfers of Beneficiary/Holder

Token Registry v5 introduces additional methods for rejecting transfers, if necessary, for wrongful transactions:

> [!IMPORTANT]
> Rejection must occur as the very next action after being appointed as **`beneficiary`** and/or **`holder`**. If any transactions occur by the new appointee, it will be considered as an implicit acceptance of appointment.
>
> There are separate methods to reject a **`beneficiary`** (`rejectTransferBeneficiary`) and a **`holder`** (`rejectTransferHolder`). However, if you are both, you must use `rejectTransferOwners`, as the other two methods will not work in this case.

**Reject Transfer of Ownership**:

Prevents a transfer of ownership to an incorrect or unauthorized party.

```ts
function rejectTransferOwner(bytes calldata _remark) external;
```

**Reject Transfer of Holding**:

Prevents a transfer of holding to an incorrect or unauthorized party.

```ts
function rejectTransferHolder(bytes calldata _remark) external;
```

**Reject Both Roles (Ownership & Holding)**:

Prevents both ownership and holding transfers, effectively rejecting the entire transfer process.

```ts
function rejectTransferOwners(bytes calldata _remark) external;
```

For more information on Token Registry and Title Escrow contracts **version v5**, please visit the readme of [TradeTrust Token Registry V5](https://github.com/TradeTrust/token-registry/blob/master/README.md)

#### c) Obligation Registry (BoE)

> **New:** Obligation Registry supports electronic Bill of Exchange (BoE) style documents. It mirrors the classic Transferable Records / Title Escrow pattern, but uses **`TrustVCToken`** + **`ObligationEscrow`** (v5-style only — there is no Obligation v4 path).
>
> Prefer the high-level SDK in `@trustvc/trustvc/obligation-registry-functions` for deploy, mint, lifecycle, transfers, return-to-issuer, status reads, and document verification. Low-level Typechain factories are available from `@trustvc/trustvc/obligation-registry`.

#### Lifecycle

```
Deploy factory + registry
        │
        ▼
      Mint ──► Issued (DocumentStatus.Issued)
        │
        ├──────────────► Reject (holder) ──► Rejected (terminal)
        │
        ▼
     Accept (holder) ──► Accepted
        │
        ├──────────────► Discharge (beneficiary) ──► Discharged (terminal)
        │
        ├──────────────► Nominate / transfers / reject-transfers
        │
        ▼
  Consolidate dual role (beneficiary == holder)
        │
        ▼
  Return to issuer ──► token held by registry
        │
        ├──────────────► rejectReturned (restore to escrow)
        └──────────────► acceptReturned (burn / shred)
```

**Role rules**

- **Accept / document reject** require `beneficiary != holder`.
- **Discharge** requires `msg.sender == beneficiary`.
- **returnToIssuer** requires dual role (`beneficiary == holder`). After accept, typically `transferHolder` (or nominate + `transferBeneficiary`) so one wallet holds both roles before return.
- `terminationReason` is set on reject / discharge / shred (burn), **not** on `returnToIssuer` alone.

**Status enums** (exported from `@trustvc/trustvc/obligation-registry-functions`):

| Enum | Values |
|------|--------|
| `DocumentStatus` | `Issued=0`, `Accepted=1`, `Rejected=2`, `Discharged=3` |
| `ObligationEscrowTerminationReason` | `None=0`, `ReturnToIssuer=1`, `Rejected=2`, `Discharged=3` |
| `ObligationStatusAction` | `{ ACCEPT, REJECT, DISCHARGE }` — escrow write methods that advance status |

Remarks are encrypted when you pass `options.id` (same pattern as Token Registry v5). Omit remarks or pass an empty string when not needed; the SDK encodes them as `0x…`.

#### SDK usage

```ts
import {
  deployObligationEscrowFactory,
  deployObligationRegistry,
  mintObligationRegistry,
  acceptObligationRegistry,
  rejectObligationRegistry,
  dischargeObligationRegistry,
  nominateObligationRegistry,
  transferHolderObligationRegistry,
  transferBeneficiaryObligationRegistry,
  transferOwnersObligationRegistry,
  rejectTransferHolderObligationRegistry,
  rejectTransferBeneficiaryObligationRegistry,
  rejectTransferOwnersObligationRegistry,
  returnToIssuerObligationRegistry,
  acceptReturnedObligationRegistry,
  rejectReturnedObligationRegistry,
  getObligationRegistryStatus,
  getObligationEscrowTerminationReason,
  DocumentStatus,
  ObligationStatusAction,
} from '@trustvc/trustvc/obligation-registry-functions';
```

##### Deploy

```ts
const { obligationEscrowFactoryAddress } = await deployObligationEscrowFactory(signer, {
  chainId,
});
const { obligationRegistry } = await deployObligationRegistry('My BoE Registry', 'BOE', signer, {
  escrowFactoryAddress: obligationEscrowFactoryAddress,
  chainId,
});
```

You can omit `escrowFactoryAddress` to deploy a new factory as part of `deployObligationRegistry`.

##### Mint → accept (or reject)

```ts
const txOptions = { chainId, id: encryptionKeyId }; // id encrypts remarks

await mintObligationRegistry(
  { obligationRegistry },
  issuerSigner,
  {
    beneficiaryAddress,
    holderAddress,
    tokenId,
    remarks: 'issued',
  },
  txOptions,
);

// Holder accepts while roles are still split
await acceptObligationRegistry(
  { obligationRegistry },
  holderSigner,
  { tokenId, remarks: 'accepted' },
  txOptions,
);

// Alternatively, holder rejects the issued document (terminal)
// await rejectObligationRegistry({ obligationRegistry }, holderSigner, { tokenId }, txOptions);
```

`ObligationStatusAction.ACCEPT` / `.REJECT` / `.DISCHARGE` are the string method names used by the lifecycle helpers (`'accept' | 'reject' | 'discharge'`).

##### Transfers & nominations

Escrow helpers accept either `{ titleEscrowAddress }` **or** `{ obligationRegistry, tokenId }` (the SDK resolves the escrow address).

```ts
await nominateObligationRegistry(
  { obligationRegistry, tokenId },
  holderSigner,
  { newBeneficiaryAddress, remarks: 'nominate' },
  txOptions,
);

await transferHolderObligationRegistry(
  { obligationRegistry, tokenId },
  holderSigner,
  { holderAddress: newHolderAddress, remarks: 'transfer holder' },
  txOptions,
);

await transferBeneficiaryObligationRegistry(
  { obligationRegistry, tokenId },
  holderSigner,
  { newBeneficiaryAddress, remarks: 'transfer beneficiary' },
  txOptions,
);

await transferOwnersObligationRegistry(
  { obligationRegistry, tokenId },
  dualRoleSigner,
  { newBeneficiaryAddress, newHolderAddress, remarks: 'transfer both' },
  txOptions,
);
```

##### Reject transfers

Same appointment rules as Title Escrow v5: reject as the next action after being appointed; use `rejectTransferOwners` when both roles were transferred together.

```ts
await rejectTransferHolderObligationRegistry(
  { obligationRegistry, tokenId },
  newHolderSigner,
  { remarks: 'reject holder transfer' },
  txOptions,
);
await rejectTransferBeneficiaryObligationRegistry(
  { obligationRegistry, tokenId },
  newBeneficiarySigner,
  { remarks: 'reject beneficiary transfer' },
  txOptions,
);
await rejectTransferOwnersObligationRegistry(
  { obligationRegistry, tokenId },
  dualAppointeeSigner,
  { remarks: 'reject both' },
  txOptions,
);
```

##### Return to issuer / restore / burn

```ts
// Requires beneficiary == holder
await returnToIssuerObligationRegistry(
  { obligationRegistry, tokenId },
  dualRoleSigner,
  { remarks: 'return' },
  txOptions,
);

// Issuer restores to escrow
await rejectReturnedObligationRegistry(
  { obligationRegistry },
  issuerSigner,
  { tokenId, remarks: 'restore' },
  txOptions,
);

// Or issuer accepts (burns / shreds) the returned token
await acceptReturnedObligationRegistry(
  { obligationRegistry },
  issuerSigner,
  { tokenId, remarks: 'burn' },
  txOptions,
);
```

##### Discharge (terminal, beneficiary)

```ts
await dischargeObligationRegistry(
  { obligationRegistry },
  beneficiarySigner,
  { tokenId, remarks: 'discharged' },
  txOptions,
);
```

#### Status & verification

```ts
const status = await getObligationRegistryStatus(
  { obligationRegistry },
  signer,
  { tokenId },
);
// DocumentStatus.Issued | Accepted | Rejected | Discharged

const reason = await getObligationEscrowTerminationReason(
  { obligationRegistry },
  signer,
  { tokenId },
);

import {
  verifyObligationDocument,
  getObligationDocumentStatus,
} from '@trustvc/trustvc/obligation-registry-functions';

const { valid, fragments } = await verifyObligationDocument(signedVc, {
  rpcProviderUrl: 'https://…',
  // or provider,
});
const enriched = getObligationDocumentStatus(fragments);
// { obligationRegistry, status, terminationReason } | null
```

See [§4 Verifying → Obligation / BoE](#obligation--boe-verifyobligationdocument) for the dedicated `src/verify-obligation` pipeline, fragment outcomes, and `verifyObligationDocumentFragments`.

#### Endorsement chain

```ts
import { fetchObligationEndorsementChain } from '@trustvc/trustvc';

const chain = await fetchObligationEndorsementChain(
  obligationRegistry,
  String(tokenId),
  provider,
  {
    keyId: encryptionKeyId, // optional — decrypts remarks
    // titleEscrowAddress, maxBlockRange, rpcConcurrency — optional RPC tuning
  },
);
```

This is separate from classic `fetchEndorsementChain` and does not use ETR V4/V5 Title Escrow paths. Events include `STATUS_*`, `TRANSFER_*`, `RETURNED_TO_ISSUER`, and related lifecycle entries.

#### Low-level contracts

```ts
import { obligationRegistryContracts } from '@trustvc/trustvc/obligation-registry';

const token = obligationRegistryContracts.TrustVCToken__factory.connect(
  obligationRegistry,
  signer,
);
const escrow = obligationRegistryContracts.ObligationEscrow__factory.connect(
  escrowAddress,
  signer,
);
```

Also exported: `obligationRegistryRoleHash`, `obligationRegistrySupportInterfaceIds`, and receipt helpers.

For local e2e coverage of these flows, see [`src/__tests__/e2e/README.md`](src/__tests__/e2e/README.md).

### 8. **Document Builder**
> The `DocumentBuilder` class helps build and manage W3C Verifiable Credentials (VCs) with credential status features, implementing the **W3C VC Data Model 2.0** specification. It supports creating documents with two types of credential statuses: `transferableRecords` and `verifiableDocument`. It can sign the document using modern cryptographic signature schemes including **ECDSA-SD-2023** (default) and **BBS-2023**, verify its signature, and serialize the document to a JSON format. Additionally, it allows for configuration of document rendering methods and expiration dates.
>
> For electronic Bill of Exchange / Obligation Registry documents, use **`ObligationDocumentBuilder`** instead (parallel to classic `DocumentBuilder`, same signing / derive / verify API, but `obligationRegistry` + obligation-records context). Verify those documents with `verifyObligationDocument` — see [§4](#obligation--boe-verifyobligationdocument) and [§7c](#c-obligation-registry-boe).

#### Usage

##### Create a new DocumentBuilder instance
To create a new document, instantiate the `DocumentBuilder` with the base document (Verifiable Credential) that you want to build.

To learn more about defining custom contexts, check out the [Credential Subject - Custom Contexts guide](https://docs.tradetrust.io/docs/how-tos/credential-subject).

```ts
// Adds a custom vocabulary used to define terms in the `credentialSubject`.
// Users can define their own context if they have domain-specific fields or custom data structures.
const builder = new DocumentBuilder({
  '@context': 'https://w3c-ccg.github.io/citizenship-vocab/contexts/citizenship-v2.jsonld'
});
```

##### Set Credential Subject
Set the subject of the Verifiable Credential, which typically contains information about the entity the credential is issued to.

```ts
builder.credentialSubject({
  type: ['Person'],
  givenName: 'TrustVC',
});
```

##### Configure Credential Status
You can configure the credential status as either `transferableRecords` or `verifiableDocument`.

**Transferable Records (classic Token Registry)**
```ts
builder.credentialStatus({
  // Refers to the supported network.
  // See: https://docs.tradetrust.io/docs/introduction/key-components-of-tradetrust/blockchain/supported-network
  chain: 'Ethereum',
  chainId: 1,
  tokenRegistry: '0x1234567890abcdef...',
  rpcProviderUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID',
});
```

Verify with `verifyDocument` (TransferableRecords fragment).

**Obligation Records (BoE / Obligation Registry)**

Use `ObligationDocumentBuilder` (not classic `DocumentBuilder`):

```ts
import { ObligationDocumentBuilder } from '@trustvc/trustvc';

const boeBuilder = new ObligationDocumentBuilder({
  '@context': 'https://trustvc.io/context/bill-of-exchange.json',
}).credentialSubject({
  electronicDocumentIdentifier: 'urn:uuid:e6f4b2a1-9c3d-4e8f-a7b0-1d2e3f4a5b6c',
  referenceNumber: 'BOE-2026-00147',
});

boeBuilder.credentialStatus({
  chain: 'amoy',
  chainId: 80002,
  obligationRegistry: '0x1234567890abcdef...',
  rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
});
```

This attaches the obligation-records JSON-LD context and a `TransferableRecords`-typed `credentialStatus` carrying `obligationRegistry`. On-chain minting is separate — use `mintObligationRegistry` from `@trustvc/trustvc/obligation-registry-functions` (see [§7c](#c-obligation-registry-boe)).

Verify BoE documents with `verifyObligationDocument` — see [§4](#obligation--boe-verifyobligationdocument).

> ⚠️ **Disclaimer:**  
> These builders **do not mint** documents on-chain. Mint separately.  
> Classic ETR minting: [TradeTrust minting guide](https://docs.tradetrust.io/docs/how-tos/credential-status#2-minting-the-credential).  
> Obligation minting: `mintObligationRegistry` in [§7c](#c-obligation-registry-boe).


**Verifiable Document**
```ts
builder.credentialStatus({
  url: 'https://example.com/status-list',
  // `index: <placeholder>` refers to the bit position in the status list that will be set for revocation.
  // Note: A document with the specific index must be marked as not revoked in the status list.
  index: <placeholder>,
  purpose: 'revocation',
});
```

##### Set Expiration Date
You can set a valid until date (expiration) for the document.

```ts
builder.expirationDate('2026-01-01T00:00:00Z');
```

##### Define Rendering Method
Set the rendering method to be used for the document.

```ts
builder.renderMethod({
  id: 'https://example.com/rendering-method',
  type: 'EMBEDDED_RENDERER',
  templateName: 'BILL_OF_LADING',
});
```

##### Define QR Code Method
Set the qrcode method to be used for the document.

```ts
builder.qrCode({
  uri: 'https://example.com/qrcode',
  type: 'TrustVCQRCode',
});
```

##### Sign the Document
To sign the document, provide a `PrivateKeyPair` from `@trustvc/trustvc`. The builder supports both **ECDSA-SD-2023** (default) and **BBS-2023** cryptographic signature schemes.

**ECDSA-SD-2023 Signing (Default)**

```ts
const ecdsaKeyPair: PrivateKeyPair = {
    '@context': 'https://w3id.org/security/multikey/v1',
    id: 'did:web:example.com#multikey-1',
    type: VerificationType.Multikey,
    controller: 'did:web:example.com',
    publicKeyMultibase: 'your-ecdsa-public-key-multibase',
    secretKeyMultibase: 'your-ecdsa-secret-key-multibase',
}

// Sign with default ECDSA-SD-2023 cryptosuite
const signedDocument = await builder.sign(ecdsaKeyPair);
console.log(signedDocument);
```

**BBS-2023 Signing**

```ts
import { CryptoSuite } from '@trustvc/trustvc';

const bbs2023KeyPair: PrivateKeyPair = {
    '@context': 'https://w3id.org/security/multikey/v1',
    id: 'did:web:example.com#multikey-2',
    type: VerificationType.Multikey,
    controller: 'did:web:example.com',
    publicKeyMultibase: 'your-bbs-public-key-multibase',
    secretKeyMultibase: 'your-bbs-secret-key-multibase',
}

// Sign with BBS-2023 cryptosuite by passing CryptoSuite.Bbs2023
const signedDocument = await builder.sign(bbs2023KeyPair, CryptoSuite.Bbs2023);
console.log(signedDocument);
```

**Example Output After Signing (ECDSA-SD-2023)**
```json
{
  "@context": [
    "https://www.w3.org/ns/credentials/v2",
    "https://w3c-ccg.github.io/citizenship-vocab/contexts/citizenship-v2.jsonld",
    "https://trustvc.io/context/render-method-context-v2.json",
    "https://trustvc.io/context/qrcode-context.json",
    "https://w3id.org/security/data-integrity/v2"
  ],
  "type": ["VerifiableCredential"],
  "credentialSubject": {
    "type": ["Person"],
    "givenName": "TrustVC",
  },
  "validUntil": "2026-01-01T00:00:00Z",
  "renderMethod": [
    {
      "id": "https://example.com/rendering-method",
      "type": "EMBEDDED_RENDERER",
      "templateName": "BILL_OF_LADING"
    }
  ],
  "qrCode": {
      "uri": "https://example.com/qrcode",
      "type": "TrustVCQRCode"
  },
  "credentialStatus": {
    "id": "https://example.com/status-list#<placeholder>",
    "type": "BitstringStatusListEntry",
    "statusPurpose": "revocation",
    "statusListIndex": "<placeholder>",
    "statusListCredential": "https://example.com/status-list"
  },
  "issuer": "did:web:example.com",
  "validFrom": "2025-01-01T00:00:00Z",
  "id": "urn:bnid:_:0195fec2-4ae1-7cca-9182-03fd7da5142b",
  "proof": {
    "type": "DataIntegrityProof",
    "created": "2025-01-01T00:00:01Z",
    "verificationMethod": "did:web:example.com#multikey-1",
    "cryptosuite": "ecdsa-sd-2023",
    "proofPurpose": "assertionMethod",
    "proofValue": "u2V0AhVhAh1oLoiuV2AwmSa2ZspbmrG2gCDbpZW.......",
  }
}
```

##### Deriving the Document
Provide the attributes to reveal to the `derive` method.

```ts
const derivedDocument = await builder.derive(['/credentialSubject/givenName']);
console.log(derivedDocument);
```

##### Verify the Document
To verify the signature of the signed document, ensure the document is derived first and then call the `verify` method.

```ts
const isVerified = await builder.verify();
console.log(isVerified); // true or false
```

##### Convert Document to JSON String
To get the current state of the document as a JSON string:

```ts
const documentJson = builder.toString();
console.log(documentJson);
```

## 9. Document Store

> TrustVC provides comprehensive Document Store functionality for managing blockchain-based document storage and verification. The Document Store module supports both standard DocumentStore and TransferableDocumentStore contracts, enabling secure document issuance, revocation, and role management on various blockchain networks.

### Key Features

- **Dual Contract Support**: Works with both DocumentStore and TransferableDocumentStore contracts
- **Automatic Contract Detection**: Uses ERC-165 interface checking to automatically identify contract types
- **Ethers Compatibility**: Full support for both ethers v5 and v6
- **Type Safety**: Full TypeScript support with comprehensive type definitions

### Functions

#### deployDocumentStore

Deploys a new DocumentStore contract to the blockchain.

**Parameters:**
- `storeName` (string): The name of the document store
- `owner` (string): The owner address of the document store
- `signer` (Signer): Ethers v5 or v6 signer instance
- `options` (DeployOptions, optional): Deployment configuration

**DeployOptions:**
- `chainId` (CHAIN_ID, optional): Target blockchain network
- `maxFeePerGas` (GasValue, optional): Maximum fee per gas
- `maxPriorityFeePerGas` (GasValue, optional): Maximum priority fee per gas
- `isTransferable` (boolean, optional): Whether to deploy TransferableDocumentStore

**Returns:** `Promise<TransactionReceipt>` - The deployment transaction receipt

**Example:**

```ts
import { deployDocumentStore } from '@trustvc/trustvc';

const receipt = await deployDocumentStore(
  'My Document Store',
  '0x1234567890123456789012345678901234567890',
  signer,
  {
    chainId: CHAIN_ID.sepolia,
    isTransferable: true,
  }
);

console.log('Contract deployed at:', receipt.contractAddress);
```

#### documentStoreIssue

Issues a document to the Document Store.

**Parameters:**
- `documentStoreAddress` (string): Address of the Document Store contract
- `documentHash` (string): Hash of the document to issue
- `signer` (Signer): Ethers v5 or v6 signer instance
- `options` (IssueOptions, optional): Issuance configuration

**IssueOptions:**
- `chainId` (CHAIN_ID, optional): Target blockchain network
- `maxFeePerGas` (GasValue, optional): Maximum fee per gas
- `maxPriorityFeePerGas` (GasValue, optional): Maximum priority fee per gas
- `isTransferable` (boolean, optional): Whether the contract is TransferableDocumentStore

**Returns:** `Promise<string>` - Transaction hash of the issuance

**Example:**

```ts
import { documentStoreIssue } from '@trustvc/trustvc';

const txHash = await documentStoreIssue(
  '0x1234567890123456789012345678901234567890',
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  signer,
  {
    chainId: CHAIN_ID.sepolia,
    isTransferable: false,
  }
);

console.log('Document issued, transaction:', txHash);
```

#### documentStoreRevoke

Revokes a document from the Document Store.

**Parameters:**
- `documentStoreAddress` (string): Address of the Document Store contract
- `documentHash` (string): Hash of the document to revoke
- `signer` (Signer): Ethers v5 or v6 signer instance
- `options` (RevokeOptions, optional): Revocation configuration

**RevokeOptions:**
- `chainId` (CHAIN_ID, optional): Target blockchain network
- `maxFeePerGas` (GasValue, optional): Maximum fee per gas
- `maxPriorityFeePerGas` (GasValue, optional): Maximum priority fee per gas
- `isTransferable` (boolean, optional): Whether the contract is TransferableDocumentStore

**Returns:** `Promise<string>` - Transaction hash of the revocation

**Example:**

```ts
import { documentStoreRevoke } from '@trustvc/trustvc';

const txHash = await documentStoreRevoke(
  '0x1234567890123456789012345678901234567890',
  '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  signer,
  {
    chainId: CHAIN_ID.sepolia,
    isTransferable: false,
  }
);

console.log('Document revoked, transaction:', txHash);
```

### Contract Types

#### DocumentStore
- Basic document store functionality
- Supports document issuance and revocation
- ERC-165 interface: `0x01ffc9a7` (IDocumentStore)

#### TransferableDocumentStore
- Extended document store with transfer capabilities
- All DocumentStore functionality plus transfer features
- ERC-165 interface: `0x8c5a6b8a` (ITransferableDocumentStore)

### Error Handling

All functions include comprehensive error handling:

- **Validation Errors**: Invalid addresses, missing parameters, provider issues
- **Contract Errors**: Pre-check failures, insufficient permissions, contract reverts
- **Network Errors**: Connection issues, transaction failures
- **Interface Detection**: Automatic fallback when ERC-165 interfaces are not supported

### Gas Optimization

The Document Store functions support gas optimization through configurable transaction options:

```ts
const options = {
  maxFeePerGas: '50000000000', // 50 gwei
  maxPriorityFeePerGas: '2000000000', // 2 gwei
  chainId: CHAIN_ID.mainnet,
};
```

### Usage Patterns

#### Basic Usage

```ts
import { deployDocumentStore, documentStoreIssue, documentStoreRevoke } from '@trustvc/trustvc';

// Deploy a new document store
const receipt = await deployDocumentStore('My Store', ownerAddress, signer);

// Issue a document
await documentStoreIssue(receipt.contractAddress, documentHash, signer);

// Revoke if needed
await documentStoreRevoke(receipt.contractAddress, documentHash, signer);
```

#### Advanced Usage with Options

```ts
import { CHAIN_ID } from '@trustvc/trustvc';

// Deploy with specific network and gas settings
const receipt = await deployDocumentStore(
  'Production Store',
  ownerAddress,
  signer,
  {
    chainId: CHAIN_ID.mainnet,
    maxFeePerGas: '100000000000', // 100 gwei
    maxPriorityFeePerGas: '5000000000', // 5 gwei
    isTransferable: true,
  }
);

// Issue with explicit contract type detection
await documentStoreIssue(
  receipt.contractAddress,
  documentHash,
  signer,
  {
    chainId: CHAIN_ID.mainnet,
    isTransferable: true, // Explicit type detection
  }
);
```

#### Batch Operations

```ts
// Issue multiple documents
const documentHashes = [
  '0xhash1...',
  '0xhash2...',
  '0xhash3...',
];

for (const hash of documentHashes) {
  await documentStoreIssue(storeAddress, hash, signer);
}
```

---

## 10. Transaction Cancel

TrustVC provides a utility to cancel a pending Ethereum transaction by replacing it with a 0-value transaction to the same address, using the same nonce and a higher gas price (replace-by-fee). This works with both ethers v5 and v6 signers.

**Reference:** [How to cancel Ethereum pending transactions](https://info.etherscan.com/how-to-cancel-ethereum-pending-transactions/)

### cancelTransaction

#### Description

Cancels a pending transaction by sending a 0-value transaction to the signer’s address with the same nonce and a higher gas price. You can specify the pending transaction either by **transaction hash** (nonce and gas price are fetched; gas price is doubled) or by **nonce and gas price** explicitly. Transactions that use EIP-1559 (no legacy `gasPrice`) must be cancelled using nonce and gas price.

#### Parameters

- **signer** – Signer with a connected provider; type `CancelTransactionSigner` (compatible with ethers v5 and v6 signers).
- **options** – `CancelTransactionOptions`:
  - **transactionHash** (optional): Pending transaction hash (`0x...`). If provided, nonce and gas price are read from the chain and gas price is increased by 100%.
  - **nonce** (optional): Pending transaction nonce. Must be used together with `gasPrice`.
  - **gasPrice** (optional): Gas price in wei for the replacement transaction. Must be used together with `nonce`.

Either `(nonce, gasPrice)` or `transactionHash` must be provided.

#### Returns

**Promise&lt;string&gt;** – The replacement transaction hash.

#### Throws

- If the signer has no provider.
- If neither `(nonce, gasPrice)` nor `transactionHash` is provided.
- If `transactionHash` is given but the transaction is not found.
- If the transaction uses EIP-1559 (no `gasPrice`); in that case use nonce and gas price explicitly.

#### Example

```ts
import { cancelTransaction } from '@trustvc/trustvc';

// Cancel by transaction hash (gas price is fetched and doubled)
const replacementHash = await cancelTransaction(signer, {
  transactionHash: '0x...',
});
console.log('Replacement tx:', replacementHash);

// Or cancel by nonce and gas price (e.g. for EIP-1559 txs)
const replacementHash2 = await cancelTransaction(signer, {
  nonce: '5',
  gasPrice: '25000000000', // 25 gwei in wei
});
```

## Obligation Registry user guide

Quick integrator reference for electronic Bill of Exchange (BoE) / Obligation Registry. API detail is in [§7c](#c-obligation-registry-boe), [§4 verify](#obligation--boe-verifyobligationdocument), and [§8 Document Builder](#8-document-builder).

### Classic vs Obligation

| Use case | Stack | Credential status | Verify API |
|----------|--------|-------------------|------------|
| eBL / classic transferable record | Token Registry + Title Escrow | `tokenRegistry` | `verifyDocument` |
| electronic Bill of Exchange | Obligation Registry + ObligationEscrow | `obligationRegistry` | `verifyObligationDocument` |

Do **not** mix stacks — wrong verify/builder/mint helpers will fail or skip checks.

### End-to-end flow

```
1. Deploy ObligationEscrowFactory + TrustVCToken (obligation registry)
2. Build BoE VC with ObligationDocumentBuilder (credentialStatus.obligationRegistry)
3. Sign the VC
4. Mint tokenId on the registry (beneficiary + holder)
5. Holder accept / reject → optional transfers / discharge / return
6. Verify with verifyObligationDocument
```

Builders **do not mint**. Signing produces the credential; `mintObligationRegistry` puts the token on-chain.

### BoE credential subject

Use context `https://trustvc.io/context/bill-of-exchange.json` with finalized BoE form fields (`electronicDocumentIdentifier`, `referenceNumber`, `amountInFigures` / `amountInWords`, `tenor`, `payee`, `drawer` / `drawee`, etc.).

Sample: [`w3c` package `obligation-credential-subject.sample.json`](https://github.com/TrustVC/w3c/blob/main/packages/w3c-context/samples/obligation-credential-subject.sample.json).

```ts
import { ObligationDocumentBuilder } from '@trustvc/trustvc';

const boeBuilder = new ObligationDocumentBuilder({
  '@context': 'https://trustvc.io/context/bill-of-exchange.json',
}).credentialSubject({
  electronicDocumentIdentifier: 'urn:uuid:e6f4b2a1-9c3d-4e8f-a7b0-1d2e3f4a5b6c',
  referenceNumber: 'BOE-2026-00147',
  // ... other finalized BoE form fields
});

boeBuilder.credentialStatus({
  chain: 'amoy',
  chainId: 80002,
  obligationRegistry: '0x…',
  rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
});
```

### Imports cheat sheet

| Concern | Import path |
|---------|-------------|
| Deploy / mint / lifecycle / transfers / verify wrapper | `@trustvc/trustvc/obligation-registry-functions` |
| Document builder | `@trustvc/trustvc` → `ObligationDocumentBuilder` |
| Fragment-level verify | `@trustvc/trustvc` → `verifyObligationDocumentFragments` |
| Endorsement chain | `@trustvc/trustvc` → `fetchObligationEndorsementChain` |
| Typechain factories | `@trustvc/trustvc/obligation-registry` |

### CLI

[`trustvc-cli`](https://github.com/TrustVC/trustvc-cli) exposes `obligation-registry`, `obligation-escrow`, and `verify-obligation` command trees. See the CLI README [Obligation Registry user guide](https://github.com/TrustVC/trustvc-cli#obligation-registry-user-guide).

### E2E tests

```bash
npm run test:e2e
```

Coverage: [`src/__tests__/e2e/README.md`](src/__tests__/e2e/README.md).

### Things to know (not bugs)

1. **Wrong verify API** — BoE → `verifyObligationDocument`. Classic ETR → `verifyDocument`.
2. **Wrong builder** — BoE → `ObligationDocumentBuilder` + `obligationRegistry`.
3. **Accept / reject need split roles** — `beneficiary != holder`.
4. **Return needs dual role** — `beneficiary == holder`.
5. **`terminationReason` is not set by return alone** — set on reject / discharge / burn.
6. **Builders do not mint** — mint separately with `mintObligationRegistry`.
