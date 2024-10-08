import { cloneDeep } from 'lodash';
import {
  BATCHED_SIGNED_WRAPPED_DOCUMENTS_DID,
  SIGNED_WRAPPED_DOCUMENT_DID,
  WRAPPED_DOCUMENT_DNS_TXT_V2,
} from '../fixtures/fixtures';
import { describe, expect, it } from 'vitest';
import { v4 } from '@govtechsg/open-attestation';
import { verify } from '../../open-attestation';

const TEST_DOCUMENTS = {
  'Documents without proofs mean these documents are wrapped individually (i.e. targetHash == merkleRoot)':
    SIGNED_WRAPPED_DOCUMENT_DID,
  'Documents with proofs mean these documents are wrapped as a batch (i.e. proofs exist, and targetHash !== merkleRoot)':
    BATCHED_SIGNED_WRAPPED_DOCUMENTS_DID[0],
} as const;

describe('V4 verify', () => {
  Object.entries(TEST_DOCUMENTS).forEach(([description, document]) => {
    describe(`${description}`, () => {
      it('given a document wiht unaltered data, should return true', async () => {
        expect(await verify(document)).toBe(true);
      });

      describe('tampering', () => {
        it('given a value of a key in object is changed, should return false', async () => {
          const newName = 'Fake Name';
          expect(document.issuer.name).not.toBe(newName);
          expect(
            await verify({
              ...document,
              issuer: {
                ...document.issuer,
                name: 'Fake Name', // Value was originally "DEMO STORE"
              },
            }),
          ).toBe(false);
        });

        it('given a key in an object is altered (value kept the same), should return false', async () => {
          const { name, ...issuerWithoutName } = document.issuer;

          expect(
            await verify({
              ...document,
              issuer: {
                ...issuerWithoutName,
                fakename: name, // Key was originally "name"
              } as unknown as v4.SignedWrappedDocument['issuer'],
            }),
          ).toBe(false);
        });

        it('given a new array item is added, should return false', async () => {
          const modifiedCredentialSubject = cloneDeep(document.credentialSubject);
          expect(modifiedCredentialSubject.licenses[2]).toBeUndefined();
          modifiedCredentialSubject.licenses.push({
            class: 'Class 2A',
            effectiveDate: '2020-06-05T00:00:00Z',
            description: 'Motorcycle',
          });
          expect(modifiedCredentialSubject.licenses[2].description).toBeDefined();

          expect(
            await verify({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        it('given a key in an item is removed, should return false', async () => {
          const modifiedCredentialSubject = cloneDeep(document.credentialSubject);
          expect(modifiedCredentialSubject.licenses[0].description).toBeDefined();
          delete (modifiedCredentialSubject.licenses[0] as any).description;
          expect(modifiedCredentialSubject.licenses[0].description).toBeUndefined();

          expect(
            await verify({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        describe('given insertion of an empty object, should return false', () => {
          it('given insertion into an object', async () => {
            expect(
              await verify({
                ...document,
                credentialSubject: {
                  ...document.credentialSubject,
                  newField: {},
                },
              }),
            ).toBe(false);
          });

          it('given insertion into an array', async () => {
            const modifiedCredentialSubject = cloneDeep(document.credentialSubject);
            expect(modifiedCredentialSubject.licenses[2]).toBeUndefined();
            modifiedCredentialSubject.licenses.push({} as any);
            expect(modifiedCredentialSubject.licenses[2]).toEqual({});

            expect(
              await verify({
                ...document,
                credentialSubject: modifiedCredentialSubject,
              }),
            ).toBe(false);
          });
        });

        describe('given insertion of an empty array, should return false', () => {
          it('given insertion into an object', async () => {
            expect(
              await verify({
                ...document,
                credentialSubject: {
                  ...document.credentialSubject,
                  newField: [],
                },
              }),
            ).toBe(false);
          });

          it('given insertion into an array', async () => {
            const modifiedCredentialSubject = cloneDeep(document.credentialSubject);
            expect(modifiedCredentialSubject.licenses[2]).toBeUndefined();
            modifiedCredentialSubject.licenses.push([] as any);
            expect(modifiedCredentialSubject.licenses[2]).toEqual([]);

            expect(
              await verify({
                ...document,
                credentialSubject: modifiedCredentialSubject,
              }),
            ).toBe(false);
          });
        });

        it('given insertion of a null value into an object, should return false', async () => {
          expect(
            await verify({
              ...document,
              credentialSubject: {
                ...document.credentialSubject,
                newField: null,
              },
            }),
          ).toBe(false);

          const modifiedCredentialSubject = cloneDeep(document.credentialSubject);
          expect(modifiedCredentialSubject.licenses[2]).toBeUndefined();
          modifiedCredentialSubject.licenses.push({} as any);
          expect(modifiedCredentialSubject.licenses[2]).toEqual({});

          expect(
            await verify({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        it('given a null value is inserted into an array, should return false', async () => {
          const modifiedCredentialSubject = cloneDeep(document.credentialSubject);
          expect(modifiedCredentialSubject.licenses[2]).toBeUndefined();
          modifiedCredentialSubject.licenses.push(null as any);
          expect(modifiedCredentialSubject.licenses[2]).toBe(null);

          expect(
            await verify({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        it('given an altered value type that string coerce to the same value, should return false', async () => {
          const modifiedCredentialSubject = cloneDeep(document.credentialSubject);
          expect(typeof modifiedCredentialSubject.licenses[0].class).toBe('string');
          modifiedCredentialSubject.licenses[0].class = 3 as unknown as string;
          expect(typeof modifiedCredentialSubject.licenses[0].class).toBe('number');

          expect(
            await verify({
              ...document,
              credentialSubject: modifiedCredentialSubject,
            }),
          ).toBe(false);
        });

        it('given a key and value is moved, should return false', async () => {
          const modifiedCredentialSubject = cloneDeep(document.credentialSubject);

          // move "id" from credentialSubject to root
          expect(modifiedCredentialSubject.id).toBe(
            'urn:uuid:a013fb9d-bb03-4056-b696-05575eceaf42',
          );
          const id = modifiedCredentialSubject.id;
          delete (modifiedCredentialSubject as any).id;
          expect(modifiedCredentialSubject.id).toBeUndefined();

          expect(
            await verify({
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

describe('V2 verify', () => {
  it('given a document with unaltered data, should return true', async () => {
    expect(await verify(WRAPPED_DOCUMENT_DNS_TXT_V2)).toBe(true);
  });

  it('given a value of a key in object is changed, should return false', async () => {
    const newName = 'a775d0db-ef6f-41ce-bb2f-f2366ef0e1a6:string:SG FREIGHT';
    expect(WRAPPED_DOCUMENT_DNS_TXT_V2.data.recipient.name).not.toBe(newName);
    expect(
      await verify({
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
