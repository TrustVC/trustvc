import { CHAIN_ID, SUPPORTED_CHAINS } from '@tradetrust-tt/tradetrust-utils';
import {
  encrypt,
  getTitleEscrowAddress,
  isTitleEscrowVersion,
  TitleEscrowInterface,
} from 'src/core';
import { v4Contracts } from 'src/token-registry-v4';
import { v5Contracts } from 'src/token-registry-v5';
import { BigNumberish, Signer as SignerV6 } from 'ethersV6';
import { BigNumber, Signer } from 'ethers';
import { isV6EthersProvider } from 'src/utils/ethers';

interface TransferHolderParams {
  holderAddress: string;
  remarks?: string;
}
interface TransferBeneficiaryParams {
  newBeneficiaryAddress: string;
  remarks?: string;
}
interface NominateParams {
  newBeneficiaryAddress: string;
  remarks?: string;
}
interface TransferOwnersParams {
  newHolderAddress: string;
  newBeneficiaryAddress: string;
  remarks?: string;
}

interface TransferOptions {
  chainId?: CHAIN_ID;
  titleEscrowVersion?: 'v4' | 'v5';
  maxFeePerGas?: BigNumberish | string | number | BigNumber;
  maxPriorityFeePerGas?: BigNumberish | string | number | BigNumber;
  id?: string;
}

// 🔍 Handles both Ethers v5 and v6 signer types
const getChainIdSafe = async (signer: SignerV6 | Signer): Promise<bigint | number> => {
  if (isV6EthersProvider(signer.provider)) {
    const network = await (signer as Signer).provider?.getNetwork();
    if (!network?.chainId) throw new Error('Cannot determine chainId: provider is missing');
    return network.chainId;
  }
  return await (signer as Signer).getChainId();
};
// const getSignerAddressSafe = async (signer: SignerV6 | Signer): Promise<string> => {
//   if (isV6EthersProvider(signer.provider)) {
//     return await (signer as SignerV6).getAddress();
//   }
//   return (signer as any).address;
// };

type ContractOptions =
  | {
      titleEscrowAddress: string; // Present — no restrictions on the rest
      tokenId?: string | number;
      tokenRegistryAddress?: string;
    }
  | {
      titleEscrowAddress?: undefined; // Absent — must provide both below
      tokenId: string | number;
      tokenRegistryAddress: string;
    };

const transferHolder = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: TransferHolderParams,
  options: TransferOptions,
) => {
  const { tokenRegistryAddress, tokenId } = contractOptions;
  const { titleEscrowVersion } = options;
  let { titleEscrowAddress } = contractOptions;
  let { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      { titleEscrowVersion },
    );
  }

  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { holderAddress, remarks } = params;

  // Connect V5 contract by default
  let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
    v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V4,
        provider: signer.provider,
      }),
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V5,
        provider: signer.provider,
      }),
    ]);
  }
  if (!isV4TT && !isV5TT) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  // Switch to V4 if needed
  if (isV4TT) {
    titleEscrowContract = v4Contracts.TitleEscrow__factory.connect(
      titleEscrowAddress,
      signer as Signer,
    );
  }
  //   check for current holder and signer
  //   const currentHolder = await titleEscrowContract.holder();

  //   if (currentHolder.toLowerCase() === holderAddress.toLowerCase()) {
  //     throw new Error('Cannot transfer to current holder');
  //   }
  //   const signerAddress = await getSignerAddressSafe(signer);
  //   if (currentHolder.toLowerCase() !== signerAddress.toLowerCase()) {
  //     throw new Error('Only the current holder can transfer');
  //   }

  // Check callStatic (dry run)
  try {
    if (isV5TT) {
      await (titleEscrowContract as v5Contracts.TitleEscrow).callStatic.transferHolder(
        holderAddress,
        encryptedRemarks,
      );
    } else if (isV4TT) {
      await (titleEscrowContract as v4Contracts.TitleEscrow).callStatic.transferHolder(
        holderAddress,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferHolder failed');
  }

  // If gas values are missing, query gas station if available
  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    chainId = chainId ?? ((await getChainIdSafe(signer)) as unknown as CHAIN_ID);
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
  if (isV5TT) {
    return await (titleEscrowContract as v5Contracts.TitleEscrow).transferHolder(
      holderAddress,
      encryptedRemarks,
      txOptions,
    );
  } else if (isV4TT) {
    return await titleEscrowContract.transferHolder(holderAddress, txOptions);
  }
};

const transferBeneficiary = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: TransferBeneficiaryParams,
  options: TransferOptions,
) => {
  const { tokenId, tokenRegistryAddress } = contractOptions;
  const { titleEscrowVersion } = options;
  let { titleEscrowAddress } = contractOptions;
  let { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      { titleEscrowVersion },
    );
  }
  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { newBeneficiaryAddress, remarks } = params;

  // Connect V5 contract by default
  let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
    v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V4,
        provider: signer.provider,
      }),
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V5,
        provider: signer.provider,
      }),
    ]);
  }
  if (!isV4TT && !isV5TT) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  // Switch to V4 if needed
  if (!isV5TT) {
    titleEscrowContract = v4Contracts.TitleEscrow__factory.connect(
      titleEscrowAddress,
      signer as Signer,
    );
  }

  // check for current beneficiary and signer
  //   const currentHolder = await titleEscrowContract.holder();
  //   const currentBeneficiary = await titleEscrowContract.beneficiary();
  //   if (currentBeneficiary.toLowerCase() === newBeneficiaryAddress.toLowerCase()) {
  //     throw new Error('Cannot transfer to current beneficiary');
  //   }
  //   const signerAddress = await signer.getAddress();
  //   if (currentHolder.toLowerCase() !== signerAddress.toLowerCase()) {
  //     throw new Error('Only the current holder can transfer');
  //   }

  // Check callStatic (dry run)
  try {
    if (isV5TT) {
      await (titleEscrowContract as v5Contracts.TitleEscrow).callStatic.transferBeneficiary(
        newBeneficiaryAddress,
        encryptedRemarks,
      );
    } else if (isV4TT) {
      await (titleEscrowContract as v4Contracts.TitleEscrow).callStatic.transferBeneficiary(
        newBeneficiaryAddress,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferBeneficiary failed');
  }

  // If gas values are missing, query gas station if available
  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    chainId = chainId ?? ((await getChainIdSafe(signer)) as unknown as CHAIN_ID);
    const gasStation = SUPPORTED_CHAINS[chainId]?.gasStation;

    if (gasStation) {
      const gasFees = await gasStation();
      maxFeePerGas = gasFees?.maxFeePerGas ?? 0;
      maxPriorityFeePerGas = gasFees?.maxPriorityFeePerGas ?? 0;
    }
  }

  const txOptions =
    maxFeePerGas && maxPriorityFeePerGas ? { maxFeePerGas, maxPriorityFeePerGas } : undefined;
  console.log('txoption', txOptions, isV4TT, isV5TT);
  // Send the actual transaction
  if (isV5TT) {
    const tx = await (titleEscrowContract as v5Contracts.TitleEscrow).transferBeneficiary(
      newBeneficiaryAddress,
      encryptedRemarks,
      txOptions,
    );
    console.log('isV5TT', tx);
    return tx;
  } else if (isV4TT) {
    const tx = await (titleEscrowContract as v4Contracts.TitleEscrow).transferBeneficiary(
      newBeneficiaryAddress,
      txOptions,
    );
    console.log('isV4TT', tx);
    return tx;
  }
};
const transferOwners = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: TransferOwnersParams,
  options: TransferOptions,
) => {
  const { tokenId, tokenRegistryAddress } = contractOptions;
  const { titleEscrowVersion } = options;
  let { titleEscrowAddress } = contractOptions;
  let { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;
  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      { titleEscrowVersion },
    );
  }
  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { newBeneficiaryAddress, newHolderAddress, remarks } = params;

  // Connect V5 contract by default
  let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
    v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V4,
        provider: signer.provider,
      }),
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V5,
        provider: signer.provider,
      }),
    ]);
  }
  if (!isV4TT && !isV5TT) {
    throw new Error('Only Token Registry V4/V5 is supported');
  }

  // Switch to V4 if needed
  if (!isV5TT) {
    titleEscrowContract = v4Contracts.TitleEscrow__factory.connect(
      titleEscrowAddress,
      signer as Signer,
    );
  }

  // check for current beneficiary, holder and signer
  //   const currentHolder = await titleEscrowContract.holder();
  //   const currentBeneficiary = await titleEscrowContract.beneficiary();
  //   if (currentBeneficiary.toLowerCase() === newBeneficiaryAddress.toLowerCase()) {
  //     throw new Error('Cannot transfer to current beneficiary');
  //   }
  //   if (currentHolder.toLowerCase() === newHolderAddress.toLowerCase()) {
  //     throw new Error('Cannot transfer to current holder');
  //   }
  //   const signerAddress = await signer.getAddress();
  //   if (
  //     currentHolder.toLowerCase() !== signerAddress.toLowerCase() ||
  //     currentBeneficiary.toLowerCase() !== signerAddress.toLowerCase()
  //   ) {
  //     throw new Error('Holder and Beneficiary must be current signer');
  //   }

  // Check callStatic (dry run)
  try {
    if (isV5TT) {
      await (titleEscrowContract as v5Contracts.TitleEscrow).callStatic.transferOwners(
        newBeneficiaryAddress,
        newHolderAddress,
        encryptedRemarks,
      );
    } else if (isV4TT) {
      await (titleEscrowContract as v4Contracts.TitleEscrow).callStatic.transferOwners(
        newBeneficiaryAddress,
        newHolderAddress,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for transferOwners failed');
  }

  // If gas values are missing, query gas station if available
  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    chainId = chainId ?? ((await getChainIdSafe(signer)) as unknown as CHAIN_ID);
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

  if (isV5TT) {
    return await (titleEscrowContract as v5Contracts.TitleEscrow).transferOwners(
      newBeneficiaryAddress,
      newHolderAddress,
      encryptedRemarks,
      txOptions,
    );
  } else if (isV4TT) {
    return await (titleEscrowContract as v4Contracts.TitleEscrow).transferOwners(
      newBeneficiaryAddress,
      newHolderAddress,
      txOptions,
    );
  }
};

const nominate = async (
  contractOptions: ContractOptions,
  signer: Signer | SignerV6,
  params: NominateParams,
  options: TransferOptions,
) => {
  const { tokenId, tokenRegistryAddress } = contractOptions;
  const { titleEscrowVersion } = options;
  let { titleEscrowAddress } = contractOptions;
  let { chainId, maxFeePerGas, maxPriorityFeePerGas } = options;

  let isV5TT = titleEscrowVersion === 'v5';
  let isV4TT = titleEscrowVersion === 'v4';

  if (!titleEscrowAddress) {
    titleEscrowAddress = await getTitleEscrowAddress(
      tokenRegistryAddress,
      tokenId as string,
      signer.provider,
      { titleEscrowVersion },
    );
  }
  if (!titleEscrowAddress) throw new Error('Token registry address is required');
  if (!signer.provider) throw new Error('Provider is required');
  const { newBeneficiaryAddress, remarks } = params;

  // Connect V5 contract by default
  let titleEscrowContract: v5Contracts.TitleEscrow | v4Contracts.TitleEscrow =
    v5Contracts.TitleEscrow__factory.connect(titleEscrowAddress, signer);

  const encryptedRemarks = remarks ? `0x${encrypt(remarks, options.id!)}` : '0x';

  // Detect version if not explicitly provided
  if (titleEscrowVersion === undefined) {
    [isV4TT, isV5TT] = await Promise.all([
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V4,
        provider: signer.provider,
      }),
      isTitleEscrowVersion({
        titleEscrowAddress,
        versionInterface: TitleEscrowInterface.V5,
        provider: signer.provider,
      }),
    ]);
  }

  // Switch to V4 if needed
  if (!isV5TT) {
    titleEscrowContract = v4Contracts.TitleEscrow__factory.connect(
      titleEscrowAddress,
      signer as Signer,
    );
  }

  // check for current beneficiary and signer
  //   const currentBeneficiary = await titleEscrowContract.beneficiary();
  //   const signerAddress = await signer.getAddress();
  //   if (currentBeneficiary.toLowerCase() !== signerAddress.toLowerCase()) {
  //     throw new Error('Beneficiary must be current signer');
  //   }
  //   if (currentBeneficiary.toLowerCase() === newBeneficiaryAddress.toLowerCase()) {
  //     throw new Error('Cannot nominate to current beneficiary');
  //   }

  // Check callStatic (dry run)
  try {
    if (isV5TT) {
      await (titleEscrowContract as v5Contracts.TitleEscrow).callStatic.nominate(
        newBeneficiaryAddress,
        encryptedRemarks,
      );
    } else if (isV4TT) {
      await (titleEscrowContract as v4Contracts.TitleEscrow).callStatic.nominate(
        newBeneficiaryAddress,
      );
    }
  } catch (e) {
    console.error('callStatic failed:', e);
    throw new Error('Pre-check (callStatic) for nominate failed');
  }

  // If gas values are missing, query gas station if available
  if (!maxFeePerGas || !maxPriorityFeePerGas) {
    chainId = chainId ?? ((await getChainIdSafe(signer)) as unknown as CHAIN_ID);
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

  if (isV5TT) {
    return await (titleEscrowContract as v5Contracts.TitleEscrow).nominate(
      newBeneficiaryAddress,
      encryptedRemarks,
      txOptions,
    );
  } else if (isV4TT) {
    return await (titleEscrowContract as v4Contracts.TitleEscrow).nominate(
      newBeneficiaryAddress,
      txOptions,
    );
  }
};

export { transferHolder, transferBeneficiary, transferOwners, nominate };
