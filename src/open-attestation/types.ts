export {
  OpenAttestationDocument,
  WrappedDocument,
  SignedWrappedDocument,
} from '@govtechsg/open-attestation';

export type KeyPair = {
  public: string; // Public key in DID format
  private: string; // Corresponding private key as a hex string
};
