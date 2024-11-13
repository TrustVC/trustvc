import { Wallet } from '@ethersproject/wallet';
import { SignedWrappedDocument, signOA } from '../..';
import { describe, expect, it } from 'vitest';
import {
  SAMPLE_SIGNING_KEYS,
  WRAPPED_DOCUMENT_DID_V2,
  WRAPPED_DOCUMENT_DNS_DID_V3,
} from '../fixtures/fixtures';

const wallet = Wallet.fromMnemonic(
  'tourist quality multiply denial diary height funny calm disease buddy speed gold',
);

describe.concurrent('V3 sign', () => {
  it('should sign a document', async () => {
    const signedWrappedDocument: SignedWrappedDocument<any> = await signOA(
      WRAPPED_DOCUMENT_DNS_DID_V3,
      {
        public: 'did:ethr:0xE712878f6E8d5d4F9e87E10DA604F9cB564C9a89#controller',
        private: '0x497c85ed89f1874ba37532d1e33519aba15bd533cdcb90774cc497bfe3cde655',
      },
    );

    const { proof } = signedWrappedDocument;
    expect(Object.keys(proof).length).toBe(9);
    expect(proof.key).toBe('did:ethr:0xE712878f6E8d5d4F9e87E10DA604F9cB564C9a89#controller');
    expect(proof.signature).toMatchInlineSnapshot(
      `"0x8901a4a95890a45892c0abadf36414d0ea409ffd2f424d54e9c760427aa4d0a47bbe2d2941bb8887ca15912d732efa96acbda8f44bf18653929a04c9d4003b6a1b"`,
    );
  });

  it('should sign a document with a wallet', async () => {
    const signedWrappedDocument: SignedWrappedDocument<any> = await signOA(
      WRAPPED_DOCUMENT_DNS_DID_V3,
      wallet,
    );

    const { proof } = signedWrappedDocument;
    expect(Object.keys(proof).length).toBe(9);
    expect(proof.key).toBe('did:ethr:0x906FB815De8976b1e38D9a4C1014a3acE16Ce53C#controller');
    expect(proof.signature).toMatchInlineSnapshot(
      `"0x54f1f3ea7c237b672f1f9d344adc83fca3cdaa358714acc8893ac3c6decf6cca799aae4d54c31563b162d0b19fa82c2a05c2ce7c5dbb2b42230718b4698789a01b"`,
    );
  });

  it('should a signed document to be resigned', async () => {
    const signedDocument = await signOA(WRAPPED_DOCUMENT_DNS_DID_V3, {
      public: 'did:ethr:0xb6De3744E1259e1aB692f5a277f053B79429c5a2#controller',
      private: '0x812269266b34d2919f737daf22db95f02642f8cdc0ca673bf3f701599f4971f5',
    });

    const resignedDocument = await signOA(WRAPPED_DOCUMENT_DNS_DID_V3, {
      public: 'did:ethr:0xb6De3744E1259e1aB692f5a277f053B79429c5a2#controller',
      private: '0x812269266b34d2919f737daf22db95f02642f8cdc0ca673bf3f701599f4971f5',
    });

    expect(signedDocument).toEqual(resignedDocument);
  });

  it('should throw error if a key or signer is invalid', async () => {
    await expect(
      signOA(WRAPPED_DOCUMENT_DNS_DID_V3, {} as any),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Either a keypair or ethers.js Signer must be provided]`,
    );
  });

  it('should throw error if proof is malformed', async () => {
    await expect(
      signOA(
        {
          ...WRAPPED_DOCUMENT_DNS_DID_V3,
          proof: {
            ...WRAPPED_DOCUMENT_DNS_DID_V3.proof,
            merkleRoot: undefined as unknown as string,
          },
        },
        {
          public: 'did:ethr:0xb6De3744E1259e1aB692f5a277f053B79429c5a2#controller',
          private: '0x812269266b34d2919f737daf22db95f02642f8cdc0ca673bf3f701599f4971f5',
        },
      ),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `[Error: Unsupported document type: Only OpenAttestation v2 & v3 documents can be signed]`,
    );
  });
});

describe.concurrent('V2 sign', () => {
  it('should sign a document', async () => {
    const signedWrappedDocument: any = await signOA(WRAPPED_DOCUMENT_DID_V2, SAMPLE_SIGNING_KEYS);
    const { proof } = signedWrappedDocument;
    expect(Object.keys(proof).length).toBe(1);
    expect(proof?.[0].verificationMethod).toBe(SAMPLE_SIGNING_KEYS.public);
    expect(proof?.[0].signature).toMatchInlineSnapshot(
      `"0x6706675e86e388962cc914dda6594850d995088e87f2bb4e6153cd345a3409503a111298efdcf95b9e55416008229e48eeb87f5f6ff3d4058c0681fa3f7d39de1b"`,
    );
  });

  it('should sign a document with a wallet', async () => {
    const signedWrappedDocument: any = await signOA(WRAPPED_DOCUMENT_DID_V2, wallet);

    const { proof } = signedWrappedDocument;
    expect(Object.keys(proof).length).toBe(1);
    expect(proof?.[0].verificationMethod).toBe(
      'did:ethr:0x906FB815De8976b1e38D9a4C1014a3acE16Ce53C#controller',
    );
    expect(proof?.[0].signature).toMatchInlineSnapshot(
      `"0xfa3636d12fd090bd82ff845c74b1446a5169955dc582116895b19b54fe1b428563014b39519646ea69bda492f07771841dd7839091a3e8dd0c55ab3270d7c0f71c"`,
    );
  });

  it('should a signed document to be resigned', async () => {
    const signedDocument = await signOA(WRAPPED_DOCUMENT_DID_V2, {
      public: 'did:ethr:0xb6De3744E1259e1aB692f5a277f053B79429c5a2#controller',
      private: '0x812269266b34d2919f737daf22db95f02642f8cdc0ca673bf3f701599f4971f5',
    });

    const resignedDocument = await signOA(WRAPPED_DOCUMENT_DID_V2, {
      public: 'did:ethr:0xb6De3744E1259e1aB692f5a277f053B79429c5a2#controller',
      private: '0x812269266b34d2919f737daf22db95f02642f8cdc0ca673bf3f701599f4971f5',
    });

    expect(signedDocument.signature).toEqual(resignedDocument.signature);
  });
});
