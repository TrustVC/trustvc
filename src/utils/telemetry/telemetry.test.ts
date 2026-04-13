import { afterEach, beforeEach, vi } from 'vitest';
import {
  emitTelemetry,
  disableTelemetry,
  enableTelemetry,
  extractDidMethod,
  _resetForTesting,
  isTelemetryEnabled,
  getInstanceId,
  SDK_VERSION,
} from './telemetry';
import type { TelemetryInput } from './types';
import { readLastTelemetryPayload, waitForTelemetryFlush } from '../../__tests__/utils/telemetry';

describe('telemetry', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  const baseTelemetryInput: TelemetryInput = {
    action_type: 'issuance',
    document_format: 'w3c_vc',
    did_method: 'did:web',
    cryptosuite: 'ecdsa-sd-2023',
  };

  const getLastRequest = (): {
    url: string;
    options: RequestInit;
    body: Record<string, unknown>;
  } => {
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = readLastTelemetryPayload(fetchSpy);
    expect(body).toBeDefined();

    return {
      url,
      options,
      body: body as Record<string, unknown>,
    };
  };

  const emitBaseTelemetry = async (overrides: Partial<TelemetryInput> = {}): Promise<void> => {
    await emitTelemetry({
      ...baseTelemetryInput,
      ...overrides,
    });
    await waitForTelemetryFlush();
  };

  beforeEach(() => {
    _resetForTesting();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
    vi.stubEnv('TRUSTVC_TELEMETRY_DISABLED', '');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    _resetForTesting();
  });

  describe('extractDidMethod', () => {
    [
      {
        name: 'extracts did:web',
        input: 'did:web:trustvc.github.io:did:1',
        expected: 'did:web',
      },
      {
        name: 'extracts did:ethr',
        input: 'did:ethr:0xB26B4941941C51a4885E5B7D3A1B861E54405f90#controller',
        expected: 'did:ethr',
      },
      {
        name: 'extracts did:key',
        input: 'did:key:z6MkrHKzgsahxBLyNAbLQyB1pcWNYC9GmywiWPgkrvntAZcj',
        expected: 'did:key',
      },
      {
        name: 'extracts a DID method from a verification method with a fragment',
        input: 'did:web:trustvc.github.io:did:1#multikey-1',
        expected: 'did:web',
      },
      {
        name: 'returns unknown for an empty string',
        input: '',
        expected: 'unknown',
      },
      {
        name: 'returns unknown for a non-DID string',
        input: 'https://example.com',
        expected: 'unknown',
      },
      {
        name: 'returns unknown for a malformed DID',
        input: 'did:',
        expected: 'unknown',
      },
    ].forEach(({ name, input, expected }) => {
      it(name, () => {
        expect(extractDidMethod(input)).toBe(expected);
      });
    });
  });

  describe('isTelemetryEnabled', () => {
    it('should return true by default when env var is not set', () => {
      expect(isTelemetryEnabled()).toBe(true);
    });

    ['1', 'true', 'yes', 'YES'].forEach((value) => {
      it(`should return false when TRUSTVC_TELEMETRY_DISABLED=${value}`, () => {
        vi.stubEnv('TRUSTVC_TELEMETRY_DISABLED', value);
        expect(isTelemetryEnabled()).toBe(false);
      });
    });

    it('should return true when TRUSTVC_TELEMETRY_DISABLED=0', () => {
      vi.stubEnv('TRUSTVC_TELEMETRY_DISABLED', '0');
      expect(isTelemetryEnabled()).toBe(true);
    });

    it('should respect disableTelemetry() over env var', () => {
      vi.stubEnv('TRUSTVC_TELEMETRY_DISABLED', '');
      disableTelemetry();
      expect(isTelemetryEnabled()).toBe(false);
    });

    it('should respect enableTelemetry() over env var', () => {
      vi.stubEnv('TRUSTVC_TELEMETRY_DISABLED', '1');
      enableTelemetry();
      expect(isTelemetryEnabled()).toBe(true);
    });
  });

  describe('getInstanceId', () => {
    it('should return a 64-char hex string', async () => {
      const id = await getInstanceId();
      expect(id).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should return the same ID on subsequent calls', async () => {
      const id1 = await getInstanceId();
      const id2 = await getInstanceId();
      expect(id1).toBe(id2);
    });
  });

  describe('SDK_VERSION', () => {
    it('should be a valid semver string', () => {
      expect(SDK_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('emitTelemetry', () => {
    it('should call fetch with correct payload when enabled', async () => {
      enableTelemetry();
      await emitBaseTelemetry();

      const { url, options, body } = getLastRequest();
      expect(url).toContain('/api/v1/telemetry');
      expect(options.method).toBe('POST');
      expect(options.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(body.action_type).toBe('issuance');
      expect(body.document_format).toBe('w3c_vc');
      expect(body.sdk_version).toMatch(/^\d+\.\d+\.\d+$/);
      expect(body.did_method).toBe('did:web');
      expect(body.cryptosuite).toBe('ecdsa-sd-2023');
      expect(body.instance_id).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should not call fetch when telemetry is disabled', async () => {
      disableTelemetry();
      await emitBaseTelemetry();
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not call fetch when env var disables telemetry', async () => {
      vi.stubEnv('TRUSTVC_TELEMETRY_DISABLED', '1');
      await emitBaseTelemetry({
        action_type: 'verification',
        document_format: 'oa',
        did_method: 'did:ethr',
        cryptosuite: 'Secp256k1VerificationKey2018',
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('should not throw when fetch fails', async () => {
      enableTelemetry();
      fetchSpy.mockRejectedValue(new Error('Network error'));

      await expect(emitBaseTelemetry()).resolves.toBeUndefined();
    });

    it('should not throw when fetch is undefined', async () => {
      enableTelemetry();
      vi.stubGlobal('fetch', undefined);

      await expect(emitBaseTelemetry()).resolves.toBeUndefined();
    });
  });
});
