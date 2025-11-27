import { CHAIN_ID, SUPPORTED_CHAINS } from '../supportedChains';

describe('supportedChains', () => {
  it('should local chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.local];

    expect(id).toBe(CHAIN_ID.local);
    expect(name).toBe('local');
    expect(type).toBe('development');
    expect(currency).toBe('ETH');
    expect(explorerUrl).toBe('https://localhost/explorer');
  });

  it('should mainnet chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.mainnet];

    expect(id).toBe(CHAIN_ID.mainnet);
    expect(name).toBe('mainnet');
    expect(type).toBe('production');
    expect(currency).toBe('ETH');
    expect(explorerUrl).toBe('https://etherscan.io');
  });

  it('should matic chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.matic];

    expect(id).toBe(CHAIN_ID.matic);
    expect(name).toBe('matic');
    expect(type).toBe('production');
    expect(currency).toBe('MATIC');
    expect(explorerUrl).toBe('https://polygonscan.com');
  });

  it('should get polygon amoy chain info correctly', () => {
    const { id, name, type, currency, explorerUrl, rpcUrl } = SUPPORTED_CHAINS[CHAIN_ID.amoy];

    expect(id).toBe(CHAIN_ID.amoy);
    expect(name).toBe('amoy');
    expect(type).toBe('test');
    expect(currency).toBe('MATIC');
    expect(explorerUrl).toBe('https://www.oklink.com/amoy');
    expect(rpcUrl).toContain('https://polygon-amoy.infura.io/v3/');
  });

  it('should sepolia chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.sepolia];

    expect(id).toBe(CHAIN_ID.sepolia);
    expect(name).toBe('sepolia');
    expect(type).toBe('test');
    expect(currency).toBe('ETH');
    expect(explorerUrl).toBe('https://sepolia.etherscan.io');
  });
  it('should xdcnetwork chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.xdc];

    expect(id).toBe(CHAIN_ID.xdc);
    expect(name).toBe('xdc');
    expect(type).toBe('production');
    expect(currency).toBe('XDC');
    expect(explorerUrl).toBe('https://xdcscan.io');
  });
  it('should xdcapothem chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.xdcapothem];

    expect(id).toBe(CHAIN_ID.xdcapothem);
    expect(name).toBe('xdcapothem');
    expect(type).toBe('test');
    expect(currency).toBe('XDC');
    expect(explorerUrl).toBe('https://apothem.xdcscan.io');
  });
  it('should stabilitytestnet chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.stabilitytestnet];

    expect(id).toBe(CHAIN_ID.stabilitytestnet);
    expect(name).toBe('stabilitytestnet');
    expect(type).toBe('test');
    expect(currency).toBe('FREE');
    expect(explorerUrl).toBe('https://stability-testnet.blockscout.com/');
  });
  it('should stability chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.stability];

    expect(id).toBe(CHAIN_ID.stability);
    expect(name).toBe('stability');
    expect(type).toBe('production');
    expect(currency).toBe('FREE');
    expect(explorerUrl).toBe('https://stability.blockscout.com/');
  });
  it('should astron chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.astron];

    expect(id).toBe(CHAIN_ID.astron);
    expect(name).toBe('astron');
    expect(type).toBe('production');
    expect(currency).toBe('ASTRON');
    expect(explorerUrl).toBe('https://astronscanl2.bitfactory.cn/');
  });
  it('should astrontestnet chain info correctly', () => {
    const { id, name, type, currency, explorerUrl } = SUPPORTED_CHAINS[CHAIN_ID.astrontestnet];

    expect(id).toBe(CHAIN_ID.astrontestnet);
    expect(name).toBe('astrontestnet');
    expect(type).toBe('test');
    expect(currency).toBe('ASTRON');
    expect(explorerUrl).toBe('https://dev-astronscanl2.bitfactory.cn/');
  });
});
