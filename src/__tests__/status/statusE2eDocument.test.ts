import '../token-registry-functions/fixtures.js';
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import { ethers as ethersV5, Wallet as WalletV5 } from 'ethers';
import { ethers as ethersV6, Wallet as WalletV6, Network } from 'ethersV6';
import * as coreModule from '../../core';
import { signW3C, verifyW3CSignature, deriveW3C } from '../../w3c';
import { VerificationType, PrivateKeyPair } from '@trustvc/w3c-issuer';
import type { SignedVerifiableCredential } from '@trustvc/w3c-vc';
import {
  mint,
  transferHolder,
  nominate,
  transferBeneficiary,
  rejectTransferHolder,
  returnToIssuer,
  acceptReturned,
} from '../../token-registry-functions';
import { accept, reject, discharge, getStatus } from '../../status';
import { Status } from '../../status/types';
import { getEthersContractFromProvider } from '../../utils/ethers';
import { CHAIN_ID } from '../../utils/supportedChains';
import {
  mockV5TitleEscrowContract,
  mockV5TradeTrustTokenContract,
  providerV5,
  providerV6,
} from '../token-registry-functions/fixtures.js';
import { ProviderInfo } from '../../token-registry-functions/types';
import { MOCK_TITLE_ESCROW_ADDRESS } from './fixtures';
import boeRawDocument from '../fixtures/boe-raw-file.json';

// Real signed VC roundtrip needs a key we actually hold — the fixture's own `issuer`
// (did:web:didhost.vercel.app) isn't ours to sign as, so it's overridden to this repo's
// existing test DID (same key used throughout documentBuilder.test.ts).
const ISSUER_PRIVATE_KEY: PrivateKeyPair = {
  '@context': 'https://w3id.org/security/multikey/v1',
  id: 'did:web:trustvc.github.io:did:1#multikey-1',
  type: VerificationType.Multikey,
  controller: 'did:web:trustvc.github.io:did:1',
  publicKeyMultibase: 'zDnaemDNwi4G5eTzGfRooFFu5Kns3be6yfyVNtiaMhWkZbwtc',
  secretKeyMultibase: 'z42tmUXTVn3n9BihE6NhdMpvVBTnFTgmb6fw18o5Ud6puhRW',
};

const OWNER_PRIVATE_KEY = '0x59c6995e998f97a5a004497e5f1ebce0c16828d44b3f8d0bfa3a89d271d5b6b9';
const HOLDER_PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000002';
const BANK_PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000003';

const REGISTRY_ADDRESS = boeRawDocument.credentialStatus.tokenRegistry;
const TOKEN_ID = `0x${Buffer.from(boeRawDocument.credentialSubject.boeNumber).toString('hex')}`;
const REISSUE_TOKEN_ID = `${TOKEN_ID}01`;

const providers: ProviderInfo[] = [
  { Provider: providerV5, ethersVersion: 'v5', titleEscrowVersion: 'v5' },
  { Provider: providerV6, ethersVersion: 'v6', titleEscrowVersion: 'v5' },
];

const options = {
  chainId: CHAIN_ID.sepolia,
  id: 'encryption-id',
  titleEscrowVersion: 'v5' as const,
};

function createWalletFromKey(
  Provider: ProviderInfo['Provider'],
  ethersVersion: 'v5' | 'v6',
  privateKey: string,
) {
  if (ethersVersion === 'v5') {
    const wallet = new WalletV5(privateKey, Provider as any) as ethersV5.Wallet;
    vi.spyOn(wallet, 'getChainId').mockResolvedValue(Number(CHAIN_ID.sepolia));
    return wallet;
  }
  const wallet = new WalletV6(privateKey, Provider as any);
  vi.spyOn(Provider, 'getNetwork').mockResolvedValue({
    chainId: BigInt(CHAIN_ID.sepolia),
  } as unknown as Network);
  return wallet;
}

function installDocumentMockContracts(): void {
  const ContractConstructor = vi.fn((address: string) =>
    address === REGISTRY_ADDRESS ? mockV5TradeTrustTokenContract : mockV5TitleEscrowContract,
  );
  vi.mocked(getEthersContractFromProvider).mockReturnValue(
    ContractConstructor as unknown as ReturnType<typeof getEthersContractFromProvider>,
  );
}

function resetCoreMocks(): void {
  vi.spyOn(coreModule, 'getTitleEscrowAddress').mockResolvedValue(MOCK_TITLE_ESCROW_ADDRESS);
  vi.spyOn(coreModule, 'isTitleEscrowVersion').mockResolvedValue(true);
  vi.spyOn(coreModule, 'encrypt').mockReturnValue('encryptedRemarks');
  vi.spyOn(coreModule, 'checkSupportsInterface').mockResolvedValue(true);
}

async function setRoles(params: {
  beneficiary: string;
  holder: string;
  status?: Status;
  prevHolder?: string;
}) {
  mockV5TitleEscrowContract.beneficiary.mockResolvedValue(params.beneficiary);
  mockV5TitleEscrowContract.holder.mockResolvedValue(params.holder);
  mockV5TitleEscrowContract.status.mockResolvedValue(params.status ?? Status.Issued);
  mockV5TitleEscrowContract.prevHolder.mockResolvedValue(
    params.prevHolder ?? '0x0000000000000000000000000000000000dEaD',
  );
}

describe.each(providers)(
  'TitleEscrow status end-to-end with a real signed document ($ethersVersion)',
  ({ Provider, ethersVersion }) => {
    let ownerWallet: ethersV5.Wallet | ethersV6.Wallet;
    let holderWallet: ethersV5.Wallet | ethersV6.Wallet;
    let bankWallet: ethersV5.Wallet | ethersV6.Wallet;
    let ownerAddress: string;
    let holderAddress: string;
    let bankAddress: string;
    let signedDocument: SignedVerifiableCredential;

    const contractOptions = { tokenRegistryAddress: REGISTRY_ADDRESS, tokenId: TOKEN_ID };

    beforeAll(() => {
      installDocumentMockContracts();
    });

    beforeEach(async () => {
      vi.clearAllMocks();
      resetCoreMocks();
      ownerWallet = createWalletFromKey(Provider, ethersVersion, OWNER_PRIVATE_KEY);
      holderWallet = createWalletFromKey(Provider, ethersVersion, HOLDER_PRIVATE_KEY);
      bankWallet = createWalletFromKey(Provider, ethersVersion, BANK_PRIVATE_KEY);
      ownerAddress = await ownerWallet.getAddress();
      holderAddress = await holderWallet.getAddress();
      bankAddress = await bankWallet.getAddress();
    });

    describe('sign', () => {
      it('signs the real document and produces a verifiable ECDSA-SD-2023 credential', async () => {
        const document = {
          ...boeRawDocument,
          issuer: ISSUER_PRIVATE_KEY.id.split('#')[0],
        };

        const result = await signW3C(document, ISSUER_PRIVATE_KEY, 'ecdsa-sd-2023');
        expect(result.error).toBeUndefined();
        expect(result.signed).toBeDefined();
        signedDocument = result.signed as SignedVerifiableCredential;

        const derived = await deriveW3C(signedDocument, []);
        expect(derived.error).toBeUndefined();

        const verification = await verifyW3CSignature(derived.derived!);
        expect(verification.verified).toBe(true);

        expect(signedDocument.credentialSubject).toMatchObject(boeRawDocument.credentialSubject);
        expect(signedDocument.credentialStatus).toMatchObject({
          tokenRegistry: REGISTRY_ADDRESS,
        });

        const mintedDocument = {
          ...signedDocument,
          credentialStatus: { ...signedDocument.credentialStatus, tokenId: TOKEN_ID },
        };
        expect(mintedDocument.credentialStatus).toMatchObject({ tokenId: TOKEN_ID });
      });
    });

    describe('happy path: issue → present → accept → discharge → surrender → burn', () => {
      it('runs the full eBOE lifecycle', async () => {
        // Step 0 — Issue with owner == holder (drawer holds both roles)
        await setRoles({ beneficiary: ownerAddress, holder: ownerAddress });
        const mintTx = await mint(
          { tokenRegistryAddress: REGISTRY_ADDRESS },
          ownerWallet,
          {
            beneficiaryAddress: ownerAddress,
            holderAddress: ownerAddress,
            tokenId: TOKEN_ID,
            remarks: `Issuing ${boeRawDocument.credentialSubject.boeNumber}`,
          },
          options,
        );
        expect(mintTx).toEqual('v5_mint_tx_hash');
        expect(await getStatus(contractOptions, ownerWallet)).toEqual(Status.Issued);

        // Step 1 — Presentment: diverge holder to drawee
        const presentTx = await transferHolder(
          contractOptions,
          ownerWallet,
          { holderAddress, remarks: 'Presentment' },
          options,
        );
        expect(presentTx).toBeDefined();
        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          prevHolder: ownerAddress,
        });

        // Step 2 — Holder accepts
        const acceptTx = await accept(
          contractOptions,
          holderWallet,
          { remarks: 'Accepted, bound to pay at maturity' },
          options,
        );
        expect(acceptTx).toEqual('v5_accept_tx_hash');
        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          status: Status.Accepted,
        });
        expect(await getStatus(contractOptions, ownerWallet)).toEqual(Status.Accepted);

        // Step 3 — Owner discharges after payment
        const dischargeTx = await discharge(
          contractOptions,
          ownerWallet,
          { remarks: `Paid at maturity for ${boeRawDocument.credentialSubject.boeNumber}` },
          options,
        );
        expect(dischargeTx).toEqual('v5_discharge_tx_hash');
        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          status: Status.Discharged,
        });
        expect(await getStatus(contractOptions, ownerWallet)).toEqual(Status.Discharged);

        // Step 4 — Reconverge owner onto holder, then surrender
        await nominate(
          contractOptions,
          ownerWallet,
          { newBeneficiaryAddress: holderAddress, remarks: 'Reconverge owner to holder' },
          options,
        );
        await transferBeneficiary(
          contractOptions,
          holderWallet,
          { newBeneficiaryAddress: holderAddress, remarks: 'Confirm nomination' },
          options,
        );
        await setRoles({
          beneficiary: holderAddress,
          holder: holderAddress,
          status: Status.Discharged,
        });

        const surrenderTx = await returnToIssuer(
          contractOptions,
          holderWallet,
          { remarks: 'Surrender' },
          options,
        );
        expect(surrenderTx).toBeDefined();

        // Step 5 — Burn (accepter role)
        const burnTx = await acceptReturned(
          { tokenRegistryAddress: REGISTRY_ADDRESS },
          ownerWallet,
          { tokenId: TOKEN_ID, remarks: 'Burn discharged BOE' },
          options,
        );
        expect(burnTx).toEqual('v5_burn_tx_hash');
        expect(mockV5TradeTrustTokenContract.burn).toHaveBeenCalled();
      });
    });

    describe('edge case: reject path (Issued → Rejected → reconverge → surrender → reissue)', () => {
      it('rejects, reconverges via rejectTransferHolder, surrenders, and remints', async () => {
        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          prevHolder: ownerAddress,
        });

        const rejectTx = await reject(
          contractOptions,
          holderWallet,
          { remarks: 'Declined — goods not received' },
          options,
        );
        expect(rejectTx).toEqual('v5_reject_tx_hash');
        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          status: Status.Rejected,
          prevHolder: ownerAddress,
        });
        expect(await getStatus(contractOptions, ownerWallet)).toEqual(Status.Rejected);

        // Terminal: cannot discharge or accept a rejected bill
        await expect(discharge(contractOptions, ownerWallet, {}, options)).rejects.toThrow(
          'was rejected and can never be discharged',
        );
        await expect(accept(contractOptions, holderWallet, {}, options)).rejects.toThrow(
          /already been|cannot be accepted or rejected again/,
        );

        // Status-only reject — separately revert holder role
        const revertHolderTx = await rejectTransferHolder(
          contractOptions,
          holderWallet,
          { remarks: 'Revert holdership' },
          options,
        );
        expect(revertHolderTx).toBeDefined();
        await setRoles({
          beneficiary: ownerAddress,
          holder: ownerAddress,
          status: Status.Rejected,
        });

        const surrenderTx = await returnToIssuer(
          contractOptions,
          ownerWallet,
          { remarks: 'Surrender rejected BOE' },
          options,
        );
        expect(surrenderTx).toBeDefined();

        // Reissue a new token
        const remintTx = await mint(
          { tokenRegistryAddress: REGISTRY_ADDRESS },
          ownerWallet,
          {
            beneficiaryAddress: ownerAddress,
            holderAddress: ownerAddress,
            tokenId: REISSUE_TOKEN_ID,
            remarks: 'Reissue after reject',
          },
          options,
        );
        expect(remintTx).toEqual('v5_mint_tx_hash');
        expect(mockV5TradeTrustTokenContract.mint).toHaveBeenCalledWith(
          ownerAddress,
          ownerAddress,
          REISSUE_TOKEN_ID,
          expect.any(String),
          expect.any(Object),
        );
      });
    });

    describe('edge case: financing path (Accepted → endorse to bank → bank discharges)', () => {
      it('endorses ownership to a bank after accept; bank discharges', async () => {
        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          status: Status.Accepted,
        });

        await nominate(
          contractOptions,
          ownerWallet,
          { newBeneficiaryAddress: bankAddress, remarks: 'Nominate bank' },
          options,
        );
        await transferBeneficiary(
          contractOptions,
          holderWallet,
          { newBeneficiaryAddress: bankAddress, remarks: 'Endorse to bank' },
          options,
        );
        await setRoles({
          beneficiary: bankAddress,
          holder: holderAddress,
          status: Status.Accepted,
        });

        // Original owner can no longer discharge
        await expect(discharge(contractOptions, ownerWallet, {}, options)).rejects.toThrow(
          'Only the current beneficiary (owner) can discharge this TitleEscrow',
        );

        const dischargeTx = await discharge(
          contractOptions,
          bankWallet,
          { remarks: 'Paid; bank discharges' },
          options,
        );
        expect(dischargeTx).toEqual('v5_discharge_tx_hash');
        await setRoles({
          beneficiary: bankAddress,
          holder: holderAddress,
          status: Status.Discharged,
        });
        expect(await getStatus(contractOptions, bankWallet)).toEqual(Status.Discharged);
      });
    });

    describe('edge case: invalid lifecycle transitions', () => {
      it('blocks accept/reject/discharge when owner == holder (no presentment)', async () => {
        await setRoles({ beneficiary: ownerAddress, holder: ownerAddress });

        await expect(accept(contractOptions, ownerWallet, {}, options)).rejects.toThrow(
          'Owner and holder must be different addresses',
        );
        await expect(reject(contractOptions, ownerWallet, {}, options)).rejects.toThrow(
          'Owner and holder must be different addresses',
        );
      });

      it('blocks discharge before acceptance and after discharge', async () => {
        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          status: Status.Issued,
        });
        await expect(discharge(contractOptions, ownerWallet, {}, options)).rejects.toThrow(
          'has not been accepted yet',
        );

        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          status: Status.Discharged,
        });
        await expect(discharge(contractOptions, ownerWallet, {}, options)).rejects.toThrow(
          'already been discharged',
        );
        await expect(accept(contractOptions, holderWallet, {}, options)).rejects.toThrow(
          /already been|cannot be accepted or rejected again/,
        );
      });

      it('blocks wrong-role callers at each lifecycle step', async () => {
        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          status: Status.Issued,
        });
        await expect(accept(contractOptions, ownerWallet, {}, options)).rejects.toThrow(
          'Only the current holder can accept',
        );
        await expect(reject(contractOptions, ownerWallet, {}, options)).rejects.toThrow(
          'Only the current holder can reject',
        );

        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          status: Status.Accepted,
        });
        await expect(discharge(contractOptions, holderWallet, {}, options)).rejects.toThrow(
          'Only the current beneficiary (owner) can discharge',
        );
      });

      it('allows ETR circulation after Accepted without reading or mutating status', async () => {
        await setRoles({
          beneficiary: ownerAddress,
          holder: holderAddress,
          status: Status.Accepted,
        });
        mockV5TitleEscrowContract.status.mockClear();

        await expect(
          transferHolder(contractOptions, holderWallet, { holderAddress: bankAddress }, options),
        ).resolves.toBeDefined();
        await expect(
          nominate(contractOptions, ownerWallet, { newBeneficiaryAddress: bankAddress }, options),
        ).resolves.toBeDefined();

        expect(mockV5TitleEscrowContract.status).not.toHaveBeenCalled();
      });
    });
  },
);
