import type { PrivateKeyPair } from '@trustvc/w3c-issuer';
import { VerificationType } from '@trustvc/w3c-issuer';

// Dummy/test cryptographic BBS 2020 key pair for local development and CI only.
export const TEST_BBS2020_KEY_PAIR: PrivateKeyPair = {
  id: 'did:web:trustvc.github.io:did:1#keys-1',
  controller: 'did:web:trustvc.github.io:did:1',
  type: VerificationType.Bls12381G2Key2020,
  publicKeyBase58:
    'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ',
  privateKeyBase58: '4LDU56PUhA9ZEutnR1qCWQnUhtLtpLu2EHSq4h1o7vtF',
};
