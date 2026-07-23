import { describe, expect, it } from 'vitest';
import {
  getObligationRegistryAddress,
  getTokenRegistryAddress,
  isObligationRecord,
  isTransferableRecord,
} from '../../../utils';
import {
  W3C_TRANSFERABLE_RECORD,
  WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3,
} from '../../fixtures/fixtures';

const W3C_OBLIGATION_RECORD = {
  ...W3C_TRANSFERABLE_RECORD,
  credentialStatus: {
    ...W3C_TRANSFERABLE_RECORD.credentialStatus,
    tokenRegistry: undefined,
    obligationRegistry: '0x71D28767662cB233F887aD2Bb65d048d760bA694',
  },
} as any;

describe.concurrent('documents (obligation records)', () => {
  describe.concurrent('isTransferableRecord', () => {
    it('isTransferableRecord - INVALID W3C VC Obligation Record Document', () => {
      const transferableRecord = isTransferableRecord(W3C_OBLIGATION_RECORD);
      expect(transferableRecord).toBe(false);
    });
  });

  describe.concurrent('isObligationRecord', () => {
    it('isObligationRecord - VALID W3C VC Obligation Record Document', () => {
      const obligationRecord = isObligationRecord(W3C_OBLIGATION_RECORD);
      expect(obligationRecord).toBe(true);
    });

    it('isObligationRecord - INVALID W3C VC Transferable Record Document', () => {
      const obligationRecord = isObligationRecord(W3C_TRANSFERABLE_RECORD);
      expect(obligationRecord).toBe(false);
    });

    it('isObligationRecord - INVALID OA document', () => {
      const obligationRecord = isObligationRecord(WRAPPED_DOCUMENT_DID_TOKEN_REGISTRY_V3 as any);
      expect(obligationRecord).toBe(false);
    });
  });

  describe.concurrent('getTokenRegistryAddress', () => {
    it('getTokenRegistryAddress - Obligation document returns undefined', () => {
      const tokenRegistryAddress = getTokenRegistryAddress(W3C_OBLIGATION_RECORD);
      expect(tokenRegistryAddress).toBe(undefined);
    });
  });

  describe.concurrent('getObligationRegistryAddress', () => {
    it('getObligationRegistryAddress - VALID W3C VC Obligation Record Document', () => {
      const obligationRegistryAddress = getObligationRegistryAddress(W3C_OBLIGATION_RECORD);
      expect(obligationRegistryAddress).toBe('0x71D28767662cB233F887aD2Bb65d048d760bA694');
    });

    it('getObligationRegistryAddress - Transferable Record returns undefined', () => {
      const obligationRegistryAddress = getObligationRegistryAddress(W3C_TRANSFERABLE_RECORD);
      expect(obligationRegistryAddress).toBe(undefined);
    });
  });
});
