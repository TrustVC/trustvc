import { describe, it, expect } from 'vitest';
import { StatusRules } from '../../status/StatusRules';
import { Status } from '../../status/types';
import { HOLDER, OWNER } from './fixtures';

const baseTransition = {
  currentBeneficiary: OWNER,
  currentHolder: HOLDER,
  currentStatus: Status.Issued,
  signerAddress: HOLDER,
};

describe('StatusRules — status transitions (accept / reject / discharge)', () => {
  it('accept succeeds for holder at Issued with diverged roles', () => {
    expect(() => StatusRules.assertAccept(baseTransition)).not.toThrow();
  });

  it('accept fails for non-holder', () => {
    expect(() => StatusRules.assertAccept({ ...baseTransition, signerAddress: OWNER })).toThrow(
      'Only the current holder can accept',
    );
  });

  it('accept fails when owner equals holder', () => {
    expect(() =>
      StatusRules.assertAccept({
        ...baseTransition,
        currentBeneficiary: OWNER,
        currentHolder: OWNER,
        signerAddress: OWNER,
      }),
    ).toThrow('Owner and holder must be different addresses');
  });

  it('accept fails from Accepted, Rejected, and Discharged', () => {
    for (const status of [Status.Accepted, Status.Rejected, Status.Discharged]) {
      expect(() => StatusRules.assertAccept({ ...baseTransition, currentStatus: status })).toThrow(
        'cannot be accepted or rejected again',
      );
    }
  });

  it('reject succeeds for holder at Issued', () => {
    expect(() => StatusRules.assertReject(baseTransition)).not.toThrow();
  });

  it('reject fails from Discharged', () => {
    expect(() =>
      StatusRules.assertReject({ ...baseTransition, currentStatus: Status.Discharged }),
    ).toThrow('cannot be accepted or rejected again');
  });

  it('discharge succeeds for beneficiary at Accepted', () => {
    expect(() =>
      StatusRules.assertDischarge({
        ...baseTransition,
        currentStatus: Status.Accepted,
        signerAddress: OWNER,
      }),
    ).not.toThrow();
  });

  it('discharge fails for non-beneficiary', () => {
    expect(() =>
      StatusRules.assertDischarge({
        ...baseTransition,
        currentStatus: Status.Accepted,
        signerAddress: HOLDER,
      }),
    ).toThrow('Only the current beneficiary (owner) can discharge');
  });

  it('discharge fails from Issued', () => {
    expect(() => StatusRules.assertDischarge({ ...baseTransition, signerAddress: OWNER })).toThrow(
      'has not been accepted yet',
    );
  });

  it('discharge fails from Rejected with reissue hint', () => {
    expect(() =>
      StatusRules.assertDischarge({
        ...baseTransition,
        currentStatus: Status.Rejected,
        signerAddress: OWNER,
      }),
    ).toThrow('was rejected and can never be discharged');
  });

  it('discharge fails when already Discharged', () => {
    expect(() =>
      StatusRules.assertDischarge({
        ...baseTransition,
        currentStatus: Status.Discharged,
        signerAddress: OWNER,
      }),
    ).toThrow('already been discharged');
  });
});
