export const networks = [
  'local',
  'mainnet',
  'matic',
  'maticmum',
  'amoy',
  'sepolia',
  'xdc',
  'xdcapothem',
  'stabilitytestnet',
  'stability',
  'astron',
  'astrontestnet',
  'zetrixL2Testnet',
] as const;

export type networkName = (typeof networks)[number];

export type networkType = 'production' | 'test' | 'development';

export type networkCurrency = 'ETH' | 'MATIC' | 'POL' | 'XDC' | 'FREE' | 'ASTRON' | 'ZETRIX2';
