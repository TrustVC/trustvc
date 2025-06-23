import { CHAIN_ID, SUPPORTED_CHAINS } from '@tradetrust-tt/tradetrust-utils';
import { encrypt } from 'src/core';
import { v4Contracts } from 'src/token-registry-v4';
import { v5Contracts, v5SupportInterfaceIds } from 'src/token-registry-v5';
import { BigNumber, Signer } from 'ethers';
interface TransferHolderParams {
  holderAddress: string;
  tokenId: string | number;
  remarks?: string;
}

interface TransferHolderOptions {
  chainId?: CHAIN_ID;
  isV5TT?: boolean;
  maxFeePerGas?: BigNumber | string | number;
  maxPriorityFeePerGas?: BigNumber | string | number;
  id?: string;
}

const transferHolder = async (
  titleEscrowAddress: string,
  signer: Signer,
  params: TransferHolderParams,
  options: TransferHolderOptions,
) => {
  if (!titleEscrowAddress) throw new Error('Token registry address is required');

  const { holderAddress, remarks } = params;
  let { chainId, isV5TT, maxFeePerGas, maxPriorityFeePerGas } = options;

  // Connect V5 contract by default
  let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
    v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const mintableSupportInterfaceId = v5SupportInterfaceIds.TradeTrustTokenMintable;
  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';
  type TransferHolderPayload = [string] | [string, string];
  let payload: TransferHolderPayload = [holderAddress, encryptedRemarks] as [string, string];

  // Detect version if not explicitly provided
  if (isV5TT === undefined) {
    isV5TT = await titleEscrowContract.supportsInterface(mintableSupportInterfaceId);
    payload = [holderAddress] as [string];
  }

  // Switch to V4 if needed
  if (!isV5TT) {
    titleEscrowContract = v4Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);
  }

  // Check callStatic (dry run)
  try {
    // @ts-expect-error TS2556: Ignoring spread argument tuple requirement for payload

    (await titleEscrowContract.callStatic.transferHolder(...payload)) as v4Contracts.TitleEscrow;
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferHolder failed');
  }

  // If gas values are missing, query gas station if available
  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    chainId = chainId ?? ((await signer.getChainId()) as unknown as CHAIN_ID);
    const gasStation = SUPPORTED_CHAINS[chainId]?.gasStation;

    if (gasStation) {
      const gasFees = await gasStation();
      maxFeePerGas = gasFees?.maxFeePerGas ?? 0;
      maxPriorityFeePerGas = gasFees?.maxPriorityFeePerGas ?? 0;
    }
  }

  const txOptions =
    maxFeePerGas && maxPriorityFeePerGas ? { maxFeePerGas, maxPriorityFeePerGas } : undefined;

  // Send the actual transaction
  // @ts-expect-error TS2556: Ignoring spread argument tuple requirement for payload

  return await titleEscrowContract.transferHolder(...payload, txOptions);
};

export { transferHolder };
