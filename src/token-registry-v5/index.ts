import { contractAddress } from './contractAddress';
import { roleHash } from './roleHash';
import { supportInterfaceIds } from './supportInterfaceIds';
import * as v5Contracts from './contracts';
import { encodeInitParams, getEventFromReceipt, computeInterfaceId } from './utils';
import { utils } from '@tradetrust-tt/token-registry-v4';

export { constants } from '@tradetrust-tt/token-registry-v4';
export type { TypedContractMethod } from './typedContractMethod';
export {
  contractAddress as v5ContractAddress,
  roleHash as v5RoleHash,
  supportInterfaceIds as v5SupportInterfaceIds,
  v5Contracts,
  utils,
  utils as v5Utils,
  encodeInitParams as v5EncodeInitParams,
  getEventFromReceipt as v5GetEventFromReceipt,
  computeInterfaceId as v5ComputeInterfaceId,
};
