import {
  DocumentsToVerify,
  SkippedVerificationFragment,
  VerifierOptions,
} from '@govtechsg/oa-verify';
import { v4 } from '@govtechsg/open-attestation';
import {
  TitleEscrow__factory,
  TradeTrustToken__factory,
} from '@tradetrust-tt/token-registry/contracts';
import {
  TransferableRecordCredentialStatus,
  TransferableRecordsInvalidFragment,
  TransferableRecordsValidFragment,
  TransferableRecordsVerificationFragment,
  VerifierType,
} from './transferableRecordVerifier.types';

const verify: VerifierType['verify'] = async (
  document: DocumentsToVerify,
  options: VerifierOptions,
) => {
  if (!v4.isWrappedDocument(document)) {
    throw new Error('Document is not a v4 wrapped document');
  }
  const signedDocument: v4.SignedWrappedDocument = document as v4.SignedWrappedDocument;

  const credentialStatus = signedDocument.credentialStatus as TransferableRecordCredentialStatus;

  if (credentialStatus?.type !== 'TransferableRecords') {
    throw new Error("Document's credentialStatus is not TransferableRecords");
  }

  if (!credentialStatus?.tokenRegistry) {
    throw new Error("Document's credentialStatus does not have tokenRegistry");
  }

  if (!credentialStatus?.tokenNetwork || !credentialStatus?.tokenNetwork?.chainId) {
    throw new Error("Document's credentialStatus does not have tokenNetwork.chainId");
  }

  const { provider } = options;

  if (!provider) {
    throw new Error('Provider is required for this verifier');
  }

  const tokenRegistry = TradeTrustToken__factory.connect(credentialStatus?.tokenRegistry, provider);
  const titleEscrowAddress = await tokenRegistry.ownerOf(`0x${document.proof.targetHash}`);

  const titleEscrow = TitleEscrow__factory.connect(titleEscrowAddress, provider);
  const active = await titleEscrow.active();

  if (active) {
    const result: TransferableRecordsValidFragment = {
      name: 'TransferableRecords',
      type: 'DOCUMENT_STATUS',
      status: 'VALID',
      data: { tokenRegistry: document?.credentialStatus?.type },
    };
    return result;
  } else {
    throw new Error('Title escrow is not active');
  }
};

const skip: VerifierType['skip'] = (): Promise<SkippedVerificationFragment> => {
  return Promise.resolve({
    status: 'SKIPPED',
    type: 'DOCUMENT_STATUS',
    name: 'TransferableRecords',
    reason: {
      code: 0, //OpenAttestationDidSignedDocumentStatusCode.SKIPPED,
      codeString: 'SKIPPED', //OpenAttestationDidSignedDocumentStatusCode[OpenAttestationDidSignedDocumentStatusCode.SKIPPED],
      message: 'Document does not have TransferableRecords status',
    },
  });
};

const test: VerifierType['test'] = (document: DocumentsToVerify): boolean => {
  if (v4.isWrappedDocument(document) && document.credentialStatus.type === 'TransferableRecords') {
    return true;
  }
  return false;
};

const credentialStatusTransferableRecordVerifier: VerifierType = {
  skip,
  test,
  verify: async (...args): Promise<TransferableRecordsVerificationFragment> => {
    try {
      return await verify(...args);
    } catch (e: unknown) {
      const err: TransferableRecordsInvalidFragment = {
        name: 'TransferableRecords',
        type: 'DOCUMENT_STATUS',
        status: 'INVALID',
        reason: {
          code: 0,
          codeString: 'INVALID',
          message: (e as Error).message,
        },
        data: {}, // Add an empty object as the data property
      };
      return err;
    }
  },
};

export { credentialStatusTransferableRecordVerifier };
