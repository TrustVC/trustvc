import { Signer as SignerV6 } from 'ethersV6';
import { Signer } from 'ethers';
import {
  ObligationContractOptions,
  ObligationDocumentStatus,
  ObligationEscrowTerminationReason,
  ObligationStatusReadOptions,
  ObligationTokenIdParams,
} from './types';
import { getEscrowContract } from './utils';

type EscrowViewReader<T> = (
  contractOptions: ObligationContractOptions,
  signer: Signer | SignerV6,
  _params: ObligationTokenIdParams,
  options?: ObligationStatusReadOptions,
) => Promise<T>;

const createEscrowViewReader = <T>(
  read: (
    contract: Awaited<ReturnType<typeof getEscrowContract>>,
    options: ObligationStatusReadOptions,
  ) => Promise<T>,
): EscrowViewReader<T> => {
  return async (contractOptions, signer, _params, options = {}) => {
    // Escrow resolution uses contractOptions.tokenId (API parity with _params).
    const contract = await getEscrowContract(contractOptions, signer);
    return read(contract, options);
  };
};

const getObligationRegistryStatus = createEscrowViewReader(
  async (contract, options) =>
    Number(await contract.status({ blockTag: options.blockTag })) as ObligationDocumentStatus,
);

const isObligationRegistryRegistered = createEscrowViewReader((contract, options) =>
  contract.isRegistered({ blockTag: options.blockTag }),
);

const getObligationEscrowTerminationReason = createEscrowViewReader(
  async (contract, options) =>
    Number(
      await contract.terminationReason({ blockTag: options.blockTag }),
    ) as ObligationEscrowTerminationReason,
);

export {
  getObligationRegistryStatus,
  isObligationRegistryRegistered,
  getObligationEscrowTerminationReason,
};
