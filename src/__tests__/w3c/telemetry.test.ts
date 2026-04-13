import { describe, it } from 'vitest';
import { VerificationType } from '@trustvc/w3c-issuer';
import { signW3C, verifyW3CSignature } from '../..';
import { W3C_VERIFIABLE_DOCUMENT } from '../fixtures/fixtures';
import { useTelemetryTestHarness } from '../utils/telemetry';

describe('W3C telemetry did_method extraction', () => {
  const telemetry = useTelemetryTestHarness();

  it.each([
    {
      name: 'emits did:web when signing with a string issuer',
      runOperation: async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { proof, id, ...documentWithoutProof } = W3C_VERIFIABLE_DOCUMENT;
        await signW3C(
          documentWithoutProof,
          {
            id: 'did:web:trustvc.github.io:did:1#keys-1',
            controller: 'did:web:trustvc.github.io:did:1',
            type: VerificationType.Bls12381G2Key2020,
            publicKeyBase58:
              'oRfEeWFresvhRtXCkihZbxyoi2JER7gHTJ5psXhHsdCoU1MttRMi3Yp9b9fpjmKh7bMgfWKLESiK2YovRd8KGzJsGuamoAXfqDDVhckxuc9nmsJ84skCSTijKeU4pfAcxeJ',
            privateKeyBase58: '4LDU56PUhA9ZEutnR1qCWQnUhtLtpLu2EHSq4h1o7vtF',
          },
          'BbsBlsSignature2020',
        );
      },
      expectedDidMethod: 'did:web',
    },
    {
      name: 'emits did:web when verifying with a string issuer',
      runOperation: () => verifyW3CSignature(W3C_VERIFIABLE_DOCUMENT),
      expectedDidMethod: 'did:web',
    },
    {
      name: 'emits did:key when verifying with an object issuer',
      runOperation: () =>
        verifyW3CSignature({
          ...W3C_VERIFIABLE_DOCUMENT,
          issuer: {
            id: 'did:key:z6MkrHKzgsahxBLyNAbLQyB1pcWNYC9GmywiWPgkrvntAZcj',
            name: 'Test',
          },
        }),
      expectedDidMethod: 'did:key',
    },
  ])('$name', async ({ runOperation, expectedDidMethod }) => {
    await telemetry.assertDidMethod(runOperation, expectedDidMethod);
  });
});
