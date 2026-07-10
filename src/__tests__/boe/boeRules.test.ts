import { describe, it, expect } from 'vitest';
import { BoeRules } from '../../boe/BoeRules';
import { BillOfExchangeStatus } from '../../boe/types';
import { HOLDER, OWNER } from './fixtures';

const baseTransition = {
  currentBeneficiary: OWNER,
  currentHolder: HOLDER,
  currentStatus: BillOfExchangeStatus.Issued,
  signerAddress: HOLDER,
};

describe('BoeRules — BOE status transitions (accept / reject / discharge)', () => {
  it('accept succeeds for holder at Issued with diverged roles', () => {
    expect(() => BoeRules.assertAccept(baseTransition)).not.toThrow();
  });

  it('accept fails for non-holder', () => {
    expect(() => BoeRules.assertAccept({ ...baseTransition, signerAddress: OWNER })).toThrow(
      'Only the current holder can accept',
    );
  });

  it('accept fails when owner equals holder', () => {
    expect(() =>
      BoeRules.assertAccept({
        ...baseTransition,
        currentBeneficiary: OWNER,
        currentHolder: OWNER,
        signerAddress: OWNER,
      }),
    ).toThrow('Owner and holder must be different addresses');
  });

  it('accept fails from Accepted, Rejected, and Discharged', () => {
    for (const status of [
      BillOfExchangeStatus.Accepted,
      BillOfExchangeStatus.Rejected,
      BillOfExchangeStatus.Discharged,
    ]) {
      expect(() => BoeRules.assertAccept({ ...baseTransition, currentStatus: status })).toThrow(
        'cannot be accepted or rejected again',
      );
    }
  });

  it('reject succeeds for holder at Issued', () => {
    expect(() => BoeRules.assertReject(baseTransition)).not.toThrow();
  });

  it('reject fails from Discharged', () => {
    expect(() =>
      BoeRules.assertReject({ ...baseTransition, currentStatus: BillOfExchangeStatus.Discharged }),
    ).toThrow('cannot be accepted or rejected again');
  });

  it('discharge succeeds for beneficiary at Accepted', () => {
    expect(() =>
      BoeRules.assertDischarge({
        ...baseTransition,
        currentStatus: BillOfExchangeStatus.Accepted,
        signerAddress: OWNER,
      }),
    ).not.toThrow();
  });

  it('discharge fails for non-beneficiary', () => {
    expect(() =>
      BoeRules.assertDischarge({
        ...baseTransition,
        currentStatus: BillOfExchangeStatus.Accepted,
        signerAddress: HOLDER,
      }),
    ).toThrow('Only the current beneficiary (owner) can discharge');
  });

  it('discharge fails from Issued', () => {
    expect(() => BoeRules.assertDischarge({ ...baseTransition, signerAddress: OWNER })).toThrow(
      'has not been accepted yet',
    );
  });

  it('discharge fails from Rejected with reissue hint', () => {
    expect(() =>
      BoeRules.assertDischarge({
        ...baseTransition,
        currentStatus: BillOfExchangeStatus.Rejected,
        signerAddress: OWNER,
      }),
    ).toThrow('was rejected and can never be discharged');
  });

  it('discharge fails when already Discharged', () => {
    expect(() =>
      BoeRules.assertDischarge({
        ...baseTransition,
        currentStatus: BillOfExchangeStatus.Discharged,
        signerAddress: OWNER,
      }),
    ).toThrow('already been discharged');
  });
});
