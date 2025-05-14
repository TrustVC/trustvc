# TrustVC

## About

TrustVC is a comprehensive wrapper library designed to simplify the signing and verification processes for TrustVC W3C [Verifiable Credentials (VC)](https://github.com/TrustVC/w3c) and OpenAttestation Verifiable Documents (VD), adhering to the W3C [VC](https://www.w3.org/TR/vc-data-model/) Data Model v1.1 (W3C Standard). It ensures compatibility and interoperability for Verifiable Credentials while supporting OpenAttestation [Verifiable Documents (VD)](https://github.com/Open-Attestation/open-attestation) v6.9.5. TrustVC seamlessly integrates functionalities for handling W3C Verifiable Credentials and OpenAttestation Verifiable Documents, leveraging existing TradeTrust libraries and smart contracts for [Token Registry](https://github.com/TradeTrust/token-registry) (V4 and V5). Additionally, it includes essential utility functions for strings, networks, and chains, making it a versatile tool for developers working with decentralized identity and verifiable data solutions.

## Table of Contents

- [TrustVC](#trustvc)
  - [About](#about)
  - [Installation](#installation)
  - [Functions](#functions)
    - [1. **Wrapping**](#1-wrapping)
      - [a) wrapOADocument](#a-wrapoadocument)
      - [b) wrapOADocuments](#b-wrapoadocuments)
    - [2. **Signing**](#2-signing)
      - [a) OpenAttestation Signing (signOA) v2 v3](#a-openattestation-signing-signoa-v2-v3)
      - [b) TrustVC W3C Signing (signW3C)](#b-trustvc-w3c-signing-signw3c)
    - [3. **Verifying**](#3-verifying)
    - [4. **Encryption**](#4-encryption)
    - [5. **Decryption**](#5-decryption)
    - [6. **TradeTrust Token Registry**](#6-tradetrust-token-registry)
      - [Usage](#usage-2)
      - [TradeTrustToken](#tradetrusttoken)
      - [a) Token Registry v4](#a-token-registry-v4)
      - [b) Token Registry V5](#b-token-registry-v5)
    - [7. **Document Builder**](#7-document-builder)

## Installation

```ts
npm install
npm run build
npm run test
```

## Functions

### 1. **Wrapping**

> This module provides utility functions for wrapping OpenAttestation documents of version 2 (v2) and version 3 (v3). These functions validate the document version and apply the appropriate wrapping logic using the OpenAttestation library. Note that wrapping is not required for W3C-compliant documents, as they follow a different format and standard.

#### a) wrapOADocument

#### Description

> Wraps a single OpenAttestation document asynchronously, supporting both v2 and v3 documents.

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
  /* OpenAttestation document (v2 or v3) */
};
const wrappedDocument = await wrapOADocument(document);
console.log(wrappedDocument);
```

#### b) wrapOADocuments

#### Description

> Wraps multiple OpenAttestation documents asynchronously, supporting both v2 and v3 documents.

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

> The TrustVC Signing feature simplifies the signing process for OA documents and W3C-compliant verifiable credentials using BBS+ signatures. This feature allows you to easily sign W3C Verifiable Credentials (VCs) and ensure they comply with the latest standards.

The signing functionality is split into two methods:

1. signOA: Designed specifically for signing OpenAttestation documents.
2. signW3C: Tailored for signing W3C-compliant verifiable credentials.

#### a) OpenAttestation Signing (signOA) [v2](https://github.com/Open-Attestation/open-attestation/tree/master/src/2.0) [v3](https://github.com/Open-Attestation/open-attestation/tree/master/src/3.0)

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

```ts
import { signW3C, VerificationType } from '@trustvc/trustvc';

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
  issuanceDate: '2024-04-01T12:19:52Z',
};

const signingResult = await signW3C(rawDocument, {
  id: 'did:web:trustvc.github.io:did:1#keys-1',
  controller: 'did:web:trustvc.github.io:did:1',
  type: VerificationType.Bls12381G2Key2020,
  publicKeyBase58:
    'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ',
  privateKeyBase58: '<privateKeyBase58>',
});
```

---

### 3. **Verifying**

> TrustVC simplifies the verification process with a single function that supports both W3C Verifiable Credentials (VCs) and OpenAttestation Verifiable Documents (VDs). Whether you're working with W3C standards or OpenAttestation standards, TrustVC handles the verification seamlessly.

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
};

const resultFragments = await verifyDocument(signedDocument);
```

---

### 4. **Encryption**

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

### 5. **Decryption**

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

### 6. **TradeTrust Token Registry**

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

### 7. **Document Builder**
> The `DocumentBuilder` class helps build and manage W3C Verifiable Credentials (VCs) with credential status features. It supports creating documents with two types of credential statuses: `transferableRecords` and `verifiableDocument`. It can sign the document using a private key, verify its signature, and serialize the document to a JSON format. Additionally, it allows for configuration of document rendering methods and expiration dates.

#### Usage

##### Create a new DocumentBuilder instance
To create a new document, instantiate the `DocumentBuilder` with the base document (Verifiable Credential) that you want to build.

To learn more about defining custom contexts, check out the [Credential Subject - Custom Contexts guide](https://docs.tradetrust.io/docs/how-tos/credential-subject).

```ts
// Adds a custom vocabulary used to define terms in the `credentialSubject`.
// Users can define their own context if they have domain-specific fields or custom data structures.
const builder = new DocumentBuilder({
  '@context': 'https://w3c-ccg.github.io/citizenship-vocab/contexts/citizenship-v1.jsonld'
});
```

##### Set Credential Subject
Set the subject of the Verifiable Credential, which typically contains information about the entity the credential is issued to.

```ts
builder.credentialSubject({
  id: 'did:example:123',
  name: 'John Doe',
});
```

##### Configure Credential Status
You can configure the credential status as either `transferableRecords` or `verifiableDocument`.

**Transferable Records**
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

> ⚠️ **Disclaimer:**  
> This builder **does not mint** documents on-chain. If you're using `transferableRecords`, you'll need to mint the document.  
> [See the minting guide here](https://docs.tradetrust.io/docs/how-tos/credential-status#2-minting-the-credential)


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
You can set an expiration date for the document.

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
To sign the document, provide a `PrivateKeyPair` from `@trustvc/trustvc`.

```ts
const privateKey: PrivateKeyPair = {
  id: 'did:example:456#key1',
  controller: 'did:example:456',
  type: VerificationType.Bls12381G2Key2020,
  publicKeyBase58: 'your-public-key-base58',
  privateKeyBase58: 'your-private-key-base58',
};

const signedDocument = await builder.sign(privateKey);
console.log(signedDocument);
```

Example Output After Signing
```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://w3c-ccg.github.io/citizenship-vocab/contexts/citizenship-v1.jsonld",
    "https://w3id.org/vc/status-list/2021/v1",
    "https://trustvc.io/context/render-method-context.json",
    "https://trustvc.io/context/qrcode-context.json",
    "https://w3id.org/security/bbs/v1"
  ],
  "type": ["VerifiableCredential"],
  "credentialSubject": {
    "id": "did:example:123",
    "name": "John Doe"
  },
  "expirationDate": "2026-01-01T00:00:00Z",
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
    "type": "StatusList2021Entry",
    "statusPurpose": "revocation",
    "statusListIndex": "<placeholder>",
    "statusListCredential": "https://example.com/status-list"
  },
  "issuer": "did:example:456",
  "issuanceDate": "2025-01-01T00:00:00Z",
  "id": "urn:bnid:_:0195fec2-4ae1-7cca-9182-03fd7da5142b",
  "proof": {
    "type": "BbsBlsSignature2020",
    "created": "2025-01-01T00:00:01Z",
    "proofPurpose": "assertionMethod",
    "proofValue": "rV56L+QYozATRy3GOVLomzUo99sXtw2x0Cy9dEkHJ15wi4cS12cQJRIwzONVi3YscdhaSKoqD1jWmwb5A/khLZnDq5eo3QzDgTVClYuV86opL3HJyoS4+t2rRt3wl+chnATy2jqr5zMEvcVJ3gdXpQ==",
    "verificationMethod": "did:example:456#key1"
  }
}
```

##### Verify the Document
To verify the signature of the signed document:

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
