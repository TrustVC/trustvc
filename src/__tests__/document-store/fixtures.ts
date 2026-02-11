import { vi } from 'vitest';
import { ethers as ethersV5 } from 'ethers';
import { JsonRpcProvider as JsonRpcProviderV6, ethers as ethersV6 } from 'ethersV6';
import * as originalModule from '../../utils/ethers';

export const MOCK_DOCUMENT_STORE_ADDRESS = '0xDocumentStoreContract';
export const MOCK_TRANSFERABLE_DOCUMENT_STORE_ADDRESS = '0xTransferableDocumentStoreContract';
export const MOCK_TT_DOCUMENT_STORE_ADDRESS = '0xTTDocumentStoreContract';

vi.mock('ethersV6', async () => {
  const actual = await vi.importActual<typeof ethersV6>('ethersV6');

  return {
    ...actual,
    ContractFactory: vi.fn().mockImplementation(() => ({
      deploy: vi.fn().mockResolvedValue({
        waitForDeployment: vi.fn().mockResolvedValue(undefined),
        deploymentTransaction: vi.fn(() => ({
          wait: vi.fn().mockResolvedValue({
            address: '0xDeployedDocumentStoreAddress',
            transactionHash: 'deploy_tx_hash',
          }),
          hash: 'deploy_tx_hash',
        })),
      }),
    })),
  };
});

vi.mock('ethers', async () => {
  const actual = await vi.importActual<typeof ethersV5>('ethers');
  return {
    ...actual,

    ContractFactory: vi.fn().mockImplementation(() => ({
      deploy: vi.fn().mockResolvedValue({
        waitForDeployment: vi.fn().mockResolvedValue(undefined),
        target: '0xDeployedDocumentStoreAddress',
        deployTransaction: {
          wait: vi.fn().mockResolvedValue({
            address: '0xDeployedDocumentStoreAddress',
            transactionHash: 'deploy_tx_hash',
          }),
          hash: 'deploy_tx_hash',
        },
      }),
    })),
  };
});

vi.mock('../../utils/ethers', async (importOriginal) => {
  const original = (await importOriginal()) as typeof originalModule;

  return {
    ...original, // Keep all original exports
    getEthersContractFromProvider: vi.fn(() => vi.fn()), // Only mock this function
  };
});

vi.mock('../../core', () => ({
  checkSupportsInterface: vi.fn(),
}));

const documentStoreFxnFragments = [
  { type: 'function', format: () => 'isActive(bytes32)' },
  { type: 'function', format: () => 'isIssued(bytes32)' },
  { type: 'function', format: () => 'isRevoked(bytes32)' },
  { type: 'function', format: () => 'issue(bytes32)' },
  { type: 'function', format: () => 'name()' },
  { type: 'function', format: () => 'revoke(bytes32)' },
  { type: 'function', format: () => 'grantRole(bytes32, address)' },
  { type: 'function', format: () => 'revokeRole(bytes32, address)' },
];

vi.mock('@trustvc/document-store', () => ({
  DocumentStore__factory: class {
    static abi = ['constructor(string storeName, address owner)'];
    static bytecode = '0x60006000';
    constructor() {
      return {
        deploy: vi.fn(() => ({
          waitForDeployment: vi.fn().mockResolvedValue(undefined),
          target: '0xDeployedDocumentStoreAddress',
          deploymentTransaction: vi.fn(() => ({ hash: 'deploy_tx_hash' })),
          deployTransaction: {
            wait: vi.fn().mockResolvedValue({}),
            hash: 'deploy_tx_hash',
          },
          address: '0xDeployedDocumentStoreAddress',
        })),
      };
    }
  },
  TransferableDocumentStore__factory: class {
    static abi = 'TransferableDocumentStoreABI';
    static bytecode = 'TransferableDocumentStoreBytecode';
    constructor() {
      return {
        deploy: vi.fn(() => ({
          waitForDeployment: vi.fn().mockResolvedValue(undefined),
          target: '0xDeployedTransferableDocumentStoreAddress',
          deploymentTransaction: vi.fn(() => ({ hash: 'transferable_deploy_tx_hash' })),
          deployTransaction: {
            wait: vi.fn().mockResolvedValue({}),
            hash: 'transferable_deploy_tx_hash',
          },
          address: '0xDeployedTransferableDocumentStoreAddress',
        })),
      };
    }
  },
  IDocumentStore__factory: {
    createInterface: vi.fn(() => ({
      fragments: documentStoreFxnFragments,
    })),
  },
  ITransferableDocumentStore__factory: {
    createInterface: vi.fn(() => ({
      fragments: documentStoreFxnFragments,
    })),
  },
}));
const promiseResolveTrue = vi.fn(() => Promise.resolve(true));
const promiseResolveFalse = vi.fn(() => Promise.resolve(false));
const callStaticFxn = {
  issue: vi.fn(),
  revoke: vi.fn(),
  grantRole: vi.fn(),
  revokeRole: vi.fn(),
};
export const mockDocumentStoreContract = {
  callStatic: callStaticFxn,
  issue: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('document_store_issue_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveTrue,
    },
  ),
  revoke: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('document_store_revoke_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveTrue,
    },
  ),
  grantRole: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('document_store_grant_role_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveTrue,
    },
  ),
  revokeRole: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('document_store_revoke_role_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveTrue,
    },
  ),
  isIssued: promiseResolveTrue,
  isRevoked: promiseResolveFalse,
  isActive: promiseResolveTrue,
  name: vi.fn(() => Promise.resolve('Test Document Store')),
};

export const mockTransferableDocumentStoreContract = {
  callStatic: callStaticFxn,
  issue: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('transferable_document_store_issue_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveTrue,
    },
  ),
  revoke: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('transferable_document_store_revoke_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveTrue,
    },
  ),
  grantRole: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('transferable_document_store_grant_role_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveTrue,
    },
  ),
  revokeRole: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('transferable_document_store_revoke_role_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveTrue,
    },
  ),
  isIssued: promiseResolveTrue,
  isRevoked: promiseResolveFalse,
  isActive: promiseResolveTrue,
  name: vi.fn(() => Promise.resolve('Test Transferable Document Store')),
};

export const mockTTDocumentStoreContract = {
  callStatic: callStaticFxn,
  issue: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('tt_document_store_issue_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveFalse,
    },
  ),
  revoke: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('tt_document_store_revoke_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveFalse,
    },
  ),
  grantRole: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('tt_document_store_grant_role_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveFalse,
    },
  ),
  revokeRole: Object.assign(
    // Direct call returns transaction response
    vi.fn(() => Promise.resolve('tt_document_store_revoke_role_tx_hash')),
    {
      // Static call returns boolean
      staticCall: promiseResolveFalse,
    },
  ),
  isIssued: promiseResolveFalse,
  isRevoked: promiseResolveFalse,
  isActive: promiseResolveTrue,
  name: vi.fn(() => Promise.resolve('Test TT Document Store')),
};

// Note: Dummy test wallets — private keys for local development and CI/CD only.
// These wallets are not for production and hold no funds or value on any network.
export const PRIVATE_KEY = '0x59c6995e998f97a5a004497e5f1ebce0c16828d44b3f8d0bfa3a89d271d5b6b9';

export const providerV5 = new ethersV5.providers.JsonRpcProvider();
export const providerV6 = new JsonRpcProviderV6();
