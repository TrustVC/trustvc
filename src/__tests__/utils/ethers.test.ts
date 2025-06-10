import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { describe, expect, it } from 'vitest';
import { isV6EthersProvider } from '../../utils/ethers';

describe('Ethers Utils', () => {
  describe('isV6EthersProvider', () => {
    it('should return false for an ethers v5 provider', () => {
      const provider = new ethers.providers.JsonRpcProvider('');
      expect(isV6EthersProvider(provider)).toBe(false);
    });

    it('should return false for an ethers v5 signer', () => {
      const wallet = ethers.Wallet.createRandom();
      const signer = wallet.connect(new ethers.providers.JsonRpcProvider(''));
      expect(isV6EthersProvider(signer)).toBe(false);
    });

    it('should return true for an ethers v6 provider', () => {
      // ethers v6 Provider has a 'provider' property which is an instance of itself (or specific structure)
      // or lacks the _isProvider property
      const provider = new ethersV6.JsonRpcProvider('');
      expect(isV6EthersProvider(provider)).toBe(true);
    });

    it('should return true for an ethers v6 signer', () => {
      const wallet = ethersV6.Wallet.createRandom();
      const signer = wallet.connect(new ethersV6.JsonRpcProvider(''));
      expect(isV6EthersProvider(signer)).toBe(true);
    });

    it('should throw error for a non-ethers object', () => {
      const notProvider = { someOtherProperty: 'value' };
      expect(() => isV6EthersProvider(notProvider)).toThrowError('Unknown provider type');
    });

    it('should throw for null', () => {
      expect(() => isV6EthersProvider(null)).toThrowError('Unknown provider type');
    });

    it('should throw for undefined', () => {
      expect(() => isV6EthersProvider(undefined)).toThrowError('Unknown provider type');
    });
  });
});
