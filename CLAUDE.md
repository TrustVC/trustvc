# CLAUDE.md

Guidance for working in this repo — for human developers and for Claude Code.

> **Keep this file alive.** It's only useful if it stays true. Treat it as part of the
> code: when a change makes something here wrong or incomplete, update it *in the same
> commit/PR*. See [Maintaining this file](#maintaining-this-file).

## What this repo is

`@trustvc/trustvc` is the **umbrella SDK** that ties together document issuance,
signing and verification across **two worlds**:

- **OpenAttestation / OpenCert** — hash-based documents, token registry / document
  store, on-chain transferable records (ethers + hardhat).
- **W3C Verifiable Credentials / Presentations** — Data Integrity proofs, selective
  disclosure, DID-based issuers/holders.

It depends on the **published** `@trustvc/w3c*` packages (the crypto core lives in the
separate `w3c` monorepo — see [w3c section](#relationship-to-the-w3c-monorepo)):

```
@trustvc/w3c  @trustvc/w3c-vc  @trustvc/w3c-context
@trustvc/w3c-credential-status  @trustvc/w3c-issuer   → all pinned ^2.3.0
```

Source map (`src/`):

| Path | What |
| --- | --- |
| `src/core/verify.ts` | **`verifyDocument()`** — the unified verify entry point (OA + W3C). |
| `src/core/endorsement-chain/useEndorsementChain.ts` | **`fetchEndorsementChain()`** — unified V4/V5/Obligation escrow path (auto-detects contract type). |
| `src/verify/verify.ts` | `verificationBuilder`, `openAttestationVerifiers`, `w3cVerifiers`. |
| `src/verify/fragments/` | Verifier fragments by dimension: `document-integrity`, `document-status`, `issuer-identity`, `presentation`. |
| `src/w3c/` | The W3C surface: `sign`, `derive`, `verify`, **`presentation`** (VP wrappers), `types`. |

## Commands

Node **≥ 20** — `engines` is enforced. Use `nvm use 20`; on Node 18 the install/tests fail.

```bash
npm test                 # vitest --run --test-timeout=15000
npm run type-check       # tsc --noEmit
npm run lint             # eslint, --max-warnings=0 (CI fails on ANY warning)
npm run build            # clean + tsup
npm run test:e2e         # hardhat node + on-chain tests (token registry / document store)

# One file / one test:
npx vitest --run src/__tests__/w3c/presentation.test.ts
npx vitest --run <file> -t "does not match the holder"
```

**Before "done": run `npm run type-check` AND `npm run lint`.** `lint` is
`--max-warnings=0`; a single warning is a red build.

**Tests hit the network.** did:web resolution and StatusList fetches go to
`trustvc.github.io` (e.g. `.../did/1`, `.../credentials/statuslist/1`). These are real
integration checks — don't mock them away. On-chain tests need the hardhat node
(`test:e2e`).

## Verifiable Presentations (`src/w3c/presentation.ts`)

The trustvc layer is **opinionated**: it wraps the raw `@trustvc/w3c-vc` primitives and
**enforces policies so callers can't disable them.**

**`signW3CPresentation(credentials, keyPair, options)`** — create **and** sign in one
call. Enforced:
- **`fullDisclosure`** — a base (non-derived) SD credential is **auto-full-disclosed**;
  callers may pass underived credentials.
- **`checkHolderBinding`** — signing-key DID **==** holder **==** every
  `credentialSubject.id`. The **issuer is deliberately NOT part of this** — a credential
  issued by a different party (e.g. a did:web issuer) is fine.
- **Mandatory lifetime** — the caller MUST pass `expiresInSeconds` or `validUntil`.
- **`version: 'v2'`** — the presentation **envelope is always VC Data Model v2.0**
  (`validFrom`/`validUntil`); `version` is dropped from the caller options. Embedded
  credentials keep their own version (a v1.1 VC can sit inside a v2 envelope).
- Suite is `ecdsa-rdfc-2019` (a non-ECDSA key → error). `challenge` → `authentication`
  proof; no challenge → `assertionMethod`.

**`verifyW3CPresentation(presentation, options)`** — enforces **`checkHolderBinding`**;
verifies each embedded credential (signature **+ expiry + revocation**) and the holder
proof. An unsigned VP **fails** here.

**When you add or change a policy, change it in the wrapper — not by trusting callers —
and keep create/verify symmetric** (if create rejects something, verify must too).

## VP verification fragments (`src/verify/fragments/presentation/`)

Three aggregate verifiers plug into `verifyDocument()`'s pipeline via `w3cVerifiers`:

- `w3cVpSignatureIntegrity` (DOCUMENT_INTEGRITY) — **requires a holder proof** (unsigned
  → INVALID), verifies the proof crypto, and enforces **holder binding** in-fragment.
  Freshness (challenge/domain) is intentionally out of scope — a stateless pipeline
  can't check it.
- `w3cVpCredentialStatus` (DOCUMENT_STATUS) — VP expiry + each embedded credential's
  StatusList revocation.
- `w3cVpIssuerIdentity` (ISSUER_IDENTITY) — each embedded issuer resolves.

`isVpDocument()` (the `test()` gate) routes on shape only (`type` includes
`VerifiablePresentation` + has `verifiableCredential`) — it does **not** look at `proof`,
so an unsigned VP is still routed in and then judged INVALID by the integrity fragment.

**Consistency note:** the fragment pipeline and `verifyW3CPresentation` were deliberately
aligned to both enforce proof-presence + holder binding. If you touch one, keep the other
in step.

## Endorsement chain (`src/core/endorsement-chain/useEndorsementChain.ts`)

**`fetchEndorsementChain()`** is the single public path for Token Registry V4/V5 and
Obligation/BoE titles. It auto-detects the escrow contract via `supportsInterface`
(including `supportInterfaceIdsV5.ObligationEscrow` around the obligation check).

These public aliases were removed:

| Removed | Use instead |
| --- | --- |
| `fetchObligationEndorsementChain` | `fetchEndorsementChain` |
| `fetchEscrowTransfersObligation` | `fetchEscrowTransfersV5` (auto-detects obligation status events) |
| `ObligationEscrowInterface` | `supportInterfaceIdsV5.ObligationEscrow` |

Do **not** re-add the removed aliases. User-facing docs also live in `README.md`
(Obligation Registry section).

## Gotchas (hard-won — add to this list)

- **Endorsement chain has one public path.** See
  [Endorsement chain](#endorsement-chain-srccoreendorsement-chainuseendorsementchaints)
  — do not re-add `fetchObligationEndorsementChain`, `fetchEscrowTransfersObligation`,
  or `ObligationEscrowInterface`.
- **Obligation mint merges to INITIAL.** ObligationEscrow emits `StatusInitialized`
  in the same tx as `TokenReceived(isMinting)` (often *before* it in log order).
  `mergeTransfersV5` must prefer `INITIAL` so owner/holder/remarks match classic ETR
  mint rows. Do not let `STATUS_INITIALIZED` win that merge.
- **eBoE shred last parties + reason come from the contract.** ObligationEscrow
  persists `lastBeneficiary` / `lastHolder` in `_deactivate` and emits them on
  `Shred` with `TerminationReason`. SDK maps those onto `RETURN_TO_ISSUER_ACCEPTED`
  (`owner`/`holder`/`terminationReason`). Do not reconstruct parties from transfer
  history as the primary source of truth. Classic ETR shred UI still blanks parties
  (no reason field). **ABI break:** redeploy or upgrade obligation registries /
  escrow impl before validating against live docs.
- **Selective disclosure keeps the subject `id`.** If a credential was issued *with* a
  `credentialSubject.id`, deriving it (even revealing only other fields) **retains that
  id**. To test/produce a credential with *no* subject id, it must be issued without one.
- **Holder binding is string-equality of DIDs and is method-agnostic** (did:key and
  did:web both work). It's independent of the issuer.
- **StatusList test indices** on `.../statuslist/1`: index **5 → revoked**, index
  **10 → not revoked**. Reuse these instead of inventing new ones.
- **Test fixtures share key material** across did:key and did:web (the same ECDSA key is
  published under `did:key:zDnae…` and `did:web:trustvc.github.io:did:1#multikey-1`). Handy
  for tests, but it means "different DID" ≠ "different key" in fixtures.
- **`VerificationFragment` is a union** — `reason`/`data` aren't on every member; narrow or
  cast when asserting on them in tests.

## Relationship to the w3c monorepo

The VP/VC crypto logic lives in `@trustvc/w3c-vc` (separate repo, `../w3c-10`). To test an
**unpublished** w3c-vc change here, `npm pack` it there and install the tarball; once
published, repoint the dep to the version (`^2.3.0`). Real changes should be validated
here because this repo resolves the packages' full dep tree (and stricter jsonld) — a
green w3c-vc build alone doesn't prove integration.

## Conventions

- **No `!` non-null assertions** in tests — use the `assertDefined` helper.
- Prefer `as never` at test boundaries for intentionally loose fixture typing; avoid `any`.
- Conventional commits (commitlint + semantic-release drive versioning/CHANGELOG).
- Match the surrounding file's style; keep comments explaining *why* for the subtle rules
  above.

## Maintaining this file

**Documentation-as-code. Keep it in sync in the same change that makes it stale — not
"later".** Update this file when your change touches:

- **A public export or its behavior** (a new/renamed function, changed signature).
- **A VP policy or invariant** — the enforced flags, holder binding, v2 lock, create/verify
  symmetry, the fragment pipeline's proof-presence check.
- **Commands, tooling, or Node/engine requirements** — keep the Commands section runnable.
- **A gotcha you just spent time on** — new gotchas are the highest-value additions.

Guidelines: small-and-true beats big-and-stale (delete guidance that no longer holds);
keep it repo-specific and actionable; link to source-of-truth over duplicating detail;
preserve the *why* on load-bearing rules.

**For Claude Code specifically:** at the end of a task that changed any of the above,
check whether this file is now inaccurate and propose the edit as part of the same
work — don't wait to be asked.
