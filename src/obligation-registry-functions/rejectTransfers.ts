import { createRemarkEscrowMethod } from './utils';

const rejectTransferHolderObligationRegistry = createRemarkEscrowMethod('rejectTransferHolder');
const rejectTransferBeneficiaryObligationRegistry = createRemarkEscrowMethod(
  'rejectTransferBeneficiary',
);
const rejectTransferOwnersObligationRegistry = createRemarkEscrowMethod('rejectTransferOwners');

export {
  rejectTransferHolderObligationRegistry,
  rejectTransferBeneficiaryObligationRegistry,
  rejectTransferOwnersObligationRegistry,
};
