export type ActionType = 'issuance' | 'verification';
export type DocumentFormat = 'w3c_vc' | 'oa';

export interface TelemetryEvent {
  action_type: ActionType;
  document_format: DocumentFormat;
  sdk_version: string;
  did_method: string;
  cryptosuite: string;
  instance_id: string;
}

export interface TelemetryInput {
  action_type: ActionType;
  document_format: DocumentFormat;
  did_method: string;
  cryptosuite: string;
}
