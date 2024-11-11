import { describe, it } from 'vitest';
import { decrypt, encrypt } from '../../core';

describe.concurrent('Encrpytion', () => {
  it('should verify encryption and decryption', async ({ expect }) => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf45kyuf875gfgwhdjahsvug';
    const nonce = ' '.repeat(12);
    const message = 'a'.repeat(120);
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it('should be able to  verify encryption on variable length key', async ({ expect }) => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf4asdf';
    const nonce = ' '.repeat(12);
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it('should be able to  verify encryption on variable length key', async ({ expect }) => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf42';
    const nonce = '12bytenonce';
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it('encrypted length when message length is 120', async ({ expect }) => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf42';
    const nonce = '12bytenonce_';
    const message = 'a'.repeat(120);
    const encrypted = encrypt(message, key, nonce);

    expect(encrypted.length).toBe(240);
  });
  it('successfully decrypts a message when the key is less than 32 bytes', async ({ expect }) => {
    const key = 'a013fb9d-bb03-4056-b696';
    expect(key.length).toBeLessThan(32);
    const nonce = '12bytenonce';
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it('successfully decrypts a message when the nonce is less than 12 bytes', async ({ expect }) => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf42';
    const nonce = 'a'.repeat(11);
    expect(nonce.length).toBeLessThan(12);
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key, nonce);
    const decrypted = decrypt(encrypted, key, nonce);
    expect(decrypted).toBe(message);
  });
  it("successfully decrypts a message when we don't pass a nonce", async ({ expect }) => {
    const key = 'a013fb9d-bb03-4056-b696-05575eceaf42';
    const message = 'Hello, World!';
    const encrypted = encrypt(message, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(message);
  });
  it('successfully decrypts a message when we pass message with special characters', async ({
    expect,
  }) => {
    const key = 'a';
    const message =
      'Hello, World!24#@$@#!@#$!@#Hello, World!24#@$@#!@#$!@#Hello, World!24#@$@#!@#$!@#Hello, World!24#@$@#!@#$!@#6152765@#$bj';
    const encrypted = encrypt(message, key);
    const decrypted = decrypt(encrypted, key);
    expect(decrypted).toBe(message);
  });
  it('successfully encrypts and decrypts a messsage when key is missing', async ({ expect }) => {
    const message = 'a'.repeat(120);
    const encrypted = encrypt(message, '');
    const decrypted = decrypt(encrypted, '');
    expect(decrypted).toBe(message);
  });
});
