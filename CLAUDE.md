# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrustVC is a TypeScript library for signing and verifying W3C Verifiable Credentials and OpenAttestation Verifiable Documents. It wraps TradeTrust libraries and smart contracts (Token Registry V4/V5, Document Store) into a single package published as `@trustvc/trustvc` on npm.

- Node.js >= 20.0.0 required
- License: Apache-2.0

## Commands

```bash
# Install
npm install

# Build (CJS + ESM + types via tsup)
npm run build

# Run all unit tests (vitest, 15s timeout)
npm run test

# Run tests in watch mode
npm run test:watch

# Run a single test file
npx vitest --run src/__tests__/core/encryption.test.ts

# Run tests matching a pattern
npx vitest --run --grep "pattern"

# E2E tests (starts Hardhat node on port 8545, then runs tests)
npm run test:e2e

# Type checking
npm run type-check

# Lint (zero warnings tolerance)
npm run lint

# Lint with auto-fix
npm run lint:fix
```

## Architecture

Single-package library (not a monorepo). Source lives in `src/` with these modules:

| Module | Purpose |
|---|---|
| `core/` | Encrypt/decrypt (ChaCha20), verify, endorsement-chain, documentBuilder |
| `w3c/` | W3C VC sign, verify, derive (selective disclosure). Sub-modules: context, issuer, vc, credential-status |
| `open-attestation/` | OA document wrapping (v2/v3), signing, verification, encryption |
| `document-store/` | Smart contract interactions: deploy, issue, revoke, grant/revoke roles, transfer ownership |
| `token-registry-v4/`, `token-registry-v5/` | TradeTrust Token Registry contract factories and utilities |
| `token-registry-functions/` | Token operations: transfer, mint, reject, return, ownerOf |
| `verify/` | Universal verification with fragment plugins |
| `utils/` | Network config, supported chains, gas station, AWS KMS signer, string utils, analytics |
| `dnsprove/` | DNS proof verification |
| `transaction/` | Transaction cancellation |
| `open-cert/` | OpenCert document verification |
| `deploy/` | Token registry and document store deployment |

All modules are re-exported from `src/index.ts`. The package also provides subpath exports (e.g., `@trustvc/trustvc/core`, `@trustvc/trustvc/w3c`).

## Build System

Uses **tsup** (`tsup.config.ts`) producing three outputs:
- `dist/cjs/` - CommonJS
- `dist/esm/` - ES Modules (via `legacyOutput: true`)
- `dist/types/` - TypeScript declarations

JSON files from `src/` are copied into CJS and ESM output dirs post-build. TypeScript config: target ESNext, module NodeNext, strict mode, path alias `src/*` -> `./src/*`.

## Testing

- **Vitest** with globals enabled (no imports needed for `describe`, `it`, `expect`)
- Tests in `src/__tests__/` mirror source structure; fixtures in `src/__tests__/fixtures/`
- E2E tests in `src/__tests__/e2e/` are excluded from unit test runs; they require a Hardhat node
- CI retries tests 3 times; local runs have no retries
- Coverage via V8 provider, output to `.coverage/`
- Environment variables loaded from `.env`

## Code Style

- **ESLint** flat config (`eslint.config.js`): typescript-eslint + prettier + jsdoc
- **Prettier**: single quotes, 100 char width, 2-space indent
- `@typescript-eslint/no-explicit-any` is allowed in test files and `*.types.ts`
- **Husky** pre-commit hook runs lint-staged (eslint --fix + prettier on staged `*.{js,ts}`)
- **Commitlint** enforces conventional commits on commit messages

## Dual Ethers Versions

The project uses both ethers v5 (peer/direct dependency as `ethers`) and ethers v6 (aliased as `ethersV6` via `npm:ethers@^6`). Be aware of which version a module uses when making changes.

## Release

Automated via `semantic-release` on push to `main` (release) or `v1` (alpha prerelease). Commit types: `feat` -> minor, `fix`/`perf` -> patch, `BREAKING CHANGE` -> major.
