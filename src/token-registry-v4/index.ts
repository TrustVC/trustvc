import { roleHash } from './roleHash';
import { contractAddress } from './contractAddress';
import { supportInterfaceIds } from './supportInterfaceIds';
import * as v4Contracts from './contracts';
import {
  computeTitleEscrowAddress,
  encodeInitParams,
  getEventFromReceipt,
  computeInterfaceId,
} from './utils';
import { utils } from '@tradetrust-tt/token-registry-v4';

export { constants } from '@tradetrust-tt/token-registry-v4';
export {
  roleHash as v4RoleHash,
  contractAddress as v4ContractAddress,
  supportInterfaceIds as v4SupportInterfaceIds,
  v4Contracts,
  utils,
  utils as v4Utils,
  computeTitleEscrowAddress as v4ComputeTitleEscrowAddress,
  encodeInitParams as v4EncodeInitParams,
  getEventFromReceipt as v4GetEventFromReceipt,
  computeInterfaceId as v4ComputeInterfaceId,
};
