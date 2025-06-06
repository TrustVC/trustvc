import { generateTestingUtils } from 'eth-testing';
import { ethers } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { describe, expect, it, vi } from 'vitest';
import { fetchEndorsementChain } from '../../core';
import _ from 'lodash';
import { testCases } from '../fixtures/endorsement-chain';

const provider = ethers.providers.JsonRpcProvider;
const providerV6 = ethersV6.JsonRpcProvider;

describe.concurrent('fetch endorsement chain', () => {
  testCases
    .filter((a) => !a.mock && !process.env.CI)
    .forEach(
      ({
        rpcUrl,
        description,
        tokenRegistryAddress,
        tokenId,
        expected,
        expectedError,
        timeout,
      }) => {
        it.concurrent.each([
          {
            Provider: provider,
            name: 'ethers v5 provider',
          },
          {
            Provider: providerV6,
            name: 'ethers v6 provider',
          },
        ])(
          `should work correctly for ${description}, $name`,
          async ({ Provider }) => {
            const provider = new Provider(rpcUrl);
            if (expectedError) {
              await expect(
                fetchEndorsementChain(tokenRegistryAddress, tokenId, provider),
              ).rejects.toThrow(expectedError);
            } else {
              const result = await fetchEndorsementChain(tokenRegistryAddress, tokenId, provider);
              expect(result).toBeTruthy();
              expect(result).toStrictEqual(expected);
            }
          },
          timeout,
        );
      },
    );

  it('default test', () => true);
});

// Mocked test cannot run concurrently
describe('fetch endorsement chain - Mocked', () => {
  testCases
    .filter((a) => a.mock)
    .forEach(
      ({
        rpcUrl,
        description,
        tokenRegistryAddress,
        tokenId,
        expected,
        expectedError,
        timeout,
        mock,
      }) => {
        it.each([
          {
            Provider: provider,
            name: 'ethers v5 provider',
          },
          {
            Provider: providerV6,
            name: 'ethers v6 provider',
          },
        ])(
          `should work correctly for ${description}, $name`,
          async ({ Provider }) => {
            if (mock) {
              const grouped = _.groupBy(mock, 'function');
              for (const [group, value] of Object.entries(
                grouped as { [key: string]: { function: string; params: any; result: any }[] },
              )) {
                const originalMethod = (Provider.prototype as any)[group];
                vi.spyOn(Provider.prototype, group as any).mockImplementation(async function (
                  this: InstanceType<typeof Provider>,
                  ...params: any[]
                ) {
                  const cache = new Map();
                  for (const item of value) {
                    cache.set(JSON.stringify(item.params), item.result);
                  }
                  if (cache.has(JSON.stringify(params))) {
                    return cache.get(JSON.stringify(params));
                  } else {
                    console.log(group, `~ params`, params);
                    const result = await originalMethod.apply(this, params);
                    console.log(group, `~ result`, params, result);
                    cache.set(JSON.stringify(params), result);
                    return result;
                  }
                });
              }
            }

            const provider = new Provider(rpcUrl);
            if (expectedError) {
              await expect(
                fetchEndorsementChain(tokenRegistryAddress, tokenId, provider),
              ).rejects.toThrow(expectedError);
            } else {
              const result = await fetchEndorsementChain(tokenRegistryAddress, tokenId, provider);
              expect(result).toBeTruthy();
              expect(result).toStrictEqual(expected);
            }
          },
          timeout,
        );
      },
    );

  it('default test', () => true);
});

describe('fetch endorsement chain - Mocked - Web Provider', () => {
  it.each([testCases[0], testCases[1]])(
    '$description - fetch with ethers v5 Web3Provider',
    { timeout: 180_000 },
    async ({ rpcUrl, tokenRegistryAddress, tokenId, expected, mock }) => {
      const _provider = new ethersV6.JsonRpcProvider(rpcUrl);

      const grouped = _.groupBy(mock, 'function');
      for (const [group, value] of Object.entries(
        grouped as { [key: string]: { function: string; params: any; result: any }[] },
      )) {
        vi.spyOn(ethers.providers.Web3Provider.prototype, group as any).mockImplementation(
          async (...params: any[]) => {
            const cache = new Map();
            for (const item of value) {
              cache.set(JSON.stringify(item.params), item.result);
            }
            if (cache.has(JSON.stringify(params))) {
              return cache.get(JSON.stringify(params));
            } else {
              const result = await (_provider as any)[group](...params);
              cache.set(JSON.stringify(params), result);
              return result;
            }
          },
        );
      }

      const provider = new ethers.providers.Web3Provider(generateTestingUtils().getProvider());

      const result = await fetchEndorsementChain(tokenRegistryAddress, tokenId, provider);
      expect(result).toBeTruthy();
      expect(result).toStrictEqual(expected);
    },
  );

  it.each([testCases[0], testCases[1]])(
    '$description - fetch with ethers v6 BrowserProvider',
    { timeout: 180_000 },
    async ({ rpcUrl, tokenRegistryAddress, tokenId, expected, mock }) => {
      const _provider = new ethersV6.JsonRpcProvider(rpcUrl);

      const grouped = _.groupBy(mock, 'function');
      for (const [group, value] of Object.entries(
        grouped as { [key: string]: { function: string; params: any; result: any }[] },
      )) {
        vi.spyOn(ethersV6.BrowserProvider.prototype, group as any).mockImplementation(
          async (...params: any[]) => {
            const cache = new Map();
            for (const item of value) {
              cache.set(JSON.stringify(item.params), item.result);
            }
            if (cache.has(JSON.stringify(params))) {
              return cache.get(JSON.stringify(params));
            } else {
              const result = await (_provider as any)[group](...params);
              cache.set(JSON.stringify(params), result);
              return result;
            }
          },
        );
      }

      const provider = new ethersV6.BrowserProvider(generateTestingUtils().getProvider());

      const result = await fetchEndorsementChain(tokenRegistryAddress, tokenId, provider);
      expect(result).toBeTruthy();
      expect(result).toStrictEqual(expected);
    },
  );
});
