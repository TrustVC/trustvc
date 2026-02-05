import { verifySignature } from '@tradetrust-tt/tradetrust';
import { cloneDeep } from 'lodash';
import { describe, expect, it } from 'vitest';
import { isValidOpenCert, registryVerifier } from '../..';
import { OPENCERT_VERIFIABLE_DOCUMENT_V2_0 } from '../fixtures/fixtures';

const TEST_DOCUMENTS = {
  'Valid Document': OPENCERT_VERIFIABLE_DOCUMENT_V2_0,
} as const;

describe.concurrent('OpenCert registry verifier', () => {
  it(
    'given an OpenCert document (with documentStore/certificateStore), should run verifier and return fragment as return value',
    { timeout: 300000 },
    async () => {
      expect(registryVerifier.test(OPENCERT_VERIFIABLE_DOCUMENT_V2_0 as any, {} as any)).toBe(true);
      const fragment = await registryVerifier.verify(
        OPENCERT_VERIFIABLE_DOCUMENT_V2_0 as any,
        {} as any,
      );

      // Uses real https://opencerts.io/static/registry.json
      expect(fragment.type).toBe('ISSUER_IDENTITY');
      expect(fragment.name).toBe('OpencertsRegistryVerifier');
      expect(fragment.status).toBe('INVALID'); // INVALID because we are not using a fixture that has a valid registry. Do internal testing for opencert with valid registry instead.
    },
  );
});

describe.concurrent('OpenCert signature verify', () => {
  Object.entries(TEST_DOCUMENTS).forEach(([description, document]) => {
    describe(`${description}`, () => {
      it('given a document with unaltered data, should return true', async () => {
        expect(await verifySignature(document)).toBe(true);
      });

      describe('tampering', () => {
        it('given a value of a key in object is changed, should return false', async () => {
          const modified = {
            ...document,
            data: {
              ...document.data,
              recipient: {
                ...document.data.recipient,
                name: 'FAKE RECIPIENT',
              },
            },
          };

          expect(await verifySignature(modified)).toBe(false);
        });

        it('given a key in an object is altered (value kept the same), should return false', async () => {
          const { name, ...recipientWithoutName } = document.data.recipient;
          const modified = {
            ...document,
            data: {
              ...document.data,
              recipient: {
                ...recipientWithoutName,
                fakename: name, // Key was originally "name"
              },
            },
          };

          expect(await verifySignature(modified)).toBe(false);
        });

        it('given a new array item is added, should return false', async () => {
          const modifiedData: any = cloneDeep(document.data);
          expect(Array.isArray(modifiedData.transcript)).toBe(true);
          const originalLength = modifiedData.transcript.length;
          modifiedData.transcript.push({
            name: 'fake-name',
            grade: 'fake-grade',
            courseCredit: 'fake-course-credit',
            courseCode: 'fake-course-code',
            examinationDate: 'fake-exam-date',
            semester: 'fake-semester',
          });
          expect(modifiedData.transcript.length).toBe(originalLength + 1);

          expect(
            await verifySignature({
              ...document,
              data: modifiedData, // Added new array item into transcript
            }),
          ).toBe(false);
        });

        it('given a key in an item is removed, should return false', async () => {
          const modifiedData = cloneDeep(document.data);
          expect(modifiedData.issuers?.[0]?.name).toBeDefined();
          delete modifiedData.issuers[0].name;
          expect(modifiedData.issuers[0].name).toBeUndefined();

          expect(
            await verifySignature({
              ...document,
              data: modifiedData, // Removed name from issuer
            }),
          ).toBe(false);
        });

        describe('given insertion of an object, should return false', () => {
          it('given insertion into an object', async () => {
            expect(
              await verifySignature({
                ...document,
                data: {
                  ...document.data,
                  extraField: {
                    hello: 'world', // Added new field into data
                  },
                },
              }),
            ).toBe(false);
          });

          it('given insertion into an array', async () => {
            const modifiedData: any = cloneDeep(document.data);
            const originalLength = modifiedData.transcript.length;
            modifiedData.transcript.push({ name: 'newField' });
            expect(modifiedData.transcript.length).toBe(originalLength + 1);

            expect(
              await verifySignature({
                ...document,
                data: modifiedData, // Added new field into transcript array
              }),
            ).toBe(false);
          });
        });

        describe('given insertion of an array, should return false', () => {
          it('given insertion into an object', async () => {
            expect(
              await verifySignature({
                ...document,
                data: {
                  ...document.data,
                  extraArrayField: ['abc'],
                },
              }),
            ).toBe(false);
          });

          it('given insertion into an array', async () => {
            const modifiedData: any = cloneDeep(document.data);
            const originalLength = modifiedData.transcript.length;
            modifiedData.transcript.push(['abc']);
            expect(modifiedData.transcript.length).toBe(originalLength + 1);

            expect(
              await verifySignature({
                ...document,
                data: modifiedData,
              }),
            ).toBe(false);
          });
        });

        it('given insertion of a null value into an object, should return false', async () => {
          expect(
            await verifySignature({
              ...document,
              data: {
                ...document.data,
                extraNullField: null,
              },
            }),
          ).toBe(false);

          const modifiedData: any = cloneDeep(document.data);
          const originalLength = modifiedData.transcript.length;
          modifiedData.transcript.push({
            name: null,
          });
          expect(modifiedData.transcript.length).toBe(originalLength + 1);

          expect(
            await verifySignature({
              ...document,
              data: modifiedData,
            }),
          ).toBe(false);
        });

        it('given a null value is inserted into an array, should return false', async () => {
          const modifiedData: any = cloneDeep(document.data);
          const originalLength = modifiedData.transcript.length;
          modifiedData.transcript.push(null);
          expect(modifiedData.transcript.length).toBe(originalLength + 1);
          expect(modifiedData.transcript[originalLength]).toBe(null);

          expect(
            await verifySignature({
              ...document,
              data: modifiedData,
            }),
          ).toBe(false);
        });

        it('given an altered value type that string coerce to the same value, should return false', async () => {
          const modifiedData: any = cloneDeep(document.data);
          expect(typeof modifiedData.transcript?.[0]?.semester).toBe('string');
          modifiedData.transcript[0].semester = 1;
          expect(typeof modifiedData.transcript[0].semester).toBe('number');

          expect(
            await verifySignature({
              ...document,
              data: modifiedData,
            }),
          ).toBe(false);
        });

        it('given a key and value is moved, should return false', async () => {
          const modifiedData: any = cloneDeep(document.data);
          expect(modifiedData.description).toBeDefined();
          const description = modifiedData.description;
          delete modifiedData.description;
          expect(modifiedData.description).toBeUndefined();

          expect(
            await verifySignature({
              ...document,
              description,
              data: modifiedData,
            }),
          ).toBe(false);
        });
      });
    });
  });
});

describe.concurrent('OpenCert isValidOpenCert', () => {
  it('given empty fragments array, should throw', () => {
    expect(() => isValidOpenCert([])).toThrow(
      'Please provide at least one verification fragment to check',
    );
  });

  it('given empty types array, should throw', () => {
    expect(() =>
      isValidOpenCert([{ type: 'DOCUMENT_INTEGRITY', status: 'VALID' }] as any, []),
    ).toThrow('Please provide at least one type to check');
  });

  it('given issuer identity has at least one VALID fragment, should return true even if another issuer identity fragment is INVALID', () => {
    const fragments = [
      { type: 'DOCUMENT_STATUS', status: 'VALID', name: 'status', data: true },
      { type: 'DOCUMENT_INTEGRITY', status: 'VALID', name: 'integrity', data: true },
      { type: 'ISSUER_IDENTITY', status: 'VALID', name: 'issuer-1', data: {} },
      {
        type: 'ISSUER_IDENTITY',
        status: 'INVALID',
        name: 'issuer-2',
        data: {},
        reason: { code: 0, codeString: 'INVALID', message: 'invalid' },
      },
    ];

    expect(isValidOpenCert(fragments as any)).toBe(true);
  });
});
