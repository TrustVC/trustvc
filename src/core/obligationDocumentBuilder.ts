import { PrivateKeyPair } from '@trustvc/w3c-issuer';
import { deriveW3C, signW3C, verifyW3CSignature } from '../w3c';
import { assertCredentialStatus, assertObligationRecords } from '@trustvc/w3c-credential-status';
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
  DATA_INTEGRITY_V2_URL,
  OBLIGATION_RECORDS_CONTEXT_URL,
  QRCODE_CONTEXT_URL,
  RENDER_CONTEXT_V2_URL,
  VC_V1_URL,
  VC_V2_URL,
} from '@trustvc/w3c-context';
import { qrCode, RenderMethod, SignOptions, W3CVerifiableDocumentConfig } from './documentBuilder';

/**
 * Configuration for W3C Obligation Records (BoE / Obligation Registry).
 * Parallel to classic `W3CTransferableRecordsConfig` (`tokenRegistry`).
 */
export interface W3CObligationRecordsConfig {
  chain: string;
  chainId: number;
  obligationRegistry: string;
  rpcProviderUrl: string;
}

/**
 * Document builder for obligation / BoE credentials.
 * Use classic `DocumentBuilder` for ETR `tokenRegistry` documents.
 */
export class ObligationDocumentBuilder {
  private document: Partial<VerifiableCredential>;
  private documentType: string = 'w3c';
  private selectedStatusType: 'obligationRecords' | 'verifiableDocument' | null = null;
  private statusConfig: Partial<CredentialStatus> = {};
  private rpcProviderUrl: string;
  private requiredFields: string[] = ['credentialSubject'];
  private isSigned: boolean = false;
  private isDerived: boolean = false;

  /**
   * @param {Partial<VerifiableCredential>} input - The input document.
   * @param {string} [documentType] - The type of the document (default is "w3c").
   */
  constructor(input: Partial<VerifiableCredential>, documentType: string = 'w3c') {
    this.document = this.initializeDocument(input);
    this.documentType = documentType;
  }

  credentialSubject(subject: Partial<VerifiableCredential>) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    this.document.credentialSubject = subject;
    return this;
  }

  credentialStatus(config: W3CObligationRecordsConfig | W3CVerifiableDocumentConfig) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    const isObligation = this.isObligationRecordsConfig(config);
    const isVerifiable = this.isVerifiableDocumentConfig(config);

    if (isObligation && isVerifiable) {
      throw new Error(
        'Configuration Error: Do not mix obligation records and verifiable document properties.',
      );
    }

    if (isObligation) {
      this.selectedStatusType = 'obligationRecords';
      this.statusConfig = {
        type: 'TransferableRecords',
        tokenNetwork: { chain: config.chain, chainId: config.chainId },
        obligationRegistry: config.obligationRegistry,
      };
      this.rpcProviderUrl = config.rpcProviderUrl;
      this.addContext(OBLIGATION_RECORDS_CONTEXT_URL);
    } else if (isVerifiable) {
      this.selectedStatusType = 'verifiableDocument';
      this.statusConfig = {
        id: `${config.url}#${config.index}`,
        type: 'BitstringStatusListEntry',
        statusPurpose: config.purpose || 'revocation',
        statusListIndex: config.index,
        statusListCredential: config.url,
      };
    } else {
      throw new Error('Configuration Error: Missing required fields for credential status.');
    }

    return this;
  }

  expirationDate(date: string | Date) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    this.document.validUntil = typeof date === 'string' ? date : date.toISOString();
    return this;
  }

  renderMethod(method: RenderMethod) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    this.document.renderMethod = [method];
    this.addContext(RENDER_CONTEXT_V2_URL);
    return this;
  }

  qrCode(method: qrCode) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');
    this.document.qrCode = method;
    this.addContext(QRCODE_CONTEXT_URL);
    return this;
  }

  async sign(
    privateKey: PrivateKeyPair,
    cryptoSuite?: Exclude<CryptoSuiteName, 'BbsBlsSignature2020'>,
    options?: SignOptions,
  ) {
    if (this.isSigned) throw new Error('Configuration Error: Document is already signed.');

    if ((cryptoSuite as string) === 'BbsBlsSignature2020') {
      throw new Error(
        'BbsBlsSignature2020 is no longer supported. Please use the latest cryptosuite versions instead',
      );
    }

    if (this.selectedStatusType) {
      this.document.credentialStatus = this.statusConfig;
    }

    this.validateRequiredFields(this.document);

    if (this.selectedStatusType === 'verifiableDocument') {
      assertCredentialStatus(this.document.credentialStatus);
      const verificationResult = await verifyCredentialStatus(this.document.credentialStatus);
      if (verificationResult.error)
        throw new Error(`Credential Verification Failed: ${verificationResult.error}`);
      if (verificationResult.status)
        throw new Error('Credential Verification Failed: Invalid credential status detected.');
    } else if (this.selectedStatusType === 'obligationRecords') {
      assertObligationRecords(this.document.credentialStatus, 'sign');
      await this.verifyObligationRegistry();
    }

    this.document.issuer = this.document.issuer || privateKey.id.split('#')[0];
    this.document.validFrom = this.document.validFrom || new Date().toISOString();
    this.addContext(DATA_INTEGRITY_V2_URL);

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

  async verify() {
    if (!this.isSigned) throw new Error('Verification Error: Document is not signed yet.');

    if (!this.isDerived) {
      throw new Error('Verification Error: Document is not derived yet. Use derive() first.');
    }

    const verificationResult = await verifyW3CSignature(
      this.document as SignedVerifiableCredential,
    );
    if (verificationResult.error)
      throw new Error(`Verification Error: ${verificationResult.error}`);
    return verificationResult.verified;
  }

  toString(): string {
    return JSON.stringify(this.document, null, 2);
  }

  private isObligationRecordsConfig(
    config: Partial<CredentialStatus> & {
      rpcProviderUrl?: string;
      chain?: string;
      chainId?: number;
      obligationRegistry?: string;
    },
  ): config is W3CObligationRecordsConfig {
    return (
      Boolean(config) &&
      typeof config.obligationRegistry === 'string' &&
      typeof config.chain === 'string' &&
      typeof config.chainId === 'number' &&
      typeof config.rpcProviderUrl === 'string'
    );
  }

  private isVerifiableDocumentConfig(
    config: Partial<CredentialStatus>,
  ): config is W3CVerifiableDocumentConfig {
    return config && typeof config.url === 'string' && typeof config.index === 'number';
  }

  private validateRequiredFields(input: Partial<VerifiableCredential>) {
    this.requiredFields.forEach((field) => {
      if (!input[field]) {
        throw new Error(`Validation Error: Missing required field "${field}" in the credential.`);
      }
    });
  }

  private initializeDocument(input: Partial<VerifiableCredential>) {
    if (input.proof) throw new Error('Configuration Error: Document is already signed.');
    return {
      ...input,
      '@context': this.buildContext(input['@context']),
      type: Array.from(new Set([].concat(input.type || [], 'VerifiableCredential'))),
    };
  }

  private buildContext(context: string | string[]): string[] {
    const arrayContext = Array.isArray(context) ? context : context ? [context] : [];
    if (arrayContext.includes(VC_V1_URL)) {
      throw new Error('Document builder does not support data model v1.1.');
    }
    return [VC_V2_URL, ...arrayContext].filter((v, i, a) => a.indexOf(v) === i);
  }

  private addContext(context: string) {
    if (!this.document['@context'].includes(context)) {
      this.document['@context'].push(context);
    }
  }

  private async verifyObligationRegistry() {
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
        throw new Error('Obligation registry version is not supported.');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error.message === 'Obligation registry version is not supported.') {
        throw error;
      } else {
        throw new Error(
          `Network Error: Unable to verify obligation registry. Please check the RPC URL or obligation registry address.`,
        );
      }
    }
  }

  private async supportsInterface(
    contractFactory:
      | typeof v4Contracts.TradeTrustToken__factory
      | typeof v5Contracts.TradeTrustToken__factory,
    interfaceId: string,
    provider: ethers.providers.JsonRpcProvider,
  ) {
    const registryAddress = (this.statusConfig as { obligationRegistry?: string })
      .obligationRegistry;
    if (!registryAddress) {
      throw new Error('Configuration Error: Missing obligationRegistry for interface check.');
    }
    const contract = contractFactory.connect(registryAddress, provider as never);
    return contract.supportsInterface(interfaceId);
  }
}
