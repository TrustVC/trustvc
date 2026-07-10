import { ethers as ethersV6 } from 'ethersV6';
import { describe, expect, it } from 'vitest';
import { TitleEscrow__factory } from '../../token-registry-v5/contracts';
import { fetchEscrowTransfersV5 } from '../../core/endorsement-chain/fetchEscrowTransfer';

const ESCROW_ADDRESS = '0x24c9C688cf919D133abB512A41163972dA150f1b';
const REGISTRY_ADDRESS = '0x3781bd0bbd15Bf5e45c7296115821933d47362be';
const HOLDER = '0x433097a1C1b8a3e9188d8C54eCC057B1D69f1638';
const BENEFICIARY = '0xCA93690Bb57EEaB273c796a9309246BC0FB93649';
const TOKEN_ID = 1n;

const remark = (text: string): string => ethersV6.hexlify(ethersV6.toUtf8Bytes(text));

describe('fetchEscrowTransfersV5 - Status events', () => {
  const iface = new ethersV6.Interface(TitleEscrow__factory.abi);

  const encodeLog = (eventName: string, args: unknown[]) => {
    const fragment = iface.getEvent(eventName)!;
    const { data, topics } = iface.encodeEventLog(fragment, args);
    return {
      address: ESCROW_ADDRESS,
      topics,
      data,
      blockNumber: 100,
      blockHash: `0x${'11'.repeat(32)}`,
      transactionHash: `0x${'22'.repeat(32)}`,
      transactionIndex: 0,
      index: 0,
      removed: false,
    };
  };

  const logsByTopic = new Map<string, unknown[]>([
    [
      iface.getEvent('StatusAccepted')!.topicHash,
      [encodeLog('StatusAccepted', [HOLDER, REGISTRY_ADDRESS, TOKEN_ID, remark('accepted')])],
    ],
    [
      iface.getEvent('StatusRejected')!.topicHash,
      [encodeLog('StatusRejected', [HOLDER, REGISTRY_ADDRESS, TOKEN_ID, remark('rejected')])],
    ],
    [
      iface.getEvent('StatusDischarged')!.topicHash,
      [
        encodeLog('StatusDischarged', [
          BENEFICIARY,
          REGISTRY_ADDRESS,
          TOKEN_ID,
          remark('discharged'),
        ]),
      ],
    ],
  ]);

  const provider = new ethersV6.JsonRpcProvider('http://localhost:1', 11155111, {
    staticNetwork: true,
  });

  (provider as any)._send = async (payload: any) => {
    const requests = Array.isArray(payload) ? payload : [payload];
    return requests.map((request: any) => {
      if (request.method === 'eth_getLogs') {
        const topic = request.params[0]?.topics?.[0];
        return { id: request.id, result: logsByTopic.get(topic) ?? [] };
      }
      return { id: request.id, result: null };
    });
  };

  it('maps StatusAccepted/Rejected/Discharged into the endorsement chain event types', async () => {
    const events = await fetchEscrowTransfersV5(provider, ESCROW_ADDRESS, REGISTRY_ADDRESS);

    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'STATUS_ACCEPTED',
        holder: HOLDER,
        remark: remark('accepted'),
      }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'STATUS_REJECTED',
        holder: HOLDER,
        remark: remark('rejected'),
      }),
    );
    expect(events).toContainEqual(
      expect.objectContaining({
        type: 'STATUS_DISCHARGED',
        owner: BENEFICIARY,
        remark: remark('discharged'),
      }),
    );
  });
});
