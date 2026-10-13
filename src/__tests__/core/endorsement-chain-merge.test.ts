import { describe, expect, it } from 'vitest';
import { mergeTransfersV5 } from '../../core/endorsement-chain/helpers';
import { TransferBaseEvent } from '../../core/endorsement-chain/types';

const TX = '0xdischarge';
const OWNER = '0xc86C511D5500A9Ff7f0A7d950412cdDEf7DD7dDB';
const HOLDER = '0x3ccf0634fB72D6b2204FbE409D78284428b2cA07';

const event = (
  partial: Partial<TransferBaseEvent> & Pick<TransferBaseEvent, 'type'>,
): TransferBaseEvent => ({
  transactionHash: TX,
  transactionIndex: 0,
  blockNumber: 1,
  ...partial,
});

describe('mergeTransfersV5 obligation status vs shred', () => {
  it('keeps STATUS_DISCHARGED when discharge auto-shreds in the same tx', () => {
    const merged = mergeTransfersV5([
      event({
        type: 'STATUS_DISCHARGED',
        owner: OWNER,
        remark: '0xabcdef',
      }),
      event({
        type: 'TRANSFER_BENEFICIARY',
        owner: '0x0000000000000000000000000000000000000000',
      }),
      event({
        type: 'TRANSFER_HOLDER',
        holder: '0x0000000000000000000000000000000000000000',
      }),
      event({
        type: 'RETURN_TO_ISSUER_ACCEPTED',
        owner: OWNER,
        holder: HOLDER,
        remark: '0xabcdef',
        terminationReason: 'Discharged',
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe('STATUS_DISCHARGED');
    expect(merged[0].owner).toBe(OWNER);
    expect(merged[0].holder).toBe(HOLDER);
    expect(merged[0].terminationReason).toBe('Discharged');
  });

  it('keeps STATUS_REJECTED when reject auto-shreds in the same tx', () => {
    const merged = mergeTransfersV5([
      event({
        type: 'STATUS_REJECTED',
        holder: HOLDER,
        remark: '0x11',
      }),
      event({
        type: 'RETURN_TO_ISSUER_ACCEPTED',
        owner: OWNER,
        holder: HOLDER,
        remark: '0x11',
        terminationReason: 'Rejected',
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe('STATUS_REJECTED');
    expect(merged[0].owner).toBe(OWNER);
    expect(merged[0].holder).toBe(HOLDER);
    expect(merged[0].terminationReason).toBe('Rejected');
  });

  it('keeps STATUS_ACCEPTED (accept does not shred)', () => {
    const merged = mergeTransfersV5([
      event({
        type: 'STATUS_ACCEPTED',
        holder: HOLDER,
        remark: '0x22',
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe('STATUS_ACCEPTED');
  });

  it('keeps RETURN_TO_ISSUER_ACCEPTED for classic ETR shred with no status event', () => {
    const merged = mergeTransfersV5([
      event({
        type: 'TRANSFER_BENEFICIARY',
        owner: '0x0000000000000000000000000000000000000000',
      }),
      event({
        type: 'TRANSFER_HOLDER',
        holder: '0x0000000000000000000000000000000000000000',
      }),
      event({
        type: 'RETURN_TO_ISSUER_ACCEPTED',
        remark: '0x33',
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe('RETURN_TO_ISSUER_ACCEPTED');
  });

  it('keeps RETURN_TO_ISSUER_ACCEPTED for obligation shred after return-to-issuer', () => {
    const merged = mergeTransfersV5([
      event({
        type: 'RETURN_TO_ISSUER_ACCEPTED',
        owner: OWNER,
        holder: HOLDER,
        terminationReason: 'ReturnToIssuer',
        remark: '0x44',
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe('RETURN_TO_ISSUER_ACCEPTED');
    expect(merged[0].terminationReason).toBe('ReturnToIssuer');
  });

  it('still prefers INITIAL over STATUS_INITIALIZED on mint', () => {
    const merged = mergeTransfersV5([
      event({
        type: 'STATUS_INITIALIZED',
      }),
      event({
        type: 'INITIAL',
        owner: OWNER,
        holder: HOLDER,
        remark: '0x55',
      }),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0].type).toBe('INITIAL');
    expect(merged[0].owner).toBe(OWNER);
    expect(merged[0].holder).toBe(HOLDER);
  });
});
