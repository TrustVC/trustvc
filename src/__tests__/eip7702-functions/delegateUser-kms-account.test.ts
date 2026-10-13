import { describe, it, expect, vi } from 'vitest';
import { secp256k1 } from '@noble/curves/secp256k1';
import {
  createWalletClient,
  custom,
  keccak256,
  parseTransaction,
  recoverAddress,
  serializeTransaction,
} from 'viem';
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

import { kmsToAccount } from '../../utils/aws-kms-signer/viem-kms-account';
import { delegateUser } from '../../eip7702-functions';

// Asserts a value is defined and returns it narrowed (avoids `!` assertions).
const assertDefined = <T>(value: T | undefined, message: string): T => {
  if (value === undefined) throw new Error(message);
  return value;
};

const TEST_PRIVATE_KEY = `0x${'42'.repeat(32)}` as const;
const referenceAccount = privateKeyToAccount(TEST_PRIVATE_KEY);
const privateKeyBytes = Buffer.from(TEST_PRIVATE_KEY.slice(2), 'hex');
const IMPLEMENTATION_ADDRESS = '0xa46ec3920ac5fc54f4ba33185a91ae250adf59b8' as const;

function fakeKmsPublicKeyDer(): Buffer {
  const point = Buffer.from(referenceAccount.publicKey.slice(2), 'hex');
  const prefixWithDecoyMarkerBytes = Buffer.from(
    '3056301006072a8648ce3d020106052b8104000a0342000400',
    'hex',
  );
  return Buffer.concat([prefixWithDecoyMarkerBytes, point]);
}

mockSend.mockImplementation(async (command: { input: { Message?: Uint8Array } }) => {
  if (!('Message' in command.input)) {
    return {
      PublicKey: fakeKmsPublicKeyDer(),
      KeySpec: 'ECC_SECG_P256K1',
      KeyUsage: 'SIGN_VERIFY',
      SigningAlgorithms: ['ECDSA_SHA_256'],
    };
  }
  const digest = command.input.Message as Uint8Array;
  const sig = secp256k1.sign(digest, privateKeyBytes, { lowS: true });
  return { Signature: Buffer.from(sig.toDERRawBytes()) };
});

const TEST_CHAIN = {
  id: 11155111,
  name: 'Sepolia (test)',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://localhost:0'] } },
};

describe('delegateUser with a KMS-backed WalletClient (self-pay)', () => {
  it('signs the EIP-7702 authorization through the real viem WalletClient.signAuthorization action', async () => {
    const account = await kmsToAccount({ keyId: 'test-key' });

    let capturedRawTx: `0x${string}` | undefined;
    const ownerSigner = createWalletClient({
      account,
      chain: TEST_CHAIN,
      transport: custom({
        async request({ method, params }) {
          if (method === 'eth_getTransactionCount') return '0x3';
          if (method === 'eth_sendRawTransaction') {
            capturedRawTx = (params as [`0x${string}`])[0];
            return '0xfaketxhash';
          }
          throw new Error(`unexpected RPC call in test: ${method}`);
        },
      }),
    });

    // This is exactly what admin.ts's delegateUser does for the self-pay path:
    // the owner signs its own EIP-7702 authorization (no live tx submission needed
    // for this assertion — we only exercise signAuthorization here).
    const authorization = await ownerSigner.signAuthorization({
      account: ownerSigner.account,
      contractAddress: IMPLEMENTATION_ADDRESS,
      executor: 'self',
    });

    const recovered = await recoverAddress({
      hash: hashAuthorization(authorization),
      signature: {
        r: authorization.r,
        s: authorization.s,
        yParity: assertDefined(authorization.yParity, 'expected yParity on signed authorization'),
      },
    });
    expect(recovered).toBe(account.address);
    expect(capturedRawTx).toBeUndefined(); // sanity: this test never sent a tx
  });

  it('round-trips through the actual exported delegateUser(), producing a raw tx signed by the KMS account', async () => {
    const account = await kmsToAccount({ keyId: 'test-key' });

    let capturedRawTx: `0x${string}` | undefined;
    const ownerSigner = createWalletClient({
      account,
      chain: TEST_CHAIN,
      transport: custom({
        async request({ method, params }) {
          if (method === 'eth_getTransactionCount') return '0x3';
          if (method === 'eth_estimateGas') return '0x5208';
          if (method === 'eth_maxPriorityFeePerGas') return '0x3b9aca00';
          if (method === 'eth_getBlockByNumber')
            return { baseFeePerGas: '0x3b9aca00', number: '0x1', hash: `0x${'ab'.repeat(32)}` };
          if (method === 'eth_sendRawTransaction') {
            capturedRawTx = (params as [`0x${string}`])[0];
            return '0xfaketxhash';
          }
          throw new Error(`unexpected RPC call in test: ${method}`);
        },
      }),
    });

    const txHash = await delegateUser(IMPLEMENTATION_ADDRESS, ownerSigner);

    expect(txHash).toBe('0xfaketxhash');
    const rawTx = assertDefined(capturedRawTx, 'expected delegateUser to submit a raw transaction');
    const parsed = parseTransaction(rawTx);
    expect(parsed.type).toBe('eip7702');
    expect(parsed.authorizationList?.[0]?.address).toBe(IMPLEMENTATION_ADDRESS);

    // Re-derive the unsigned tx viem actually signed (whatever gas/fee values it
    // computed internally) by stripping the signature back off the parsed tx, then
    // confirm the KMS signature recovers to the account that submitted it.
    const { r, s, yParity, ...unsignedTx } = parsed;
    const recovered = await recoverAddress({
      hash: keccak256(
        serializeTransaction(unsignedTx as Parameters<typeof serializeTransaction>[0]),
      ),
      signature: {
        r: assertDefined(r, 'expected r on parsed tx'),
        s: assertDefined(s, 'expected s on parsed tx'),
        yParity: assertDefined(yParity, 'expected yParity on parsed tx'),
      },
    });
    expect(recovered).toBe(account.address);
  });
});
