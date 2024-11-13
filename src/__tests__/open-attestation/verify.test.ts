import { v3 } from '@tradetrust-tt/tradetrust';
import { cloneDeep } from 'lodash';
import { describe, expect, it } from 'vitest';
import { verifyOASignature } from '../..';
import {
  BATCHED_SIGNED_WRAPPED_DOCUMENTS_DID,
  SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3,
  WRAPPED_DOCUMENT_DNS_TXT_V2,
} from '../fixtures/fixtures';

const TEST_DOCUMENTS = {
  'Documents without proofs mean these documents are wrapped individually (i.e. targetHash == merkleRoot)':
    SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3,
  'Documents with proofs mean these documents are wrapped as a batch (i.e. proofs exist, and targetHash !== merkleRoot)':
    BATCHED_SIGNED_WRAPPED_DOCUMENTS_DID[0],
} as const;

describe.concurrent('v3 verify', () => {
  Object.entries(TEST_DOCUMENTS).forEach(([description, document]) => {
    describe(`${description}`, () => {
      it('given a document with unaltered data, should return true', async () => {
        expect(await verifyOASignature(document)).toBe(true);
      });

      describe('tampering', () => {
        it('given a value of a key in object is changed, should return false', async () => {
          const newName = 'Fake Name';
          expect((document.issuer as any).name).not.toBe(newName);
          expect(
            await verifyOASignature({
              ...document,
              issuer: {
                ...(document.issuer as any),
                name: 'Fake Name', // Value was originally "DEMO STORE"
              },
            }),
          ).toBe(false);
        });

        it('given a key in an object is altered (value kept the same), should return false', async () => {
          const { name, ...issuerWithoutName } = document.issuer as any;

          expect(
            await verifyOASignature({
              ...document,
              issuer: {
                ...issuerWithoutName,
                fakename: name, // Key was originally "name"
              } as unknown as v3.SignedWrappedDocument['issuer'],
            }),
          ).toBe(false);
        });

        it('given a new array item is added, should return false', async () => {
          const modifiedCredentialSubject: any = cloneDeep(document.credentialSubject);
          expect(modifiedCredentialSubject.packages[1]).toBeUndefined();
          modifiedCredentialSubject.packages.push({
            description: '1 Pallet',
            weight: '1',
            measurement: 'KG',
          });
          expect(modifiedCredentialSubject.packages[1].description).toBeDefined();

          expect(
            await verifyOASignature({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        it('given a key in an item is removed, should return false', async () => {
          const modifiedCredentialSubject: any = cloneDeep(document.credentialSubject);
          expect(modifiedCredentialSubject.packages[0].description).toBeDefined();
          delete (modifiedCredentialSubject.packages[0] as any).description;
          expect(modifiedCredentialSubject.packages[0].description).toBeUndefined();

          expect(
            await verifyOASignature({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        describe('given insertion of an object, should return false', () => {
          it('given insertion into an object', async () => {
            expect(
              await verifyOASignature({
                ...document,
                credentialSubject: {
                  ...document.credentialSubject,
                  newField: {
                    name: 'newField',
                  },
                },
              }),
            ).toBe(false);
          });

          it('given insertion into an array', async () => {
            const modifiedCredentialSubject: any = cloneDeep(document.credentialSubject);
            expect(modifiedCredentialSubject.packages[1]).toBeUndefined();
            modifiedCredentialSubject.packages.push({
              name: 'newField',
            } as any);
            expect(modifiedCredentialSubject.packages[1]).toBeDefined();

            expect(
              await verifyOASignature({
                ...document,
                credentialSubject: modifiedCredentialSubject,
              }),
            ).toBe(false);
          });
        });

        describe('given insertion of an array, should return false', () => {
          it('given insertion into an object', async () => {
            expect(
              await verifyOASignature({
                ...document,
                credentialSubject: {
                  ...document.credentialSubject,
                  newField: ['abc'],
                },
              }),
            ).toBe(false);
          });

          it('given insertion into an array', async () => {
            const modifiedCredentialSubject: any = cloneDeep(document.credentialSubject);
            expect(modifiedCredentialSubject.packages[1]).toBeUndefined();
            modifiedCredentialSubject.packages.push(['abc'] as any);
            expect(modifiedCredentialSubject.packages[1]).toBeDefined();

            expect(
              await verifyOASignature({
                ...document,
                credentialSubject: modifiedCredentialSubject,
              }),
            ).toBe(false);
          });
        });

        it('given insertion of a null value into an object, should return false', async () => {
          expect(
            await verifyOASignature({
              ...document,
              credentialSubject: {
                ...document.credentialSubject,
                newField: null,
              },
            }),
          ).toBe(false);

          const modifiedCredentialSubject: any = cloneDeep(document.credentialSubject);
          expect(modifiedCredentialSubject.packages[1]).toBeUndefined();
          modifiedCredentialSubject.packages.push({
            name: null,
          } as any);
          expect(modifiedCredentialSubject.packages[1]).toBeDefined();

          expect(
            await verifyOASignature({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        it('given a null value is inserted into an array, should return false', async () => {
          const modifiedCredentialSubject: any = cloneDeep(document.credentialSubject);
          expect(modifiedCredentialSubject.packages[1]).toBeUndefined();
          modifiedCredentialSubject.packages.push(null as any);
          expect(modifiedCredentialSubject.packages[1]).toBe(null);

          expect(
            await verifyOASignature({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        it('given an altered value type that string coerce to the same value, should return false', async () => {
          const modifiedCredentialSubject: any = cloneDeep(document.credentialSubject);
          expect(typeof modifiedCredentialSubject.packages[0].weight).toBe('string');
          modifiedCredentialSubject.packages[0].weight = 3;
          expect(typeof modifiedCredentialSubject.packages[0].weight).toBe('number');

          expect(
            await verifyOASignature({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        it('given a key and value is moved, should return false', async () => {
          const modifiedCredentialSubject: any = cloneDeep(document.credentialSubject);

          // move "id" from credentialSubject to root
          expect(modifiedCredentialSubject.id).toBe(
            'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
          );
          const id = modifiedCredentialSubject.id;
          delete (modifiedCredentialSubject as any).id;
          expect(modifiedCredentialSubject.id).toBeUndefined();

          expect(
            await verifyOASignature({
              ...document,
              id,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });
      });
    });
  });
});

describe.concurrent('V2 verify', () => {
  it('given a document with unaltered data, should return true', async () => {
    expect(await verifyOASignature(WRAPPED_DOCUMENT_DNS_TXT_V2)).toBe(true);
  });

  it('given a value of a key in object is changed, should return false', async () => {
    const newName = 'a775d0db-ef6f-41ce-bb2f-f2366ef0e1a6:string:SG FREIGHT';
    expect(WRAPPED_DOCUMENT_DNS_TXT_V2.data.recipient.name).not.toBe(newName);
    expect(
      await verifyOASignature({
        ...WRAPPED_DOCUMENT_DNS_TXT_V2,
        data: {
          ...WRAPPED_DOCUMENT_DNS_TXT_V2.data,
          recipient: {
            ...WRAPPED_DOCUMENT_DNS_TXT_V2.data.recipient,
            name: newName,
          },
        },
      }),
    ).toBe(false);
  });
});
