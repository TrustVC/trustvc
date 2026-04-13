import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signOA, verifyOASignature } from '../..';
import {
  _resetForTesting,
  enableTelemetry,
  disableTelemetry,
} from '../../utils/telemetry/telemetry';
import {
  SAMPLE_SIGNING_KEYS,
  SIGNED_WRAPPED_DOCUMENT_DID_V2,
  SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3,
  WRAPPED_DOCUMENT_DID_V2,
  WRAPPED_DOCUMENT_DNS_DID_V3,
  WRAPPED_DOCUMENT_DNS_TXT_V2,
} from '../fixtures/fixtures';

describe('OA telemetry did_method extraction', () => {
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
    // Let any fire-and-forget fetch resolve before teardown
    await new Promise((r) => setTimeout(r, 10));
    disableTelemetry();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    _resetForTesting();
  });

  describe('signOA', () => {
    it('should emit did_method=DID for V2 DID-issuer document', async () => {
      await signOA(WRAPPED_DOCUMENT_DID_V2, SAMPLE_SIGNING_KEYS);
      await new Promise((r) => setTimeout(r, 10));
      expect(getLastDidMethod()).toBe('DID');
    });

    it('should emit did_method=DNS-DID for V3 DNS-DID document', async () => {
      await signOA(WRAPPED_DOCUMENT_DNS_DID_V3, SAMPLE_SIGNING_KEYS);
      await new Promise((r) => setTimeout(r, 10));
      expect(getLastDidMethod()).toBe('DNS-DID');
    });
  });

  describe('verifyOASignature', () => {
    it('should emit did_method=DNS-TXT for V2 tokenRegistry (DNS-TXT) document', async () => {
      await verifyOASignature(WRAPPED_DOCUMENT_DNS_TXT_V2);
      await new Promise((r) => setTimeout(r, 10));
      expect(getLastDidMethod()).toBe('DNS-TXT');
    });

    it('should emit did_method=DID for V2 signed DID-issuer document', async () => {
      await verifyOASignature(SIGNED_WRAPPED_DOCUMENT_DID_V2);
      await new Promise((r) => setTimeout(r, 10));
      expect(getLastDidMethod()).toBe('DID');
    });

    it('should emit did_method=DNS-DID for V3 signed DNS-DID document', async () => {
      await verifyOASignature(SIGNED_WRAPPED_DOCUMENT_DNS_DID_V3);
      await new Promise((r) => setTimeout(r, 10));
      expect(getLastDidMethod()).toBe('DNS-DID');
    });
  });
});
