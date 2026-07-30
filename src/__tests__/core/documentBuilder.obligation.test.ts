import { describe, it, expect, beforeEach } from 'vitest';
import { TR_CONTEXT_URL } from '@trustvc/w3c-context';
import { DocumentBuilder } from '../../core/documentBuilder';

describe('DocumentBuilder (obligation records)', () => {
  let documentBuilder: DocumentBuilder;

  beforeEach(() => {
    documentBuilder = new DocumentBuilder({
      '@context': 'https://trustvc.io/context/bill-of-lading.json',
    }).credentialSubject({ type: ['BillOfLading'] });
  });

  it('should configure obligationRecords correctly', () => {
    documentBuilder.credentialStatus({
      chain: 'amoy',
      chainId: 80002,
      obligationRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
      rpcProviderUrl: 'https://rpc-amoy.polygon.technology',
    });
    expect(documentBuilder).toBeDefined();
    expect(documentBuilder.toString()).toContain(TR_CONTEXT_URL);
  });
});
