import { GetPublicKeyCommand, KMSClient, KMSClientConfig, SignCommand } from '@aws-sdk/client-kms';
import { secp256k1 } from '@noble/curves/secp256k1';
import {
  Hex,
  LocalAccount,
  hashMessage,
  hashTypedData,
  keccak256,
  serializeSignature,
  serializeTransaction,
} from 'viem';
import { publicKeyToAddress, toAccount } from 'viem/accounts';
import { hashAuthorization } from 'viem/utils';

export type AwsKmsViemAccountConfig = KMSClientConfig & {
  /** The KMS key id or `alias/<name>` of an asymmetric ECC_SECG_P256K1 signing key. */
  keyId: string;
};

async function getKmsPublicKeyHex(kms: KMSClient, keyId: string): Promise<Hex> {
  const { PublicKey, KeySpec, KeyUsage, SigningAlgorithms } = await kms.send(
    new GetPublicKeyCommand({ KeyId: keyId }),
  );
  if (!PublicKey) throw new Error(`AWS KMS returned no PublicKey for key "${keyId}"`);
  if (KeySpec !== 'ECC_SECG_P256K1')
    throw new Error(`AWS KMS key "${keyId}" has KeySpec "${KeySpec}", expected "ECC_SECG_P256K1"`);
  if (KeyUsage !== 'SIGN_VERIFY')
    throw new Error(`AWS KMS key "${keyId}" has KeyUsage "${KeyUsage}", expected "SIGN_VERIFY"`);
  if (!SigningAlgorithms?.includes('ECDSA_SHA_256'))
    throw new Error(`AWS KMS key "${keyId}" does not support the ECDSA_SHA_256 signing algorithm`);

  // PublicKey is a DER-encoded SubjectPublicKeyInfo (RFC 5480): a SEQUENCE of
  // algorithm OIDs followed by a BIT STRING whose content is `0x00 || 0x04 || X || Y`
  // (the leading 0x00 is the BIT STRING's "unused bits" count). That BIT STRING is
  // the structure's final element, so the uncompressed point is reliably the last
  // 65 bytes of the DER blob — scanning for a 0x04 marker byte is NOT safe, since
  // the 64-byte X||Y point can itself contain that byte value.
  const der = Buffer.from(PublicKey);
  const UNCOMPRESSED_POINT_LENGTH = 65;
  return `0x${der.subarray(der.length - UNCOMPRESSED_POINT_LENGTH).toString('hex')}`;
}

async function kmsSignDigest(
  kms: KMSClient,
  keyId: string,
  hash: Hex,
  address: Hex,
): Promise<{ r: Hex; s: Hex; yParity: 0 | 1 }> {
  const digest = Buffer.from(hash.slice(2), 'hex');
  const { Signature } = await kms.send(
    new SignCommand({
      KeyId: keyId,
      Message: digest,
      MessageType: 'DIGEST',
      // 'ECDSA_SHA_256' is the algorithm KMS accepts for ECC_SECG_P256K1 keys.
      SigningAlgorithm: 'ECDSA_SHA_256',
    }),
  );
  if (!Signature) throw new Error(`AWS KMS Sign returned no Signature for key "${keyId}"`);

  let sig = secp256k1.Signature.fromDER(Buffer.from(Signature));
  // Ethereum requires low-S (EIP-2); KMS doesn't guarantee it.
  if (sig.hasHighS()) sig = sig.normalizeS();

  // KMS doesn't return a recovery id, so brute-force it against the known address.
  const digestBytes = Uint8Array.from(digest);
  for (const recovery of [0, 1] as const) {
    const point = sig.addRecoveryBit(recovery).recoverPublicKey(digestBytes);
    if (publicKeyToAddress(`0x${point.toHex(false)}`).toLowerCase() === address.toLowerCase()) {
      return {
        r: `0x${sig.r.toString(16).padStart(64, '0')}`,
        s: `0x${sig.s.toString(16).padStart(64, '0')}`,
        yParity: recovery,
      };
    }
  }
  throw new Error(
    `Could not recover a signature matching address ${address} from AWS KMS key "${keyId}"`,
  );
}

/**
 * Creates a viem `LocalAccount` backed by an AWS KMS asymmetric ECC_SECG_P256K1 key,
 * for use anywhere a `privateKeyToAccount(...)` account would otherwise be passed
 * (e.g. `createWalletClient({ account, ... })`).
 *
 * Only `signAuthorization` and `signTransaction` are exercised by this repo's
 * EIP-7702 gasless flow (src/eip7702-functions); `signMessage`/`signTypedData`
 * are implemented for interface completeness, not because the gasless flow uses them.
 * @param {AwsKmsViemAccountConfig} config - KMS key id plus any KMSClientConfig fields (region, credentials, ...).
 * @returns {Promise<LocalAccount>} A viem account whose address is derived from the KMS key's public key.
 */
export async function kmsToAccount(config: AwsKmsViemAccountConfig): Promise<LocalAccount> {
  const { keyId, ...kmsClientConfig } = config;
  const kms = new KMSClient(kmsClientConfig);
  const publicKey = await getKmsPublicKeyHex(kms, keyId);
  const address = publicKeyToAddress(publicKey);

  const account = toAccount({
    address,
    async signAuthorization(authorization) {
      const { r, s, yParity } = await kmsSignDigest(
        kms,
        keyId,
        hashAuthorization(authorization),
        address,
      );
      const { chainId, nonce } = authorization;
      const authorizedAddress = authorization.contractAddress ?? authorization.address;
      return { address: authorizedAddress, chainId, nonce, r, s, yParity };
    },
    async signTransaction(transaction, { serializer = serializeTransaction } = {}) {
      const hash = keccak256(await serializer(transaction));
      const { r, s, yParity } = await kmsSignDigest(kms, keyId, hash, address);
      return serializer(transaction, { r, s, yParity });
    },
    async signMessage({ message }) {
      const { r, s, yParity } = await kmsSignDigest(kms, keyId, hashMessage(message), address);
      return serializeSignature({ r, s, yParity });
    },
    async signTypedData(typedData) {
      const { r, s, yParity } = await kmsSignDigest(kms, keyId, hashTypedData(typedData), address);
      return serializeSignature({ r, s, yParity });
    },
  });

  return { ...account, publicKey, source: 'kms' } as LocalAccount;
}
