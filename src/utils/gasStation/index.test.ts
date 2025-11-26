import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BigNumber } from 'ethers';
import fetch from 'node-fetch';
import { gasStation } from './index';

vi.mock('node-fetch', () => ({
  __esModule: true,
  default: vi.fn(),
}));
const mockedFetch = vi.mocked(fetch);

describe('gasStation', () => {
  beforeEach(() => {
    mockedFetch.mockClear();
  });

  it('should return undefined when gasStationUrl is empty', async () => {
    const getGasPrice = gasStation('');
    const result = await getGasPrice();
    expect(result).toBeUndefined();
    expect(mockedFetch).not.toHaveBeenCalled();
  });

  it('should return gas price data when fetch is successful', async () => {
    const mockResponse = {
      standard: {
        maxPriorityFee: '2.5',
        maxFee: '25.5',
      },
    };

    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    } as any);

    const getGasPrice = gasStation('https://gasstation.example.com');
    const result = await getGasPrice();

    expect(mockedFetch).toHaveBeenCalledWith('https://gasstation.example.com');
    expect(result).toBeDefined();
    expect(result?.maxPriorityFeePerGas).toEqual(BigNumber.from('2500000000'));
    expect(result?.maxFeePerGas).toEqual(BigNumber.from('25500000000'));
  });
  it('should return gas price data when fetch is successful, with 0 fees', async () => {
    const mockResponse = {
      standard: {
        maxPriorityFee: '0',
        maxFee: '0',
      },
    };

    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    } as any);

    const getGasPrice = gasStation('https://gasstation.example.com');
    const result = await getGasPrice();

    expect(mockedFetch).toHaveBeenCalledWith('https://gasstation.example.com');
    expect(result).toBeDefined();
    expect(result?.maxPriorityFeePerGas).toEqual(BigNumber.from('0'));
    expect(result?.maxFeePerGas).toEqual(BigNumber.from('0'));
  });

  it('should throw error when fetch fails', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network error'));

    const getGasPrice = gasStation('https://gasstation.example.com');
    await expect(getGasPrice()).rejects.toThrow('Failed to fetch gas station');
  });

  it('should throw error when response contains invalid gwei values', async () => {
    const mockResponse = {
      standard: {
        maxPriorityFee: 'invalid',
        maxFee: '25.5',
      },
    };

    mockedFetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockResponse),
    } as any);

    const getGasPrice = gasStation('https://gasstation.example.com');
    await expect(getGasPrice()).rejects.toThrow('Failed to fetch gas station');
  });
});
