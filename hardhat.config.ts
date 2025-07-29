import 'tsconfig-paths/register';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomiclabs/hardhat-ethers';
import '@nomicfoundation/hardhat-chai-matchers';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        count: 20,
        accountsBalance: '1000000000000000000000', // 1000 ETH
      },
    },
    localhost: {
      url: 'http://127.0.0.1:8545',
      chainId: 1337,
    },
  },
  mocha: {
    timeout: 60000,
  },
};

export default config;
