import { signOA, verifyOASignature } from '../..';
import {
  SAMPLE_SIGNING_KEYS,
  SIGNED_WRAPPED_DOCUMENT_DID_V2,
  SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3,
  WRAPPED_DOCUMENT_DID_V2,
  WRAPPED_DOCUMENT_DNS_DID_V3,
  WRAPPED_DOCUMENT_DNS_TXT_V2,
} from '../fixtures/fixtures';
import { useTelemetryTestHarness } from '../utils/telemetry';
import { emitOATelemetry } from '../../open-attestation/telemetry';

describe('OA telemetry extraction', () => {
  const telemetry = useTelemetryTestHarness();

  [
    {
      name: 'emits DID for V2 DID-issuer document signing',
      runOperation: () => signOA(WRAPPED_DOCUMENT_DID_V2, SAMPLE_SIGNING_KEYS),
      expectedDidMethod: 'DID',
      expectedCryptosuite: 'SHA3MerkleProof',
    },
    {
      name: 'emits DNS-DID for V3 DNS-DID document signing',
      runOperation: () => signOA(WRAPPED_DOCUMENT_DNS_DID_V3, SAMPLE_SIGNING_KEYS),
      expectedDidMethod: 'DNS-DID',
      expectedCryptosuite: 'OpenAttestationMerkleProofSignature2018',
    },
    {
      name: 'emits DNS-TXT for V2 tokenRegistry document verification',
      runOperation: () => verifyOASignature(WRAPPED_DOCUMENT_DNS_TXT_V2),
      expectedDidMethod: 'DNS-TXT',
      expectedCryptosuite: 'SHA3MerkleProof',
    },
    {
      name: 'emits DID for V2 signed DID-issuer document verification',
      runOperation: () => verifyOASignature(SIGNED_WRAPPED_DOCUMENT_DID_V2),
      expectedDidMethod: 'DID',
      expectedCryptosuite: 'SHA3MerkleProof',
    },
    {
      name: 'emits DNS-DID for V3 signed DNS-DID document verification',
      runOperation: () => verifyOASignature(SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3),
      expectedDidMethod: 'DNS-DID',
      expectedCryptosuite: 'OpenAttestationMerkleProofSignature2018',
    },
  ].forEach(({ name, runOperation, expectedDidMethod, expectedCryptosuite }) => {
    it(name, async () => {
      await telemetry.assertDidMethod(runOperation, expectedDidMethod);
      expect(telemetry.getLastCryptosuite()).toBe(expectedCryptosuite);
    });
  });

  it('falls back to unknown telemetry fields for unsupported OA documents', async () => {
    emitOATelemetry('verification', {});
    await telemetry.waitForTelemetry();

    expect(telemetry.getLastDidMethod()).toBe('unknown');
    expect(telemetry.getLastCryptosuite()).toBe('unknown');
  });
});
