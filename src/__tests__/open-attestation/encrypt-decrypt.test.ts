import { describe, expect, it, test } from 'vitest';
import {
  encryptString,
  decryptString,
  ENCRYPTION_PARAMETERS,
  encodeDocument,
  decodeDocument,
  generateEncryptionKey,
} from '../..';
import { RAW_DOCUMENT_DNS_DID_V3 } from '../fixtures/fixtures';
import sampleOaDocument from '../fixtures/sample-oa-document.json';

const base64Regex = /^(?:[a-zA-Z0-9+/]{4})*(?:|(?:[a-zA-Z0-9+/]{3}=)|(?:[a-zA-Z0-9+/]{2}==))$/;
const encryptionKeyRegex = /^[0-9a-f]{64}$/;

describe('open-attestation encrypt/decrypt (OA document encryption)', () => {
  it('should encrypt and decrypt unicode symbols correctly', () => {
    const originalObject = JSON.stringify({ data: 'Rating(≤ 25kg)' });
    const enc = encryptString(originalObject);
    const dec = decryptString(enc);
    expect(dec).toStrictEqual(originalObject);
  });

  it('should encrypt and decrypt larger documents', () => {
    const originalObject = JSON.stringify(RAW_DOCUMENT_DNS_DID_V3);
    const enc = encryptString(originalObject);
    const dec = decryptString(enc);
    expect(dec).toStrictEqual(originalObject);
  });

  it('should encrypt and decrypt document from sample JSON file', () => {
    const docString = JSON.stringify(sampleOaDocument);
    const enc = encryptString(docString);
    const dec = decryptString(enc);
    expect(JSON.parse(dec)).toStrictEqual(sampleOaDocument);
  });

  describe('encryptString', () => {
    test('should have the right keys and values when no key passed', () => {
      const encryptionResults = encryptString('hello world');
      expect(encryptionResults).toStrictEqual(
        expect.objectContaining({
          cipherText: expect.stringMatching(base64Regex),
          iv: expect.stringMatching(base64Regex),
          tag: expect.stringMatching(base64Regex),
          key: expect.stringMatching(encryptionKeyRegex),
          type: ENCRYPTION_PARAMETERS.version,
        }),
      );
    });

    test('should have the right keys and values when key is passed', () => {
      const encryptionKey = generateEncryptionKey();
      const encryptionResults = encryptString('hello world', encryptionKey);
      expect(encryptionResults).toStrictEqual(
        expect.objectContaining({
          cipherText: expect.stringMatching(base64Regex),
          iv: expect.stringMatching(base64Regex),
          tag: expect.stringMatching(base64Regex),
          key: expect.stringMatching(encryptionKeyRegex),
          type: ENCRYPTION_PARAMETERS.version,
        }),
      );
      expect(encryptionResults.key).toStrictEqual(encryptionKey);
    });

    test('should throw error if input is not a string', () => {
      expect(() =>
        encryptString(
          // @ts-expect-error testing invalid input
          {},
        ),
      ).toThrow('encryptString only accepts strings');
      expect(() =>
        encryptString(
          // @ts-expect-error testing invalid input
          2,
        ),
      ).toThrow('encryptString only accepts strings');
    });
  });

  describe('decryptString', () => {
    test('can decrypt', () => {
      const encryptionResults = encryptString('hello world');
      expect(decryptString(encryptionResults)).toBe('hello world');
    });

    test('can decrypt when encryption key is passed', () => {
      const encryptionKey = generateEncryptionKey();
      const encryptionResults = encryptString('hello world', encryptionKey);
      expect(decryptString(encryptionResults)).toBe('hello world');
    });

    test('throws when type is wrong', () => {
      const enc = encryptString('hello');
      expect(() => decryptString({ ...enc, type: 'OTHER-TYPE' })).toThrow(
        `Expecting version ${ENCRYPTION_PARAMETERS.version} but got OTHER-TYPE`,
      );
    });

    test('throws when key is wrong', () => {
      const enc = encryptString('hello');
      const wrongKey = '0'.repeat(64);
      expect(() => decryptString({ ...enc, key: wrongKey })).toThrow('Error decrypting message');
    });
  });

  describe('encodeDocument & decodeDocument', () => {
    it('should do the reverse of each other', () => {
      const input = 'hello';
      const encoded = encodeDocument(input);
      const decoded = decodeDocument(encoded);
      expect(decoded).toBe(input);
    });

    it('should work for unicode text', () => {
      const input = '🦄😱|certificate|证书|sijil|प्रमाणपत्र';
      const encoded = encodeDocument(input);
      const decoded = decodeDocument(encoded);
      expect(decoded).toBe(input);
    });

    it('encodeDocument should return url safe characters only', () => {
      const input = '🦄😱|certificate|证书|sijil|प्रमाणपत्र';
      const encoded = encodeDocument(input);
      // encodeURIComponent encodes +, /, = — so this only passes when output is truly query-safe (base64url).
      expect(encodeURIComponent(encoded)).toBe(encoded);
    });
  });
});
