// Deliberately does NOT import `./fixtures` — that file mocks `@trustvc/document-store`
// with a fake ABI, which is exactly what let the real overload issue below go unnoticed.
// This test exercises the actual published ABI against real ethers Contract instances.
import { describe, expect, it } from 'vitest';
import { ethers as ethersV5 } from 'ethers';
import { ethers as ethersV6 } from 'ethersV6';
import { DocumentStore__factory } from '@trustvc/document-store';

const DUMMY_ADDRESS = '0x0000000000000000000000000000000000dEaD';

describe('DocumentStore ABI — revoke overload', () => {
  it('has two revoke overloads, which is why it cannot be called by its bare name', () => {
    const revokeFragments = DocumentStore__factory.abi.filter(
      (fragment) => fragment.type === 'function' && fragment.name === 'revoke',
    );
    expect(revokeFragments).toHaveLength(2);
  });

  it('ethers v5: bare `.revoke` / `.callStatic.revoke` are undefined; the full signature works', () => {
    const provider = new ethersV5.providers.JsonRpcProvider();
    const contract = new ethersV5.Contract(DUMMY_ADDRESS, DocumentStore__factory.abi, provider);

    expect(contract.revoke).toBeUndefined();
    expect(contract.callStatic.revoke).toBeUndefined();

    expect(typeof contract['revoke(bytes32)']).toBe('function');
    expect(typeof contract.callStatic['revoke(bytes32)']).toBe('function');
  });

  it('ethers v6: the full signature resolves correctly (v6 can also disambiguate the bare name by arg count, unlike v5)', () => {
    const provider = new ethersV6.JsonRpcProvider();
    const contract = new ethersV6.Contract(DUMMY_ADDRESS, DocumentStore__factory.abi, provider);

    const revokeMethod = contract['revoke(bytes32)'] as unknown as { staticCall: unknown };
    expect(typeof revokeMethod.staticCall).toBe('function');
  });
});
