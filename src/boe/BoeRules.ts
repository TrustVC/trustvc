import { BillOfExchangeStatus, BillOfExchangeStatusLabel } from './types';

interface TransitionParams {
  currentBeneficiary: string;
  currentHolder: string;
  currentStatus: BillOfExchangeStatus;
  signerAddress: string;
}

const sameAddress = (a: string, b: string): boolean => a.toLowerCase() === b.toLowerCase();

// Business rules for the three dedicated Bill of Exchange functions (acceptBillOfExchange,
// rejectBillOfExchange, dischargeBillOfExchange). Every check here is purely advisory, client-side
// validation — the contract enforces the on-chain-relevant subset of these independently. Nothing
// in this class talks to a contract; it only reasons about state its callers already fetched.
//
// The existing ETR functions (transferHolder, nominate, transferBeneficiary, transferOwners, the
// reject-transfer family, returnToIssuer) are untouched by this class and by documentType — they
// behave exactly as they did before the Bill of Exchange lifecycle existed.
export class BoeRules {
  private static assertTransition(
    action: 'accept' | 'reject' | 'discharge',
    requiredCallerRole: 'holder' | 'beneficiary',
    requiredStatus: BillOfExchangeStatus,
    { currentBeneficiary, currentHolder, currentStatus, signerAddress }: TransitionParams,
  ): void {
    const expectedCaller = requiredCallerRole === 'holder' ? currentHolder : currentBeneficiary;
    if (!sameAddress(signerAddress, expectedCaller)) {
      throw new Error(
        requiredCallerRole === 'holder'
          ? `Only the current holder can ${action} this Bill of Exchange`
          : `Only the current beneficiary (owner) can ${action} this Bill of Exchange`,
      );
    }

    if (sameAddress(currentBeneficiary, currentHolder)) {
      throw new Error(
        'Owner and holder must be different addresses before this Bill of Exchange can be accepted, rejected, or discharged',
      );
    }

    if (currentStatus === requiredStatus) return;

    if (action === 'discharge') {
      if (currentStatus === BillOfExchangeStatus.Rejected) {
        throw new Error(
          'This Bill of Exchange was rejected and can never be discharged — surrender it (returnToIssuer) and reissue a new one instead.',
        );
      }
      if (currentStatus === BillOfExchangeStatus.Issued) {
        throw new Error(
          'This Bill of Exchange has not been accepted yet — only an Accepted bill can be discharged.',
        );
      }
      throw new Error('This Bill of Exchange has already been discharged.');
    }

    throw new Error(
      `This Bill of Exchange has already been ${BillOfExchangeStatusLabel[currentStatus]} and cannot be accepted or rejected again.`,
    );
  }

  // acceptBillOfExchange: holder-only, requires status Issued.
  static assertAccept(params: TransitionParams): void {
    BoeRules.assertTransition('accept', 'holder', BillOfExchangeStatus.Issued, params);
  }

  // rejectBillOfExchange: holder-only, requires status Issued.
  static assertReject(params: TransitionParams): void {
    BoeRules.assertTransition('reject', 'holder', BillOfExchangeStatus.Issued, params);
  }

  // dischargeBillOfExchange: beneficiary-only, requires status Accepted.
  static assertDischarge(params: TransitionParams): void {
    BoeRules.assertTransition('discharge', 'beneficiary', BillOfExchangeStatus.Accepted, params);
  }
}
