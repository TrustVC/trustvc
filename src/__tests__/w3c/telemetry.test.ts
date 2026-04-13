import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signW3C, verifyW3CSignature } from '../..';
import {
  _resetForTesting,
  enableTelemetry,
  disableTelemetry,
} from '../../utils/telemetry/telemetry';
import { VerificationType } from '@trustvc/w3c-issuer';
import { W3C_VERIFIABLE_DOCUMENT } from '../fixtures/fixtures';

describe('W3C telemetry did_method extraction', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  const getLastDidMethod = (): string | undefined => {
    const call = fetchSpy.mock.calls.at(-1);
    if (!call) return undefined;
    const body = JSON.parse(call[1].body);
    return body.did_method;
  };

  beforeEach(() => {
    _resetForTesting();
    enableTelemetry();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(async () => {
    await new Promise((r) => setTimeout(r, 10));
    disableTelemetry();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    _resetForTesting();
  });

  it('should emit did_method derived from credential.issuer on sign', async () => {
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
    await new Promise((r) => setTimeout(r, 10));
    expect(getLastDidMethod()).toBe('did:web');
  });

  it('should emit did_method derived from credential.issuer on verify (string form)', async () => {
    await verifyW3CSignature(W3C_VERIFIABLE_DOCUMENT);
    await new Promise((r) => setTimeout(r, 10));
    expect(getLastDidMethod()).toBe('did:web');
  });

  it('should emit did_method derived from credential.issuer.id on verify (object form)', async () => {
    const docWithObjectIssuer = {
      ...W3C_VERIFIABLE_DOCUMENT,
      issuer: { id: 'did:key:z6MkrHKzgsahxBLyNAbLQyB1pcWNYC9GmywiWPgkrvntAZcj', name: 'Test' },
    };
    await verifyW3CSignature(docWithObjectIssuer);
    await new Promise((r) => setTimeout(r, 10));
    expect(getLastDidMethod()).toBe('did:key');
  });
});
