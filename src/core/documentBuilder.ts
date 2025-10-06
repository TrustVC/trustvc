import { CryptoSuite, PrivateKeyPair } from '@trustvc/w3c-issuer';
import { deriveW3C, signW3C, verifyW3CSignature } from '../w3c';
import { assertCredentialStatus, assertTransferableRecords } from '@trustvc/w3c-credential-status';
import {
  CredentialStatus,
  CryptoSuiteName,
  SignedVerifiableCredential,
  VerifiableCredential,
  verifyCredentialStatus,
} from '@trustvc/w3c-vc';
import { ethers } from 'ethers';
import { constants as constantsV4 } from '@tradetrust-tt/token-registry-v4';
import { constants as constantsV5 } from '@tradetrust-tt/token-registry-v5';
import { v4Contracts } from '../token-registry-v4';
import { v5Contracts } from '../token-registry-v5';
import { SUPPORTED_CHAINS } from '../utils';
import {
  BBS_V1_URL,
  DATA_INTEGRITY_V2_URL,
  QRCODE_CONTEXT_URL,
  RENDER_CONTEXT_V2_URL,
  TR_CONTEXT_URL,
  VC_V1_URL,
  VC_V2_URL,
} from '@trustvc/w3c-context';

/**
 * Configuration for a W3C Verifiable Document using a Bitstring Status List.
 * @property {string} url - A Verifiable Credential (VC) representing the Bitstring Status List,
 * typically used for revocation or suspension checks.
 * @property {number} index - The position within the Bitstring Status List that corresponds
 * to the credential's status.
 * @property {string} [purpose] - (Optional) The intended use or role of this status entry.
 */
export interface W3CVerifiableDocumentConfig {
  url: string;
  index: number;
  purpose?: string;
}

/**
 * Configuration for W3C Transferable Records, including blockchain details and token registry information.
 * @property {string} chain - The name of the blockchain network (e.g., "Ethereum", "Polygon").
 * @property {number} chainId - The unique identifier of the blockchain network.
 * @property {string} tokenRegistry - The smart contract address of the token registry.
 * @property {string} rpcProviderUrl - The RPC endpoint URL for interacting with the blockchain.
 */
export interface W3CTransferableRecordsConfig {
  chain: string;
  chainId: number;
  tokenRegistry: string;
  rpcProviderUrl: string;
}

/**
 * Configuration for the rendering method used in a Verifiable Credential document.
 * @property {string} id - A unique identifier for the rendering method, typically a URL or URI.
 * @property {string} type - The type of the renderer, which specifies the method of rendering (e.g., 'EMBEDDED_RENDERER').
 * @property {string} templateName - The name of the template to be used for rendering, e.g., 'BILL_OF_LADING'.
 */
export interface RenderMethod {
  id: string;
  type: string;
  templateName: string;
}

/**
 * Configuration for the qrcode used in a Verifiable Credential document.
 * @property {string} uri - A unique identifier for the qrcode, typically a URL or URI.
 * @property {string} type - The type of the qrcode method (e.g., 'TrustVCQRCode').
 */
export interface qrCode {
  uri: string;
  type: string;
}

/**
 * Options for signing a document.
 * @property {string[]} mandatoryPointers - The mandatory pointers to be used for signing the document.
 */
export interface SignOptions {
  mandatoryPointers?: string[];
}

/**
 * Main class responsible for building, configuring, and signing documents with credential statuses.
 * This class implements the W3C Verifiable Credentials Data Model 2.0 specification.
 */
export class DocumentBuilder {
  private document: Partial<VerifiableCredential>; // Holds the document to be built and signed.
  private documentType: string = 'w3c'; // Default to W3C
  private selectedStatusType: 'transferableRecords' | 'verifiableDocument' | null = null; // Tracks selected status type.
  private statusConfig: Partial<CredentialStatus> = {}; // Configuration for the credential status.
  private rpcProviderUrl: string; // Holds the RPC provider URL for verifying token registry.
  private requiredFields: string[] = ['credentialSubject']; // Required fields that must be present in the document.
  private isSigned: boolean = false; // Tracks if a document is signed
  private isDerived: boolean = false; // Tracks if a document is derived
  /**
   * Constructor to initialize the document builder.
   * @param {Partial<VerifiableCredential>} input - The input document.
   * @param {string} [documentType] - The type of the document (default is "w3c").
   */
  constructor(input: Partial<VerifiableCredential>, documentType: string = 'w3c') {
    this.document = this.initializeDocument(input); // Initialize the document with context and type.
    this.documentType = documentType;
  }

  // Sets the credential subject of the document.
  credentialSubject(subject: Partial<VerifiableCredential>) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    this.document.credentialSubject = subject;
    return this;
  }

  // Configures the credential status of the document based on the provided type (Transferable Records or Verifiable Document).
  credentialStatus(config: W3CTransferableRecordsConfig | W3CVerifiableDocumentConfig) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    const isTransferable = this.isTransferableRecordsConfig(config);
    const isVerifiable = this.isVerifiableDocumentConfig(config);

    if (isTransferable && isVerifiable) {
      throw new Error(
        'Configuration Error: Do not mix transferable records and verifiable document properties.',
      );
    }

    if (isTransferable) {
      this.selectedStatusType = 'transferableRecords';
      this.statusConfig = {
        type: 'TransferableRecords',
        tokenNetwork: { chain: config.chain, chainId: config.chainId },
        tokenRegistry: config.tokenRegistry,
      };
      this.rpcProviderUrl = config.rpcProviderUrl;
      this.addContext(TR_CONTEXT_URL); // Add transferable records context to document.
    } else if (isVerifiable) {
      this.selectedStatusType = 'verifiableDocument';
      this.statusConfig = {
        id: `${config.url}#${config.index}`,
        type: 'BitstringStatusListEntry',
        statusPurpose: config.purpose || 'revocation', // Set status purpose to "revocation" by default.
        statusListIndex: config.index,
        statusListCredential: config.url,
      };
    } else {
      throw new Error('Configuration Error: Missing required fields for credential status.');
    }

    return this;
  }

  // Sets the expiration date of the document.
  expirationDate(date: string | Date) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    this.document.validUntil = typeof date === 'string' ? date : date.toISOString();
    return this;
  }

  // Defines the rendering method for the document.
  renderMethod(method: RenderMethod) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    this.document.renderMethod = [method];
    this.addContext(RENDER_CONTEXT_V2_URL); // Add render method context to document.
    return this;
  }

  // Defines the qrcode for the document.
  qrCode(method: qrCode) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    this.document.qrCode = method;
    this.addContext(QRCODE_CONTEXT_URL); // Add qrcode context to document.
    return this;
  }

  // Sign the document using the provided private key and an optional cryptographic suite.
  async sign(privateKey: PrivateKeyPair, cryptoSuite?: CryptoSuiteName, options?: SignOptions) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');

    if (this.selectedStatusType) {
      this.document.credentialStatus = this.statusConfig;
    }

    this.validateRequiredFields(this.document); // Validate that required fields are present.

    // Verify the document's credential status based on the selected status type.
    if (this.selectedStatusType === 'verifiableDocument') {
      assertCredentialStatus(this.document.credentialStatus);
      const verificationResult = await verifyCredentialStatus(this.document.credentialStatus);
      if (verificationResult.error)
        throw new Error(`Credential Verification Failed: ${verificationResult.error}`);
      if (verificationResult.status)
        throw new Error('Credential Verification Failed: Invalid credential status detected.');
    } else if (this.selectedStatusType === 'transferableRecords') {
      assertTransferableRecords(this.document.credentialStatus, 'sign');
      await this.verifyTokenRegistry(); // Verify that the token registry supports the required interface.
    }

    this.document.issuer = privateKey.id.split('#')[0]; // Set the issuer of the document.
    this.document.validFrom = this.document.validFrom || new Date().toISOString(); // Set the issuance date if not already present.
    if (!cryptoSuite || cryptoSuite === 'ecdsa-sd-2023') {
      this.addContext(DATA_INTEGRITY_V2_URL);
    } else {
      this.addContext(BBS_V1_URL); // Add context for bbs.
    }

    const signedVC = await signW3C(this.document, privateKey, cryptoSuite, options);
    if (signedVC.error) throw new Error(`Signing Error: ${signedVC.error}`);
    this.isSigned = true;
    return signedVC.signed;
  }

  async derive(revealedAttributes: string[]) {
    if (!this.isSigned) throw new Error('Configuration Error: Document is not signed yet.');
    if (this.isDerived) throw new Error('Configuration Error: Document is already derived.');

    const derivedCredential = await deriveW3C(
      this.document as SignedVerifiableCredential,
      revealedAttributes,
    );
    if (derivedCredential.error) throw new Error(`Derivation Error: ${derivedCredential.error}`);
    this.document = derivedCredential.derived;
    this.isDerived = true;
    return derivedCredential.derived;
  }

  // Verify the document.
  async verify() {
    if (!this.isSigned) throw new Error('Verification Error: Document is not signed yet.');

    const cryptosuite = (this.document as SignedVerifiableCredential)?.proof?.cryptosuite;
    if (cryptosuite === CryptoSuite.EcdsaSd2023 && !this.isDerived) {
      throw new Error('Verification Error: Document is not derived yet. Use derive() first.');
    }

    const verificationResult = await verifyW3CSignature(
      this.document as SignedVerifiableCredential,
    );
    if (verificationResult.error)
      throw new Error(`Verification Error: ${verificationResult.error}`);
    return verificationResult.verified;
  }

  // Returns the current state of the document as a JSON string.
  toString(): string {
    return JSON.stringify(this.document, null, 2);
  }

  // Type guard for transferable records configuration
  private isTransferableRecordsConfig(
    config: Partial<CredentialStatus>,
  ): config is W3CTransferableRecordsConfig {
    return (
      config &&
      typeof config.tokenRegistry === 'string' &&
      typeof config.chain === 'string' &&
      typeof config.chainId === 'number' &&
      typeof config.rpcProviderUrl === 'string'
    );
  }

  // Type guard for verifiable document configuration
  private isVerifiableDocumentConfig(
    config: Partial<CredentialStatus>,
  ): config is W3CVerifiableDocumentConfig {
    return config && typeof config.url === 'string' && typeof config.index === 'number';
  }

  // Private helper method to validate that the required fields are present in the input document.
  private validateRequiredFields(input: Partial<VerifiableCredential>) {
    this.requiredFields.forEach((field) => {
      if (!input[field]) {
        throw new Error(`Validation Error: Missing required field "${field}" in the credential.`); // Throw an error if a field is missing.
      }
    });
  }

  // Private helper method to initialize the document with required context and type, adding the necessary context URL.
  private initializeDocument(input: Partial<VerifiableCredential>) {
    if (input.proof) throw new Error('Configuration Error: Document is already signed.');
    return {
      ...input,
      '@context': this.buildContext(input['@context']),
      type: Array.from(new Set([].concat(input.type || [], 'VerifiableCredential'))),
    };
  }

  // Private helper method to build the context for the document, ensuring uniqueness and adding the default W3C context.
  private buildContext(context: string | string[]): string[] {
    const arrayContext = Array.isArray(context) ? context : context ? [context] : [];
    if (arrayContext.includes(VC_V1_URL)) {
      throw new Error('Document builder does not support data model v1.1.');
    }
    return [VC_V2_URL, ...arrayContext].filter((v, i, a) => a.indexOf(v) === i);
  }

  // Private helper method to add a new context to the document if it does not already exist.
  private addContext(context: string) {
    if (!this.document['@context'].includes(context)) {
      this.document['@context'].push(context);
    }
  }

  // Private helper method to verify that the token registry supports the required interface for transferable records.
  private async verifyTokenRegistry() {
    const chainId = this.document.credentialStatus.tokenNetwork
      .chainId as keyof typeof SUPPORTED_CHAINS;
    if (!(chainId in SUPPORTED_CHAINS)) {
      throw new Error(`Unsupported Chain: Chain ID ${chainId} is not supported.`);
    }

    try {
      const provider = new ethers.providers.JsonRpcProvider(this.rpcProviderUrl);
      const isV4Supported = await this.supportsInterface(
        v4Contracts.TradeTrustToken__factory,
        constantsV4.contractInterfaceId.TradeTrustTokenMintable,
        provider,
      );
      const isV5Supported = await this.supportsInterface(
        v5Contracts.TradeTrustToken__factory,
        constantsV5.contractInterfaceId.TradeTrustTokenMintable,
        provider,
      );
      if (!isV4Supported && !isV5Supported)
        throw new Error('Token registry version is not supported.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.message === 'Token registry version is not supported.') {
        throw error;
      } else {
        throw new Error(
          `Network Error: Unable to verify token registry. Please check the RPC URL or token registry address.`,
        );
      }
    }
  }

  // Private helper method to check if a contract supports a specific interface ID.
  private async supportsInterface(
    contractFactory:
      | typeof v4Contracts.TradeTrustToken__factory
      | typeof v5Contracts.TradeTrustToken__factory,
    interfaceId: string,
    provider: ethers.providers.JsonRpcProvider,
  ) {
    const contract = contractFactory.connect(this.statusConfig.tokenRegistry, provider);
    return contract.supportsInterface(interfaceId);
  }
}
