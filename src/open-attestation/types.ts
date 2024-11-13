export {
  OpenAttestationDocument,
  WrappedDocument,
  SignedWrappedDocument,
} from '@tradetrust-tt/tradetrust';

export type KeyPair = {
  public: string; // Public key in DID format
  private: string; // Corresponding private key as a hex string
};
