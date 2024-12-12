import { supportInterfaceIds as v4SupportInterfaceIds } from './token-registry-v4/supportInterfaceIds';
import { supportInterfaceIds as v5SupportInterfaceIds } from './token-registry-v5/supportInterfaceIds';
import { v4RoleHash, v4ContractAddress } from './token-registry-v4';
import { v5RoleHash, v5ContractAddress } from './token-registry-v5';

import * as v4Contracts from '@tradetrust-tt/token-registry-v4/contracts';
import * as v5Contracts from '@tradetrust-tt/token-registry-v5/contracts';
export { TypedContractMethod } from './token-registry-v5/typedContractMethod';

export * from './core';
export * from './open-attestation';
export * from './verify';
export * from './w3c';
export * from './utils';
export * from './dnsprove';
export {
  v4SupportInterfaceIds,
  v4ContractAddress,
  v4RoleHash,
  v4Contracts,
  v5SupportInterfaceIds,
  v5ContractAddress,
  v5RoleHash,
  v5Contracts,
};
