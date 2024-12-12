export type {
  OpenAttestationDocument,
  WrappedDocument,
  SignedWrappedDocument,
} from '@tradetrust-tt/tradetrust';
export { v2, v3 } from '@tradetrust-tt/tradetrust';

export type KeyPair = {
  public: string; // Public key in DID format
  private: string; // Corresponding private key as a hex string
};

export type { DiagnoseError } from '@tradetrust-tt/tradetrust/dist/types/shared/utils';
