import { encrypt, decrypt } from '../../core';
import { describe, expect, it } from 'vitest';

describe('V4 verify', () => {
  it('should verify encryption and decryption', async () => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf45kyuf875gfgwhdjahsvug';
    const nonce = ' '.repeat(12);
    const message = 'a'.repeat(120);
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it('should be able to  verify encryption on variable length key', async () => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf4asdf';
    const nonce = ' '.repeat(12);
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it('should be able to  verify encryption on variable length key', async () => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf42';
    const nonce = '12bytenonce';
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it('encrypted length when message length is 120', async () => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf42';
    const nonce = '12bytenonce_';
    const message = 'a'.repeat(120);
    const encrypted = encrypt(message, key, nonce);

    expect(encrypted.length).toBe(240);
  });
  it('successfully decrypts a message when the kek is less than 32 bytes', async () => {
    const key = 'a013fb9d-bb03-4056-b696';
    expect(key.length).toBeLessThan(32);
    const nonce = '12bytenonce';
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it('successfully decrypts a message when the nonce is less than 12 bytes', async () => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf42';
    const nonce = 'a'.repeat(11);
    expect(nonce.length).toBeLessThan(12);
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it("successfully decrypts a message when we don't pass a nonce", async () => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf42';
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(message);
  });
  it('successfully decrypts a message when we pass message with special characters', async () => {
    const key = 'a';
    const message =
      'Hello, World!24#@$@#!@#$!@#Hello, World!24#@$@#!@#$!@#Hello, World!24#@$@#!@#$!@#Hello, World!24#@$@#!@#$!@#6152765@#$bj';
    const encrypted = encrypt(message, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(message);
  });
  it("should throw an error when we don't pass a key while encryption", async () => {
    const message = 'Hello, World!';
    expect(() => encrypt(message, '')).toThrowError('Key length must not be 0');
  });
  it("should throw an error when we don't pass a key while decryption", async () => {
    const message = 'Hello, World!';
    const encrypted = encrypt(message, 'a');
    expect(() => decrypt(encrypted, '')).toThrowError('Key length must not be 0');
  });
});
