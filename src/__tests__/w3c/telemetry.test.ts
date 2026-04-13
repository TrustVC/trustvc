import { signW3C, verifyW3CSignature } from '../..';
import { W3C_VERIFIABLE_DOCUMENT } from '../fixtures/fixtures';
import { TEST_BBS2020_KEY_PAIR } from '../fixtures/keys';
import { useTelemetryTestHarness } from '../utils/telemetry';

describe('W3C telemetry extraction', () => {
  const telemetry = useTelemetryTestHarness();

  [
    {
      name: 'emits did:web when signing with a string issuer',
      runOperation: async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { proof, id, ...documentWithoutProof } = W3C_VERIFIABLE_DOCUMENT;
        await signW3C(documentWithoutProof, TEST_BBS2020_KEY_PAIR, 'BbsBlsSignature2020');
      },
      expectedDidMethod: 'did:web',
      expectedCryptosuite: 'BbsBlsSignature2020',
    },
    {
      name: 'emits did:web when verifying with a string issuer',
      runOperation: () => verifyW3CSignature(W3C_VERIFIABLE_DOCUMENT),
      expectedDidMethod: 'did:web',
      expectedCryptosuite: 'BbsBlsSignature2020',
    },
    {
      name: 'emits did:key when verifying with an object issuer',
      runOperation: () =>
        verifyW3CSignature({
          ...W3C_VERIFIABLE_DOCUMENT,
          issuer: {
            id: 'did:key:fake',
            name: 'Test',
          },
        }),
      expectedDidMethod: 'did:key',
      expectedCryptosuite: 'BbsBlsSignature2020',
    },
  ].forEach(({ name, runOperation, expectedDidMethod, expectedCryptosuite }) => {
    it(name, async () => {
      await telemetry.assertDidMethod(runOperation, expectedDidMethod);
      expect(telemetry.getLastCryptosuite()).toBe(expectedCryptosuite);
    });
  });
});
