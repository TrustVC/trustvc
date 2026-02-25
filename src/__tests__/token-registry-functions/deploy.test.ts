import './fixtures';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Wallet as WalletV5 } from 'ethers';
import { deployTokenRegistry } from '../../deploy/token-registry';
import { PRIVATE_KEY, providerV5 } from './fixtures';
import { CHAIN_ID } from '../../utils';
import {
  isV6EthersProvider,
  getEthersContractFromProvider,
  getEthersContractFactoryFromProvider,
} from '../../utils/ethers';
import {
  getChainIdSafe,
  getDefaultContractAddress,
  isSupportedTitleEscrowFactory,
  isValidAddress,
} from '../../token-registry-functions/utils.js';

describe('Deploy Token Registry', () => {
  const mockRegistryName = 'Test Token Registry';
  const mockRegistrySymbol = 'TTR';
  const mockChainId = CHAIN_ID.sepolia;
  const mockFactoryAddress = '0x1234567890123456789012345678901234567890';
  const mockDeployerAddress = '0xabcdabcdabcdabcdabcdabcdabcdabcdabcdabcd';
  const mockImplAddress = '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ethers v6 deployment scenarios', () => {
    it('should deploy in quick-start mode with ethers v6', async () => {
      (isSupportedTitleEscrowFactory as any).mockResolvedValue(true);

      const mockContract = {
        deploy: vi.fn().mockResolvedValue({
          address: '0xDeployedTokenRegistry',
          transactionHash: 'quick_start_tx_hash',
        }),
      };

      const providerV6Mock: any = {
        getNetwork: vi.fn().mockResolvedValue({ chainId: mockChainId }),
        provider: {},
      };

      const wallet: any = {
        provider: providerV6Mock,
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      // Mock getEthersContractFromProvider to return our mock contract
      (getEthersContractFromProvider as any).mockReturnValue(
        vi.fn().mockReturnValue(mockContract) as any,
      );

      const result = await deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
        chainId: mockChainId,
        standalone: false,
        deployerContractAddress: mockDeployerAddress,
        tokenRegistryImplAddress: mockImplAddress,
      });

      expect(mockContract.deploy).toHaveBeenCalledWith(
        mockImplAddress,
        '0xencodedparams',
        expect.any(Object),
      );
      expect(result).toEqual({
        address: '0xDeployedTokenRegistry',
        transactionHash: 'quick_start_tx_hash',
      });
    });

    it('should deploy in standalone mode with ethers v6', async () => {
      (isSupportedTitleEscrowFactory as any).mockResolvedValue(true);

      const mockDeployedContract = {
        deploymentTransaction: vi.fn().mockReturnValue({
          wait: vi.fn().mockResolvedValue({
            address: '0xStandaloneTokenRegistryV6',
            transactionHash: 'standalone_v6_tx_hash',
          }),
        }),
      };

      const mockFactory = {
        deploy: vi.fn().mockResolvedValue(mockDeployedContract),
      };

      const providerV6Mock: any = {
        getNetwork: vi.fn().mockResolvedValue({ chainId: mockChainId }),
        provider: {},
      };

      const wallet: any = {
        provider: providerV6Mock,
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      //   const { getEthersContractFactoryFromProvider, isV6EthersProvider } = await import(
      //     '../../utils/ethers/index.js'
      //   );
      (getEthersContractFactoryFromProvider as any).mockReturnValue(
        vi.fn().mockReturnValue(mockFactory) as any,
      );
      (isV6EthersProvider as any).mockReturnValue(true);

      const result = await deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
        chainId: mockChainId,
        standalone: true,
        factoryAddress: mockFactoryAddress,
      });

      expect(mockFactory.deploy).toHaveBeenCalledWith(
        mockRegistryName,
        mockRegistrySymbol,
        mockFactoryAddress,
        expect.any(Object),
      );
      expect(result).toEqual({
        address: '0xStandaloneTokenRegistryV6',
        transactionHash: 'standalone_v6_tx_hash',
      });
    });
  });

  describe('Ethers v5 deployment scenarios', () => {
    it('should deploy in quick-start mode with ethers v5', async () => {
      const mockContract = {
        deploy: vi.fn().mockResolvedValue({
          address: '0xDeployedTokenRegistry',
          transactionHash: 'quick_start_v5_tx_hash',
        }),
      };

      const wallet = new WalletV5(PRIVATE_KEY, providerV5);
      vi.spyOn(wallet, 'getAddress').mockResolvedValue('0xdeployer');

      (getEthersContractFromProvider as any).mockReturnValue(
        vi.fn().mockReturnValue(mockContract) as any,
      );
      (isV6EthersProvider as any).mockReturnValue(false);

      const result = await deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
        chainId: mockChainId,
        standalone: false,
        deployerContractAddress: mockDeployerAddress,
        tokenRegistryImplAddress: mockImplAddress,
      });

      expect(result).toEqual({
        address: '0xDeployedTokenRegistry',
        transactionHash: 'quick_start_v5_tx_hash',
      });
    });

    it('should deploy in standalone mode with ethers v5', async () => {
      const mockDeployedContract = {
        deployTransaction: {
          wait: vi.fn().mockResolvedValue({
            address: '0xStandaloneTokenRegistryV5',
            transactionHash: 'standalone_v5_tx_hash',
          }),
        },
      };

      const mockFactory = {
        deploy: vi.fn().mockResolvedValue(mockDeployedContract),
      };

      const wallet = new WalletV5(PRIVATE_KEY, providerV5);
      vi.spyOn(wallet, 'getAddress').mockResolvedValue('0xdeployer');

      //   const { getEthersContractFactoryFromProvider, isV6EthersProvider } = await import(
      //     '../../utils/ethers/index.js'
      //   );
      (getEthersContractFactoryFromProvider as any).mockReturnValue(
        vi.fn().mockReturnValue(mockFactory) as any,
      );
      (isV6EthersProvider as any).mockReturnValue(false);

      const result = await deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
        chainId: mockChainId,
        standalone: true,
        factoryAddress: mockFactoryAddress,
      });

      expect(result).toEqual({
        address: '0xStandaloneTokenRegistryV5',
        transactionHash: 'standalone_v5_tx_hash',
      });
    });

    it('should use default addresses when custom addresses not provided', async () => {
      const mockContract = {
        deploy: vi.fn().mockResolvedValue({
          address: '0xDeployedTokenRegistry',
          transactionHash: 'default_addr_tx_hash',
        }),
      };

      const wallet: any = {
        provider: { provider: {}, getNetwork: vi.fn() },
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      (getEthersContractFromProvider as any).mockReturnValue(
        vi.fn().mockReturnValue(mockContract) as any,
      );

      await deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
        chainId: mockChainId,
        standalone: false,
      });

      expect(mockContract.deploy).toHaveBeenCalled();
    });

    it('should throw error when network not supported in quick-start mode', async () => {
      (getDefaultContractAddress as any).mockReturnValue({
        TitleEscrowFactory: undefined,
        TokenImplementation: undefined,
        Deployer: undefined,
      });

      const wallet: any = {
        provider: { provider: {}, getNetwork: vi.fn() },
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      await expect(
        deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
          chainId: 999 as unknown as CHAIN_ID,
          standalone: false,
        }),
      ).rejects.toThrow('currently is not supported');
    });
  });

  describe('Configuration and defaults', () => {
    it('should use default factory address when not provided', async () => {
      (isSupportedTitleEscrowFactory as any).mockResolvedValue(true);
      (getDefaultContractAddress as any).mockReturnValue({
        TitleEscrowFactory: mockFactoryAddress,
        TokenImplementation: mockImplAddress,
        Deployer: mockDeployerAddress,
      });

      const mockDeployedContract = {
        deployTransaction: {
          wait: vi.fn().mockResolvedValue({
            address: '0xDefaultFactoryTokenRegistry',
            transactionHash: 'default_factory_tx_hash',
          }),
        },
      };

      const mockFactory = {
        deploy: vi.fn().mockResolvedValue(mockDeployedContract),
      };

      const wallet: any = {
        provider: { provider: {}, getNetwork: vi.fn() },
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      (getEthersContractFactoryFromProvider as any).mockReturnValue(
        vi.fn().mockReturnValue(mockFactory) as any,
      );

      await deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
        chainId: mockChainId,
        standalone: true,
      });

      expect(mockFactory.deploy).toHaveBeenCalledWith(
        mockRegistryName,
        mockRegistrySymbol,
        mockFactoryAddress,
        expect.any(Object),
      );
    });

    it('should throw error when factory address not supported', async () => {
      (isSupportedTitleEscrowFactory as any).mockResolvedValue(false);

      const wallet: any = {
        provider: { provider: {}, getNetwork: vi.fn() },
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      await expect(
        deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
          chainId: mockChainId,
          standalone: true,
          factoryAddress: '0x1234567890123456789012345678901234567890',
        }),
      ).rejects.toThrow('is not supported');
    });

    it('should throw error when network not supported and no factory provided', async () => {
      (getDefaultContractAddress as any).mockReturnValue({
        TitleEscrowFactory: undefined,
        TokenImplementation: undefined,
        Deployer: undefined,
      });

      const wallet: any = {
        provider: { provider: {}, getNetwork: vi.fn() },
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      await expect(
        deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
          chainId: 999 as unknown as CHAIN_ID,
          standalone: true,
        }),
      ).rejects.toThrow('currently is not supported');
    });
  });

  describe('Auto mode selection', () => {
    it('should auto-switch to standalone when quick-start contracts unavailable', async () => {
      // Mock to return true for standalone factory check
      (isSupportedTitleEscrowFactory as any).mockResolvedValue(true);
      (getDefaultContractAddress as any).mockReturnValue({
        TitleEscrowFactory: '0x1234567890123456789012345678901234567890',
        TokenImplementation: undefined, // Missing implementation
        Deployer: undefined, // Missing deployer
      });

      const mockDeployedContract = {
        deployTransaction: {
          wait: vi.fn().mockResolvedValue({
            address: '0xAutoStandaloneRegistry',
            transactionHash: 'auto_standalone_tx_hash',
          }),
        },
      };

      const mockFactory = {
        deploy: vi.fn().mockResolvedValue(mockDeployedContract),
      };

      const wallet: any = {
        provider: { provider: {}, getNetwork: vi.fn() },
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      (getEthersContractFactoryFromProvider as any).mockReturnValue(
        vi.fn().mockReturnValue(mockFactory) as any,
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
        chainId: mockChainId,
        // standalone not explicitly set, should auto-detect
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Defaulting to standalone mode'),
      );
      expect(mockFactory.deploy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Chain ID handling', () => {
    it('should auto-detect chain ID when not provided', async () => {
      // Reset isSupportedTitleEscrowFactory to return true (default behavior)
      (isSupportedTitleEscrowFactory as any).mockResolvedValue(true);

      const mockDeployTransaction = {
        wait: vi.fn().mockResolvedValue({
          address: '0xAutoChainIdRegistry',
          transactionHash: 'auto_chain_tx_hash',
        }),
      };

      const mockContract = {
        deploy: vi.fn().mockResolvedValue({
          address: '0xAutoChainIdRegistry',
          transactionHash: 'auto_chain_tx_hash',
        }),
        deployTransaction: mockDeployTransaction,
      };

      const wallet: any = {
        provider: {
          provider: {},
          getNetwork: vi.fn().mockResolvedValue({ chainId: mockChainId }),
        },
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      (getEthersContractFromProvider as any).mockReturnValue(
        vi.fn().mockReturnValue(mockContract) as any,
      );

      (getChainIdSafe as any).mockResolvedValue(CHAIN_ID.sepolia as unknown as number);

      await deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
        chainId: mockChainId,
      });
    });
  });

  describe('Address validation', () => {
    it('should validate custom factory address format', async () => {
      // Use ethers v5 for this test
      (isV6EthersProvider as any).mockReturnValue(false);

      (isValidAddress as any).mockImplementation(
        (addr: any) => addr && addr.startsWith('0x') && addr.length === 42,
      );

      const wallet: any = {
        provider: { provider: {}, getNetwork: vi.fn() },
        getAddress: vi.fn().mockResolvedValue('0xdeployer'),
      };

      const mockDeployedContract = {
        deployTransaction: {
          wait: vi.fn().mockResolvedValue({
            address: '0xStandaloneTokenRegistry',
            transactionHash: 'invalid_addr_tx_hash',
          }),
        },
      };

      const mockFactory = {
        deploy: vi.fn().mockResolvedValue(mockDeployedContract),
      };

      (getEthersContractFactoryFromProvider as any).mockReturnValue(
        vi.fn().mockReturnValue(mockFactory) as any,
      );

      // Should use default address when custom address is invalid
      await deployTokenRegistry(mockRegistryName, mockRegistrySymbol, wallet, {
        chainId: mockChainId,
        standalone: true,
        factoryAddress: '0xinvalidaddress',
      });

      expect(mockFactory.deploy).toHaveBeenCalledWith(
        mockRegistryName,
        mockRegistrySymbol,
        '0x1234567890123456789012345678901234567890',
        expect.any(Object),
      );
    });
  });
});
