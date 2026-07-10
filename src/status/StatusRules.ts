import { Status, StatusLabel } from './types';

interface TransitionParams {
  currentBeneficiary: string;
  currentHolder: string;
  currentStatus: Status;
  signerAddress: string;
}

const sameAddress = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

// Business rules for the three dedicated status functions (accept, reject, discharge).
// Every check here is purely advisory, client-side validation — the contract enforces the
// on-chain-relevant subset of these independently. Nothing in this class talks to a contract;
// it only reasons about state its callers already fetched.
//
// The existing ETR functions (transferHolder, nominate, transferBeneficiary, transferOwners, the
// reject-transfer family, returnToIssuer) are untouched by this class — they behave exactly as
// they did before the status lifecycle existed.
export class StatusRules {
  private static assertTransition(
    action: 'accept' | 'reject' | 'discharge',
    requiredCallerRole: 'holder' | 'beneficiary',
    requiredStatus: Status,
    { currentBeneficiary, currentHolder, currentStatus, signerAddress }: TransitionParams,
  ): void {
    const expectedCaller = requiredCallerRole === 'holder' ? currentHolder : currentBeneficiary;
    if (!sameAddress(signerAddress, expectedCaller)) {
      throw new Error(
        requiredCallerRole === 'holder'
          ? `Only the current holder can ${action} this TitleEscrow`
          : `Only the current beneficiary (owner) can ${action} this TitleEscrow`,
      );
    }

    if (sameAddress(currentBeneficiary, currentHolder)) {
      throw new Error(
        'Owner and holder must be different addresses before this TitleEscrow can be accepted, rejected, or discharged',
      );
    }

    if (currentStatus === requiredStatus) return;

    if (action === 'discharge') {
      if (currentStatus === Status.Rejected) {
        throw new Error(
          'This TitleEscrow was rejected and can never be discharged — surrender it (returnToIssuer) and reissue a new one instead.',
        );
      }
      if (currentStatus === Status.Issued) {
        throw new Error(
          'This TitleEscrow has not been accepted yet — only an Accepted escrow can be discharged.',
        );
      }
      throw new Error('This TitleEscrow has already been discharged.');
    }

    throw new Error(
      `This TitleEscrow has already been ${StatusLabel[currentStatus]} and cannot be accepted or rejected again.`,
    );
  }

  // accept: holder-only, requires status Issued.
  static assertAccept(params: TransitionParams): void {
    StatusRules.assertTransition('accept', 'holder', Status.Issued, params);
  }

  // reject: holder-only, requires status Issued.
  static assertReject(params: TransitionParams): void {
    StatusRules.assertTransition('reject', 'holder', Status.Issued, params);
  }

  // discharge: beneficiary-only, requires status Accepted.
  static assertDischarge(params: TransitionParams): void {
    StatusRules.assertTransition('discharge', 'beneficiary', Status.Accepted, params);
  }
}
