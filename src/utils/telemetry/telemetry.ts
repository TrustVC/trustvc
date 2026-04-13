/// <reference types="node" />
import { version as SDK_VERSION } from '../../../package.json';
import { TelemetryInput } from './types';

const TELEMETRY_ENDPOINT =
  (typeof process !== 'undefined' && process.env?.TRUSTVC_TELEMETRY_URL) ||
  'https://api.trustvc.io/api/v1/telemetry';

const STORAGE_KEY = 'trustvc_instance_id';

let _telemetryOverride: boolean | null = null;
let _instanceId: string | null = null;

export function disableTelemetry(): void {
  _telemetryOverride = false;
}

export function enableTelemetry(): void {
  _telemetryOverride = true;
}

function isTelemetryEnabled(): boolean {
  if (_telemetryOverride !== null) return _telemetryOverride;
  if (typeof process !== 'undefined' && process.env?.TRUSTVC_TELEMETRY_DISABLED) {
    const val = process.env.TRUSTVC_TELEMETRY_DISABLED.toLowerCase().trim();
    if (val === '1' || val === 'true' || val === 'yes') return false;
  }
  return true;
}

export function extractDidMethod(did: string): string {
  const match = did.match(/^(did:[a-z0-9]+)/);
  return match ? match[1] : 'unknown';
}

async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function generateInstanceId(): Promise<string> {
  const raw = globalThis.crypto.randomUUID();
  return sha256Hex(raw);
}

async function loadNodeInstanceId(): Promise<string | null> {
  try {
    const fs = await import('node:fs');
    const os = await import('node:os');
    const path = await import('node:path');
    const dir = path.join(os.homedir(), '.trustvc');
    const filePath = path.join(dir, 'instance-id');
    try {
      const stored = fs.readFileSync(filePath, 'utf-8').trim();
      if (/^[a-f0-9]{64}$/.test(stored)) return stored;
    } catch {
      // file doesn't exist yet
    }
    const id = await generateInstanceId();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, id, 'utf-8');
    return id;
  } catch {
    return null;
  }
}

function loadBrowserInstanceId(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && /^[a-f0-9]{64}$/.test(stored)) return stored;
    return null;
  } catch {
    return null;
  }
}

async function saveBrowserInstanceId(): Promise<string | null> {
  try {
    const id = await generateInstanceId();
    localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return null;
  }
}

function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null
  );
}

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

async function getInstanceId(): Promise<string> {
  if (_instanceId) return _instanceId;

  if (isNodeEnvironment()) {
    const id = await loadNodeInstanceId();
    if (id) {
      _instanceId = id;
      return id;
    }
  }

  if (isBrowserEnvironment()) {
    const stored = loadBrowserInstanceId();
    if (stored) {
      _instanceId = stored;
      return stored;
    }
    const id = await saveBrowserInstanceId();
    if (id) {
      _instanceId = id;
      return id;
    }
  }

  // Fallback: per-session ID
  _instanceId = await generateInstanceId();
  return _instanceId;
}

export async function emitTelemetry(input: TelemetryInput): Promise<void> {
  try {
    if (!isTelemetryEnabled()) return;

    const instanceId = await getInstanceId();

    globalThis
      .fetch(TELEMETRY_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_type: input.action_type,
          document_format: input.document_format,
          sdk_version: SDK_VERSION,
          did_method: input.did_method,
          cryptosuite: input.cryptosuite,
          instance_id: instanceId,
        }),
        signal: AbortSignal.timeout(5000),
      })
      .catch(() => {});
  } catch {
    // Never throw from telemetry
  }
}

export function _resetForTesting(): void {
  _telemetryOverride = null;
  _instanceId = null;
}

export { isTelemetryEnabled, getInstanceId, SDK_VERSION };
