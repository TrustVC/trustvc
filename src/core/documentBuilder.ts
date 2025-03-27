import { PrivateKeyPair } from '@trustvc/w3c-issuer';
import { signW3C } from '../w3c';
import { assertCredentialStatus, assertTransferableRecords } from '@trustvc/w3c-credential-status';
import { CredentialStatus, VerifiableCredential, verifyCredentialStatus } from '@trustvc/w3c-vc';
import { ethers } from 'ethers';
import { constants as constantsV4 } from '@tradetrust-tt/token-registry-v4';
import { constants as constantsV5 } from '@tradetrust-tt/token-registry-v5';
import { v4Contracts } from '../token-registry-v4';
import { v5Contracts } from '../token-registry-v5';
import { SUPPORTED_CHAINS } from '@tradetrust-tt/tradetrust-utils';

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
 * Main class responsible for building, configuring, and signing documents with credential statuses.
 */
export class DocumentBuilder {
  private document: Partial<VerifiableCredential>; // Holds the document to be built and signed.
  private documentType: string = 'w3c'; // Default to W3C
  private selectedStatusType: 'transferableRecords' | 'verifiableDocument' | null = null; // Tracks selected status type.
  private statusConfig: Partial<CredentialStatus> = {}; // Configuration for the credential status.
  private rpcProviderUrl: string; // Holds the RPC provider URL for verifying token registry.
  private requiredFields: string[] = ['credentialSubject']; // Required fields that must be present in the document.

  /**
   * Constructor to initialize the document builder.
   * @param {Partial<VerifiableCredential>} input - The input document.
   * @param {string} [documentType] - The type of the document (default is "w3c").
   */
  constructor(input: Partial<VerifiableCredential>, documentType: string = 'w3c') {
    this.validateRequiredFields(input); // Validate that required fields are present.
    this.document = this.initializeDocument(input); // Initialize the document with context and type.
    this.documentType = documentType;
  }

  // Public method to configure the document for transferable records. Sets up the token network and token registry.
  transferableRecords(config: W3CTransferableRecordsConfig) {
    if (this.selectedStatusType) {
      throw new Error(
        'Configuration Error: You can only call either .transferableRecords() or .verifiableDocument(), not both.',
      ); // Prevent both configurations from being set at the same time.
    }
    this.selectedStatusType = 'transferableRecords';
    this.addContext('https://trustvc.io/context/transferable-records-context.json'); // Add transferable records context to document.
    this.statusConfig = {
      type: 'TransferableRecords',
      tokenNetwork: { chain: config.chain, chainId: config.chainId },
      tokenRegistry: config.tokenRegistry,
    };
    this.rpcProviderUrl = config.rpcProviderUrl;
    return this;
  }

  // Public method to configure the document for verifiable credentials. Sets up the status list and revocation information.
  verifiableDocument(config: W3CVerifiableDocumentConfig) {
    if (this.selectedStatusType) {
      throw new Error(
        'Configuration Error: You can only call either .transferableRecords() or .verifiableDocument(), not both.',
      ); // Prevent both configurations from being set at the same time.
    }
    this.selectedStatusType = 'verifiableDocument';
    this.addContext('https://w3id.org/vc/status-list/2021/v1'); // Add context for verifiable document status list.
    this.statusConfig = {
      id: `${config.url}#${config.index}`,
      type: 'StatusList2021Entry',
      statusPurpose: config.purpose || 'revocation', // Set status purpose to "revocation" by default.
      statusListIndex: config.index,
      statusListCredential: config.url,
    };
    return this;
  }

  // Public method to sign the document using the provided private key and an optional cryptographic suite.
  async sign(privateKey: PrivateKeyPair, cryptoSuite?: string) {
    if (this.selectedStatusType) {
      this.document.credentialStatus = this.statusConfig;
    }

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
    this.document.issuanceDate = this.document.issuanceDate || new Date().toISOString(); // Set the issuance date if not already present.
    this.addContext('https://w3id.org/security/bbs/v1'); // Add context for bbs.

    const signedVC = await signW3C(this.document, privateKey, cryptoSuite);
    if (signedVC.error) throw new Error(`Signing Error: ${signedVC.error}`);
    return signedVC.signed;
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
    return {
      ...input,
      '@context': this.buildContext(input['@context']),
      type: Array.from(new Set([].concat(input.type || [], 'VerifiableCredential'))),
    };
  }

  // Private helper method to build the context for the document, ensuring uniqueness and adding the default W3C context.
  private buildContext(context: string | string[]): string[] {
    return [
      'https://www.w3.org/2018/credentials/v1',
      ...(Array.isArray(context) ? context : context ? [context] : []),
    ].filter((v, i, a) => a.indexOf(v) === i);
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
