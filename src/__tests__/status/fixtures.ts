import { vi } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { ethers as ethersV6, Network, Wallet as WalletV6 } from 'ethersV6';
import * as coreModule from '../../core';
import { CHAIN_ID } from '../../utils/supportedChains';
import { Status } from '../../status/types';
import {
  mockV5TitleEscrowContract,
  PRIVATE_KEY,
  providerV5,
  providerV6,
} from '../token-registry-functions/fixtures';
import { ProviderInfo } from '../../token-registry-functions/types';
import { getEthersContractFromProvider } from '../../utils/ethers';

export const OWNER = '0x1000000000000000000000000000000000000A';
export const HOLDER = '0x2000000000000000000000000000000000000B';
export const DEAD = '0x0000000000000000000000000000000000dEaD';

export const MOCK_TOKEN_REGISTRY_ADDRESS = '0xTokenRegistry';
export const MOCK_TOKEN_ID = '0xTokenId';
export const MOCK_TITLE_ESCROW_ADDRESS = '0xTitleEscrow';
export const MOCK_CHAIN_ID = CHAIN_ID.local;
export const MOCK_ENCRYPTION_ID = 'encryption-id';
export const MOCK_REMARKS = 'BOE remarks';

export const providers: ProviderInfo[] = [
  { Provider: providerV5, ethersVersion: 'v5', titleEscrowVersion: 'v5' },
  { Provider: providerV6, ethersVersion: 'v6', titleEscrowVersion: 'v5' },
];

export interface EscrowState {
  beneficiary?: string;
  holder?: string;
  prevBeneficiary?: string;
  prevHolder?: string;
  status?: Status;
}

export interface StatusTestContext {
  wallet: ethersV5.Wallet | ethersV6.Wallet;
  ethersVersion: 'v5' | 'v6';
}

export function installStatusMockContract(): void {
  const mockContractConstructor = (mockContract: typeof mockV5TitleEscrowContract) =>
    vi.fn(() => mockContract);
  vi.mocked(getEthersContractFromProvider).mockReturnValue(
    mockContractConstructor(mockV5TitleEscrowContract) as unknown as ReturnType<
      typeof getEthersContractFromProvider
    >,
  );
}

export function configureSignerAsHolder(
  wallet: { address: string },
  beneficiary = '0xsome_other_owner',
): void {
  mockV5TitleEscrowContract.holder.mockResolvedValue(wallet.address);
  mockV5TitleEscrowContract.beneficiary.mockResolvedValue(beneficiary);
  mockV5TitleEscrowContract.status.mockResolvedValue(Status.Issued);
}

export function configureSignerAsBeneficiary(
  wallet: { address: string },
  holder = '0xsome_other_holder',
): void {
  mockV5TitleEscrowContract.beneficiary.mockResolvedValue(wallet.address);
  mockV5TitleEscrowContract.holder.mockResolvedValue(holder);
  mockV5TitleEscrowContract.status.mockResolvedValue(Status.Accepted);
}

export function createWallet(Provider: ProviderInfo['Provider'], ethersVersion: 'v5' | 'v6') {
  if (ethersVersion === 'v5') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wallet = new WalletV5(PRIVATE_KEY, Provider as any) as ethersV5.Wallet;
    vi.spyOn(wallet, 'getChainId').mockResolvedValue(CHAIN_ID.mainnet as unknown as number);
    return wallet;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wallet = new WalletV6(PRIVATE_KEY, Provider as any);
  vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
    chainId: CHAIN_ID.mainnet,
  } as unknown as Network);
  return wallet;
}

export function resetStatusCoreMocks(): void {
  vi.spyOn(coreModule, 'getTitleEscrowAddress').mockResolvedValue(MOCK_TITLE_ESCROW_ADDRESS);
  vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(true);
  vi.spyOn(coreModule, 'encrypt').mockReturnValue('encryptedRemarks');
}

export function configureEscrowState({
  beneficiary = OWNER,
  holder = HOLDER,
  prevBeneficiary = DEAD,
  prevHolder = DEAD,
  status = Status.Issued,
}: EscrowState = {}): void {
  mockV5TitleEscrowContract.beneficiary.mockResolvedValue(beneficiary);
  mockV5TitleEscrowContract.holder.mockResolvedValue(holder);
  mockV5TitleEscrowContract.prevBeneficiary.mockResolvedValue(prevBeneficiary);
  mockV5TitleEscrowContract.prevHolder.mockResolvedValue(prevHolder);
  mockV5TitleEscrowContract.status.mockResolvedValue(status);
}

export function setupStatusTestContext(
  Provider: ProviderInfo['Provider'],
  ethersVersion: 'v5' | 'v6',
): StatusTestContext {
  vi.clearAllMocks();
  resetStatusCoreMocks();
  configureEscrowState();
  return { wallet: createWallet(Provider, ethersVersion), ethersVersion };
}
