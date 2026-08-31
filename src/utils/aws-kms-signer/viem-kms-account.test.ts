import { describe, it, expect, vi, beforeEach } from 'vitest';
import { secp256k1 } from '@noble/curves/secp256k1';
import { keccak256, parseTransaction, recoverAddress, serializeTransaction } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { hashAuthorization } from 'viem/utils';

const { mockSend } = vi.hoisted(() => ({ mockSend: vi.fn() }));

vi.mock('@aws-sdk/client-kms', () => ({
  KMSClient: class {
    send(command: unknown) {
      return mockSend(command);
    }
  },
  GetPublicKeyCommand: class {
    constructor(public input: unknown) {}
  },
  SignCommand: class {
    constructor(public input: unknown) {}
  },
}));

import { kmsToAccount } from './viem-kms-account';

// Asserts a value is defined and returns it narrowed (avoids `!` assertions).
const assertDefined = <T>(value: T | undefined, message: string): T => {
  if (value === undefined) throw new Error(message);
  return value;
};

const TEST_PRIVATE_KEY = `0x${'42'.repeat(32)}` as const;
const referenceAccount = privateKeyToAccount(TEST_PRIVATE_KEY);
const privateKeyBytes = Buffer.from(TEST_PRIVATE_KEY.slice(2), 'hex');

// A deliberately fake DER blob: arbitrary prefix bytes (which themselves contain
// 0x04) followed by the real 65-byte uncompressed point. `kmsToAccount` must
// recover the point by taking the trailing 65 bytes, not by scanning for a 0x04
// marker byte, since the point's own X/Y bytes can contain that value too.
function fakeKmsPublicKeyDer(): Buffer {
  const point = Buffer.from(referenceAccount.publicKey.slice(2), 'hex');
  const prefixWithDecoyMarkerBytes = Buffer.from(
    '3056301006072a8648ce3d020106052b8104000a0342000400',
    'hex',
  );
  return Buffer.concat([prefixWithDecoyMarkerBytes, point]);
}

const VALID_KEY_METADATA = {
  KeySpec: 'ECC_SECG_P256K1',
  KeyUsage: 'SIGN_VERIFY',
  SigningAlgorithms: ['ECDSA_SHA_256'],
};

function kmsDerSignature(digest: Uint8Array): Buffer {
  const sig = secp256k1.sign(digest, privateKeyBytes, { lowS: true });
  return Buffer.from(sig.toDERRawBytes());
}

beforeEach(() => {
  mockSend.mockReset();
  mockSend.mockImplementation(async (command: { input: { Message?: Uint8Array } }) => {
    if (!('Message' in command.input)) {
      return { PublicKey: fakeKmsPublicKeyDer(), ...VALID_KEY_METADATA };
    }
    const digest = command.input.Message as Uint8Array;
    return { Signature: kmsDerSignature(digest) };
  });
});

describe('kmsToAccount', () => {
  it('derives the same address and public key as the underlying private key', async () => {
    const account = await kmsToAccount({ keyId: 'test-key' });

    expect(account.address).toBe(referenceAccount.address);
    expect(account.publicKey).toBe(referenceAccount.publicKey);
    expect(account.source).toBe('kms');
  });

  it('signs an EIP-7702 authorization recoverable to the account address', async () => {
    const account = await kmsToAccount({ keyId: 'test-key' });
    const authorization = {
      address: '0x1234567890123456789012345678901234567890' as const,
      chainId: 1,
      nonce: 0,
    };

    const signed = assertDefined(
      await account.signAuthorization?.(authorization),
      'expected signAuthorization to be implemented',
    );

    const recovered = await recoverAddress({
      hash: hashAuthorization(authorization),
      signature: {
        r: signed.r,
        s: signed.s,
        yParity: assertDefined(signed.yParity, 'expected yParity on signed authorization'),
      },
    });
    expect(recovered).toBe(account.address);
  });

  it('signs a transaction recoverable to the account address', async () => {
    const account = await kmsToAccount({ keyId: 'test-key' });
    const transaction = {
      chainId: 1,
      to: '0x1234567890123456789012345678901234567890' as const,
      nonce: 0,
      maxFeePerGas: 1n,
      maxPriorityFeePerGas: 1n,
      gas: 21000n,
      value: 0n,
      type: 'eip1559' as const,
    };

    const signedTx = await account.signTransaction(transaction);
    const parsed = parseTransaction(signedTx);

    const recovered = await recoverAddress({
      hash: keccak256(serializeTransaction(transaction)),
      signature: {
        r: assertDefined(parsed.r, 'expected r on parsed transaction'),
        s: assertDefined(parsed.s, 'expected s on parsed transaction'),
        yParity: assertDefined(parsed.yParity, 'expected yParity on parsed transaction'),
      },
    });
    expect(recovered).toBe(account.address);
  });

  it('rejects when no candidate recovery bit matches the derived address', async () => {
    mockSend.mockImplementation(async (command: { input: { Message?: Uint8Array } }) => {
      if (!('Message' in command.input)) {
        return { PublicKey: fakeKmsPublicKeyDer(), ...VALID_KEY_METADATA };
      }
      const otherKey = Buffer.from('11'.repeat(32), 'hex');
      const digest = command.input.Message as Uint8Array;
      return {
        Signature: Buffer.from(secp256k1.sign(digest, otherKey, { lowS: true }).toDERRawBytes()),
      };
    });

    const account = await kmsToAccount({ keyId: 'test-key' });
    const signAuthorization = assertDefined(
      account.signAuthorization,
      'expected signAuthorization to be implemented',
    );
    await expect(
      signAuthorization({
        address: '0x1234567890123456789012345678901234567890' as const,
        chainId: 1,
        nonce: 0,
      }),
    ).rejects.toThrow('Could not recover a signature matching address');
  });

  it('rejects a key whose KeySpec is not ECC_SECG_P256K1', async () => {
    mockSend.mockImplementation(async () => ({
      PublicKey: fakeKmsPublicKeyDer(),
      ...VALID_KEY_METADATA,
      KeySpec: 'ECC_NIST_P256',
    }));

    await expect(kmsToAccount({ keyId: 'test-key' })).rejects.toThrow(
      'has KeySpec "ECC_NIST_P256", expected "ECC_SECG_P256K1"',
    );
  });

  it('rejects a key whose KeyUsage is not SIGN_VERIFY', async () => {
    mockSend.mockImplementation(async () => ({
      PublicKey: fakeKmsPublicKeyDer(),
      ...VALID_KEY_METADATA,
      KeyUsage: 'ENCRYPT_DECRYPT',
    }));

    await expect(kmsToAccount({ keyId: 'test-key' })).rejects.toThrow(
      'has KeyUsage "ENCRYPT_DECRYPT", expected "SIGN_VERIFY"',
    );
  });

  it('rejects a key that does not support ECDSA_SHA_256', async () => {
    mockSend.mockImplementation(async () => ({
      PublicKey: fakeKmsPublicKeyDer(),
      ...VALID_KEY_METADATA,
      SigningAlgorithms: ['ECDSA_SHA_384'],
    }));

    await expect(kmsToAccount({ keyId: 'test-key' })).rejects.toThrow(
      'does not support the ECDSA_SHA_256 signing algorithm',
    );
  });
});
