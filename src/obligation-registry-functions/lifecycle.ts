import { createRemarkEscrowMethod } from './utils';

const acceptObligationRegistry = createRemarkEscrowMethod('accept');
const rejectObligationRegistry = createRemarkEscrowMethod('reject');
const dischargeObligationRegistry = createRemarkEscrowMethod('discharge');

export { acceptObligationRegistry, rejectObligationRegistry, dischargeObligationRegistry };
