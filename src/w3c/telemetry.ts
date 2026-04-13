import { emitTelemetry, extractDidMethod, type ActionType } from '../utils/telemetry';

type CredentialWithTelemetryFields = {
  issuer?: string | { id?: string };
  proof?: { cryptosuite?: string; type?: string };
};

const getIssuerDid = (credential: CredentialWithTelemetryFields): string => {
  return typeof credential.issuer === 'string' ? credential.issuer : (credential.issuer?.id ?? '');
};

export const getProofCryptosuite = (proof: CredentialWithTelemetryFields['proof']): string =>
  proof?.cryptosuite ?? proof?.type ?? 'unknown';

export const emitW3CTelemetry = (
  actionType: ActionType,
  credential: CredentialWithTelemetryFields,
  cryptosuite: string,
  didSource?: string,
): void => {
  void emitTelemetry({
    action_type: actionType,
    document_format: 'w3c_vc',
    cryptosuite,
    did_method: extractDidMethod(didSource ?? getIssuerDid(credential)),
  });
};
