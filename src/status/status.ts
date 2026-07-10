import { getTitleEscrowAddress, isTitleEscrowVersion, TitleEscrowInterface } from '../core';
import { v5Contracts } from '../token-registry-v5';
import { Signer as SignerV6 } from 'ethersV6';
import { Signer as SignerV5 } from 'ethers';
import { getEthersContractFromProvider } from '../utils/ethers';
import { Status, StatusOptions } from './types';
import { TransactionOptions } from '../token-registry-functions/types';

/**
 * Beta. Reads the `status` field off a TitleEscrow. Every TitleEscrow carries this field, ETR or
 * otherwise — it defaults to `Issued` and only ever advances via `accept`, `reject`, or `discharge`.
 * @param {StatusOptions} contractOptions - Either `titleEscrowAddress`, or both `tokenRegistryAddress` and `tokenId`.
 * @param {SignerV5 | SignerV6} signer - Ethers signer (V5 or V6) used to read the contract.
 * @param {TransactionOptions} options - Only `titleEscrowVersion` is relevant here; skips version detection when provided.
 * @throws if the title escrow address or signer provider is missing.
 * @throws if the version is not V5 compatible.
 * @throws if the TitleEscrow predates the status lifecycle (no `status()` getter).
 * @returns {Promise<Status>} The current status.
 */
const getStatus = async (
  contractOptions: StatusOptions,
  signer: SignerV5 | SignerV6,
  options: TransactionOptions = {},
): Promise<Status> => {
  const { tokenRegistryAddress, tokenId } = contractOptions;
  let { titleEscrowAddress } = contractOptions;
  const { titleEscrowVersion } = options;

  if (!titleEscrowAddress) {
    if (!tokenRegistryAddress) throw new Error('Token registry address is required');
    if (!tokenId) throw new Error('Token ID is required');
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      {},
    );
  }

  if (!titleEscrowAddress) throw new Error('Title escrow address is required');
  if (!signer.provider) throw new Error('Provider is required');

  let isV5TT = titleEscrowVersion === 'v5';
  if (titleEscrowVersion === undefined) {
    isV5TT = await isTitleEscrowVersion({
      titleEscrowAddress,
      versionInterface: TitleEscrowInterface.V5,
      provider: signer.provider,
    });
  }

  if (!isV5TT) {
    throw new Error('Only Token Registry V5 is supported');
  }

  const Contract = getEthersContractFromProvider(signer.provider);
  const titleEscrowContract = new Contract(
    titleEscrowAddress,
    v5Contracts.TitleEscrow__factory.abi,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    signer as any,
  );

  try {
    const status = await titleEscrowContract.status();
    return Number(status) as Status;
  } catch (e) {
    console.error('status() failed:', e);
    throw new Error(
      'This TitleEscrow does not support the status lifecycle (status()) — it likely predates the eBOE contract upgrade.',
    );
  }
};

export { getStatus };
