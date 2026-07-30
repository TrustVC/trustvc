import { ethers as ethersV6 } from 'ethersV6';
import { ethers } from 'ethers';
import { CHAIN_ID } from '../../../utils';
import {
  deployObligationRegistry,
  mintObligationRegistry,
} from '../../../obligation-registry-functions';
import type { TransactionOptions } from '../../../obligation-registry-functions/types';
import { getObligationEscrowAddress } from '../../../core';
import { getSignersV5, getSignersV6, providerV5, providerV6 } from '../fixtures';
import { createSampleBoeTxOptions } from '../fixtures/sample-boe-credential';

export type ObligationE2EProvider = {
  Provider: typeof providerV5 | typeof providerV6;
  ethersVersion: 'v5' | 'v6';
};

export const obligationE2EProviders: ObligationE2EProvider[] = [
  { Provider: providerV5, ethersVersion: 'v5' },
  { Provider: providerV6, ethersVersion: 'v6' },
];

export type ObligationE2ESigner = ethers.Wallet | ethersV6.Wallet;

export interface ObligationE2ESetup {
  deployer: ObligationE2ESigner;
  holder: ObligationE2ESigner;
  beneficiary: ObligationE2ESigner;
  other: ObligationE2ESigner;
  obligationRegistry: string;
  obligationEscrowFactoryAddress: string;
  txOptions: TransactionOptions;
  ethersVersion: 'v5' | 'v6';
  provider: typeof providerV5 | typeof providerV6;
}

export const createObligationE2ESigners = async (
  ethersVersion: 'v5' | 'v6',
  count = 6,
): Promise<ObligationE2ESigner[]> => {
  return ethersVersion === 'v5' ? getSignersV5(count) : getSignersV6(count);
};

export const deployObligationE2ERegistry = async (
  deployer: ObligationE2ESigner,
): Promise<{ obligationRegistry: string; obligationEscrowFactoryAddress: string }> => {
  return deployObligationRegistry('E2E BoE Registry', 'BOE', deployer, {
    chainId: CHAIN_ID.local,
  });
};

export const mintObligationE2EToken = async (
  setup: Pick<ObligationE2ESetup, 'deployer' | 'obligationRegistry' | 'txOptions'>,
  tokenId: string | number,
  holderAddress: string,
  beneficiaryAddress: string,
  remarks?: string,
) => {
  const tx = await mintObligationRegistry(
    { obligationRegistryAddress: setup.obligationRegistry },
    setup.deployer,
    {
      beneficiaryAddress,
      holderAddress,
      tokenId,
      remarks,
    },
    setup.txOptions,
  );
  await tx.wait();
};

export const buildObligationE2ESetup = (
  ethersVersion: 'v5' | 'v6',
  signers: ObligationE2ESigner[],
  obligationRegistry: string,
  obligationEscrowFactoryAddress: string,
): ObligationE2ESetup => {
  const [deployer, holder, beneficiary, other] = signers;

  return {
    deployer,
    holder,
    beneficiary,
    other,
    obligationRegistry,
    obligationEscrowFactoryAddress,
    txOptions: createSampleBoeTxOptions(),
    ethersVersion,
    provider: ethersVersion === 'v5' ? providerV5 : providerV6,
  };
};

export const getObligationE2EEscrowAddress = async (
  setup: ObligationE2ESetup,
  tokenId: string | number,
): Promise<string> => {
  return getObligationEscrowAddress(setup.obligationRegistry, String(tokenId), setup.provider, {
    titleEscrowVersion: 'v5',
  });
};
