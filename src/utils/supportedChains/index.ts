import 'dotenv/config';
import { gasStation, GasStationFeeData } from '../gasStation';
import { iconAstron, iconEthereum, iconPolygon, iconStability, iconXDC } from '../static/icons';
import { networkCurrency, networkName, networkType } from './../network';

export enum CHAIN_ID {
  local = '1337',
  mainnet = '1',
  matic = '137',
  amoy = '80002',
  sepolia = '11155111',
  xdc = '50',
  xdcapothem = '51',
  stabilitytestnet = '20180427',
  stability = '101010',
  astron = '1338',
  astrontestnet = '21002',
}

export type chainInfo = {
  id: CHAIN_ID;
  label: string;
  name: networkName;
  type: networkType;
  currency: networkCurrency;
  iconImage: string;
  explorerUrl: string;
  explorerApiUrl?: string;
  rpcUrl?: string;
  gasStation?: () => Promise<GasStationFeeData | undefined>;
  nativeCurrency?: {
    name: string;
    symbol: string;
    decimals: number;
  };
};

type supportedChains = Record<CHAIN_ID, chainInfo>;

export const SUPPORTED_CHAINS: supportedChains = {
  [CHAIN_ID.local]: {
    id: CHAIN_ID.local,
    label: 'Local',
    name: 'local',
    type: 'development',
    currency: 'ETH',
    iconImage: iconEthereum,
    explorerUrl: 'https://localhost/explorer',
    rpcUrl: 'http://localhost:8545',
  },
  [CHAIN_ID.mainnet]: {
    id: CHAIN_ID.mainnet,
    label: 'Mainnet',
    name: 'mainnet',
    type: 'production',
    currency: 'ETH',
    iconImage: iconEthereum,
    explorerUrl: 'https://etherscan.io',
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
  },
  [CHAIN_ID.matic]: {
    id: CHAIN_ID.matic,
    label: 'Polygon',
    name: 'matic',
    type: 'production',
    currency: 'MATIC',
    iconImage: iconPolygon,
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
    gasStation: gasStation('https://gasstation.polygon.technology/v2'),
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  [CHAIN_ID.amoy]: {
    id: CHAIN_ID.amoy,
    label: 'Polygon Amoy',
    name: 'amoy',
    type: 'test',
    currency: 'MATIC',
    iconImage: iconPolygon,
    explorerUrl: 'https://www.oklink.com/amoy',
    explorerApiUrl: `https://www.oklink.com/${process.env.OKLINK_API_KEY}`,
    rpcUrl: `https://polygon-amoy.infura.io/v3/${process.env.INFURA_API_KEY}`,
    gasStation: gasStation('https://gasstation.polygon.technology/amoy'),
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'aMATIC',
      decimals: 18,
    },
  },
  [CHAIN_ID.sepolia]: {
    id: CHAIN_ID.sepolia,
    label: 'Sepolia',
    name: 'sepolia',
    type: 'test',
    currency: 'ETH',
    iconImage: iconEthereum,
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
    nativeCurrency: {
      name: 'ETH',
      symbol: 'sepETH',
      decimals: 18,
    },
  },
  [CHAIN_ID.xdc]: {
    id: CHAIN_ID.xdc,
    label: 'XDC Network',
    name: 'xdc',
    type: 'production',
    currency: 'XDC',
    iconImage: iconXDC,
    explorerUrl: 'https://xdcscan.io',
    rpcUrl: 'https://rpc.ankr.com/xdc',
    nativeCurrency: {
      name: 'XDC',
      symbol: 'XDC',
      decimals: 18,
    },
  },
  [CHAIN_ID.xdcapothem]: {
    id: CHAIN_ID.xdcapothem,
    label: 'Apothem Network',
    name: 'xdcapothem',
    type: 'test',
    currency: 'XDC',
    iconImage: iconXDC,
    explorerUrl: 'https://apothem.xdcscan.io',
    rpcUrl: 'https://rpc.ankr.com/xdc_testnet',
    nativeCurrency: {
      name: 'XDC',
      symbol: 'XDC',
      decimals: 18,
    },
  },
  [CHAIN_ID.stabilitytestnet]: {
    id: CHAIN_ID.stabilitytestnet,
    label: 'Stability Testnet Network',
    name: 'stabilitytestnet',
    type: 'test',
    currency: 'FREE',
    iconImage: iconStability,
    explorerUrl: 'https://stability-testnet.blockscout.com/',
    rpcUrl: `https://rpc.testnet.stabilityprotocol.com/zgt/${process.env.STABILITY_TESTNET_API_KEY}`,
    gasStation: gasStation('https://rpc.testnet.stabilityprotocol.com/gas-station'),
    nativeCurrency: {
      name: 'FREE',
      symbol: 'FREE',
      decimals: 18,
    },
  },
  [CHAIN_ID.stability]: {
    id: CHAIN_ID.stability,
    label: 'Stability Network',
    name: 'stability',
    type: 'production',
    currency: 'FREE',
    iconImage: iconStability,
    explorerUrl: 'https://stability.blockscout.com/',
    rpcUrl: `https://rpc.stabilityprotocol.com/zgt/${process.env.STABILITY_API_KEY}`,
    gasStation: gasStation('https://rpc.stabilityprotocol.com/gas-station'),
    nativeCurrency: {
      name: 'FREE',
      symbol: 'FREE',
      decimals: 18,
    },
  },
  [CHAIN_ID.astron]: {
    id: CHAIN_ID.astron,
    label: 'Astron Network',
    name: 'astron',
    type: 'production',
    currency: 'ASTRON',
    iconImage: iconAstron,
    explorerUrl: 'https://astronscanl2.bitfactory.cn/',
    rpcUrl: `https://astronlayer2.bitfactory.cn/rpc/`,
    gasStation: gasStation('https://astronscanl2.bitfactory.cn/gas-station'),
    nativeCurrency: {
      name: 'ASTRON',
      symbol: 'ASTRON',
      decimals: 18,
    },
  },
  [CHAIN_ID.astrontestnet]: {
    id: CHAIN_ID.astrontestnet,
    label: 'Astron Testnet Network',
    name: 'astrontestnet',
    type: 'test',
    currency: 'ASTRON',
    iconImage: iconAstron,
    explorerUrl: 'https://dev-astronscanl2.bitfactory.cn/',
    rpcUrl: `https://dev-astronlayer2.bitfactory.cn/query/`,
    gasStation: gasStation('https://dev-astronscanl2.bitfactory.cn/gas-station'),
    nativeCurrency: {
      name: 'ASTRONTEST',
      symbol: 'ASTRONTEST',
      decimals: 18,
    },
  },
};
