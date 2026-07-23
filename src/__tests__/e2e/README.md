# TrustVC E2E Tests

Hardhat end-to-end tests for token-registry and obligation-registry SDK flows. These are **not** run by Vitest (`npm run test`); Vitest explicitly excludes `src/__tests__/e2e/**`.

## How to run

From the `trustvc` package root:

```bash
npm run test:e2e
```

This starts a local Hardhat node (`e2e:node` on `http://127.0.0.1:8545`), waits for the port, then runs:

```bash
npx hardhat test src/__tests__/e2e/**/*.test.ts --network hardhat
```

You can also run the steps separately:

```bash
npm run e2e:node          # terminal 1 — local chain, chainId 1337
npm run e2e:test          # terminal 2 — after the node is up
```

Mocha timeout is 60s (see `hardhat.config.ts`). Individual suites raise timeouts where deploy/history needs more time.

## Matrix

| Suite family | ethers | Contracts |
|--------------|--------|-----------|
| Classic token-registry | v5, v6 | TitleEscrow / TradeTrustToken **v4** and **v5** (reject-transfer is v5-only) |
| Obligation (BOE) | v5, v6 | Obligation registry only (**v5-style**; no TitleEscrow v4) |

Shared fixtures live in [`fixtures.ts`](./fixtures.ts). Obligation helpers live in [`obligationUtils.ts`](./obligationUtils.ts).

## Classic suites

| File | Coverage |
|------|----------|
| [`token-registry-functions/transfer.e2e.test.ts`](./token-registry-functions/transfer.e2e.test.ts) | mint, nominate, transferHolder / Beneficiary / Owners |
| [`token-registry-functions/rejectTransfer.e2e.test.ts`](./token-registry-functions/rejectTransfer.e2e.test.ts) | rejectTransferHolder / Beneficiary / Owners |
| [`token-registry-functions/returnToken.e2e.test.ts`](./token-registry-functions/returnToken.e2e.test.ts) | returnToIssuer (+ related reject paths) |

## Obligation suites

| File | Coverage |
|------|----------|
| [`obligation-registry-functions/statusLifecycle.e2e.test.ts`](./obligation-registry-functions/statusLifecycle.e2e.test.ts) | deploy, mint → Issued, accept, document reject, discharge, status / termination readers |
| [`obligation-registry-functions/transfer.e2e.test.ts`](./obligation-registry-functions/transfer.e2e.test.ts) | nominate, transferHolder / Beneficiary / Owners |
| [`obligation-registry-functions/rejectTransfer.e2e.test.ts`](./obligation-registry-functions/rejectTransfer.e2e.test.ts) | rejectTransferHolder / Beneficiary / Owners |
| [`obligation-registry-functions/returnToken.e2e.test.ts`](./obligation-registry-functions/returnToken.e2e.test.ts) | returnToIssuer, rejectReturned (restore), acceptReturned (burn) |
| [`obligation-registry-functions/endorsementChain.e2e.test.ts`](./obligation-registry-functions/endorsementChain.e2e.test.ts) | `fetchObligationEndorsementChain` event order + RPC options smoke |

### Obligation lifecycle (checklist)

```
Deploy factory + registry
        │
        ▼
      Mint ──► Issued
        │
        ├──────────────► Reject (holder) ──► Rejected (terminal)
        │
        ▼
     Accept (holder) ──► Accepted
        │
        ├──────────────► Discharge (beneficiary) ──► Discharged (terminal)
        │
        ├──────────────► Nominate / transfers / reject-transfers
        │
        ▼
  Consolidate dual role (beneficiary == holder)
        │
        ▼
  Return to issuer ──► token held by registry
        │
        ├──────────────► rejectReturned (restore)
        └──────────────► acceptReturned (burn / shred)
```

### BOE role rules (important for writing tests)

- Accept / document reject require `beneficiary != holder` (`OwnerHolderMustDiffer`). Discharge requires only `msg.sender == beneficiary`.
- **returnToIssuer** requires dual role (`beneficiary == holder`).
- Typical path after accept before return: `transferHolder` (or nominate + `transferBeneficiary`) so one wallet holds both roles.
- `terminationReason` is set on reject / discharge / shred (burn), **not** on `returnToIssuer` alone.

### Endorsement chain

`fetchObligationEndorsementChain` is asserted for a mini lifecycle (`STATUS_*`, `TRANSFER_*`, `RETURNED_TO_ISSUER`). Optional `maxBlockRange` / `rpcConcurrency` are smoke-tested; Hardhat has no Alchemy Free 10-block limit, so chunking under rate limits is not stressed here.

## Notes

- Suites call `hardhat_reset` in `before` — expect sequential describe blocks, not parallel file workers fighting one chain.
- Ethers v5 and v6 use **different** Hardhat account key sets in `fixtures.ts` to avoid nonce collisions.
- Obligation deploy uses SDK `deployObligationEscrowFactory` + `deployObligationRegistry`.
- Do not leave Mocha `describe.only` / `it.only` in any e2e file — `.only` is global and skips every other suite.
- To run **only** obligation suites (with `npm run e2e:node` already up):
  `npx hardhat test src/__tests__/e2e/obligation-registry-functions/*.e2e.test.ts --network hardhat`
