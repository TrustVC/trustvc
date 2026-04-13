import { afterEach, beforeEach, expect, vi } from 'vitest';
import {
  _resetForTesting,
  disableTelemetry,
  enableTelemetry,
} from '../../utils/telemetry/telemetry';

type FetchSpy = ReturnType<typeof vi.fn>;
type TelemetryPayload = Record<string, unknown> & {
  did_method?: string;
  cryptosuite?: string;
};

const TELEMETRY_FLUSH_DELAY_MS = 10;

export const readLastTelemetryPayload = (fetchSpy: FetchSpy): TelemetryPayload | undefined => {
  const call = fetchSpy.mock.calls.at(-1);
  const options = call?.[1] as RequestInit | undefined;

  if (!options || typeof options.body !== 'string') return undefined;
  return JSON.parse(options.body) as TelemetryPayload;
};

export const waitForTelemetryFlush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, TELEMETRY_FLUSH_DELAY_MS));
};

export const useTelemetryTestHarness = () => {
  let fetchSpy: FetchSpy;

  beforeEach(() => {
    _resetForTesting();
    enableTelemetry();
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(async () => {
    await waitForTelemetryFlush();
    disableTelemetry();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    _resetForTesting();
  });

  return {
    getFetchSpy: (): FetchSpy => fetchSpy,
    getLastPayload: (): TelemetryPayload | undefined => readLastTelemetryPayload(fetchSpy),
    getLastDidMethod: (): string | undefined => {
      const payload = readLastTelemetryPayload(fetchSpy);
      return typeof payload?.did_method === 'string' ? payload.did_method : undefined;
    },
    getLastCryptosuite: (): string | undefined => {
      const payload = readLastTelemetryPayload(fetchSpy);
      return typeof payload?.cryptosuite === 'string' ? payload.cryptosuite : undefined;
    },
    waitForTelemetry: waitForTelemetryFlush,
    assertDidMethod: async (
      runOperation: () => Promise<unknown>,
      expectedDidMethod: string,
    ): Promise<void> => {
      await runOperation();
      await waitForTelemetryFlush();
      expect(readLastTelemetryPayload(fetchSpy)?.did_method).toBe(expectedDidMethod);
    },
  };
};
