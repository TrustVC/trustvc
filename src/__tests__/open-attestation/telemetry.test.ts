import { describe, it } from 'vitest';
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

describe('OA telemetry did_method extraction', () => {
  const telemetry = useTelemetryTestHarness();

  it.each([
    {
      name: 'emits DID for V2 DID-issuer document signing',
      runOperation: () => signOA(WRAPPED_DOCUMENT_DID_V2, SAMPLE_SIGNING_KEYS),
      expectedDidMethod: 'DID',
    },
    {
      name: 'emits DNS-DID for V3 DNS-DID document signing',
      runOperation: () => signOA(WRAPPED_DOCUMENT_DNS_DID_V3, SAMPLE_SIGNING_KEYS),
      expectedDidMethod: 'DNS-DID',
    },
    {
      name: 'emits DNS-TXT for V2 tokenRegistry document verification',
      runOperation: () => verifyOASignature(WRAPPED_DOCUMENT_DNS_TXT_V2),
      expectedDidMethod: 'DNS-TXT',
    },
    {
      name: 'emits DID for V2 signed DID-issuer document verification',
      runOperation: () => verifyOASignature(SIGNED_WRAPPED_DOCUMENT_DID_V2),
      expectedDidMethod: 'DID',
    },
    {
      name: 'emits DNS-DID for V3 signed DNS-DID document verification',
      runOperation: () => verifyOASignature(SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3),
      expectedDidMethod: 'DNS-DID',
    },
  ])('$name', async ({ runOperation, expectedDidMethod }) => {
    await telemetry.assertDidMethod(runOperation, expectedDidMethod);
  });
});
