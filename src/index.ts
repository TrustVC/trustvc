import { supportInterfaceIds as v4SupportInterfaceIds } from './token-registry-v4/supportInterfaceIds';
import { supportInterfaceIds as v5SupportInterfaceIds } from './token-registry-v5/supportInterfaceIds';
import * as v4Contracts from './token-registry-v4/contracts';
import * as v5Contracts from './token-registry-v5/contracts';

export * from './core';
export * from './open-attestation';
export * from './verify';
export * from './w3c';
export * from './utils';
export * from './dnsprove';
export { v4SupportInterfaceIds, v5SupportInterfaceIds, v4Contracts, v5Contracts };
