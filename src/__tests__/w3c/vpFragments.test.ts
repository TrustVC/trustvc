import { beforeAll, describe, expect, it } from 'vitest';
import { VerificationType } from '@trustvc/w3c-issuer';
import {
  createPresentation,
  deriveCredential,
  getDocumentLoader,
  signCredential,
  SignedVerifiableCredential,
  signPresentation,
} from '@trustvc/w3c-vc';
import { W3C_RAW_CREDENTIAL_V2_0, W3C_VERIFIABLE_DOCUMENT } from '../fixtures/fixtures';
import {
  w3cVpCredentialStatus,
  w3cVpIssuerIdentity,
  w3cVpSignatureIntegrity,
} from '../../verify/fragments/presentation/w3cVpVerifier';
import { w3cIssuerIdentity } from '../../verify/fragments/issuer-identity/w3cIssuerIdentity';
import { verifyDocument } from '../../core/verify';
import { isValid } from '../../verify/verify';

// Asserts a value is defined and returns it narrowed (avoids `!` assertions).
const assertDefined = <T>(value: T | undefined, message: string): T => {
  if (value === undefined) throw new Error(message);
  return value;
};

const PUB = 'zDnaemDNwi4G5eTzGfRooFFu5Kns3be6yfyVNtiaMhWkZbwtc';
const SEC = 'z42tmUXTVn3n9BihE6NhdMpvVBTnFTgmb6fw18o5Ud6puhRW';
const DID = `did:key:${PUB}`;
const holderKey = {
  id: `${DID}#${PUB}`,
  controller: DID,
  type: VerificationType.Multikey,
  publicKeyMultibase: PUB,
  secretKeyMultibase: SEC,
};

describe('W3C VP verification fragments', () => {
  const opts = async () => ({ documentLoader: await getDocumentLoader() });

  // A derived, holder-bound credential (credentialSubject.id === the holder DID) so a
  // signed VP satisfies the pipeline's holder-binding check.
  let embeddedVc: SignedVerifiableCredential;
  beforeAll(async () => {
    const raw = {
      ...W3C_RAW_CREDENTIAL_V2_0,
      issuer: DID,
      validFrom: '2024-04-01T12:19:52Z',
      credentialSubject: { ...W3C_RAW_CREDENTIAL_V2_0.credentialSubject, id: DID },
    };
    const s = await signCredential(raw as never, holderKey as never, 'ecdsa-sd-2023');
    const derived = await deriveCredential(assertDefined(s.signed, 'signed'), [
      '/credentialSubject/id',
      '/credentialSubject/blNumber',
    ]);
    embeddedVc = assertDefined(derived.derived, 'derived');
  });

  it('test() detects a VP and the VC-only issuer verifier skips it', async () => {
    const vp = await createPresentation(embeddedVc as never, { holder: DID });
    const o = {} as never;
    expect(w3cVpSignatureIntegrity.test(vp as never, o)).toBe(true);
    expect(w3cVpCredentialStatus.test(vp as never, o)).toBe(true);
    expect(w3cVpIssuerIdentity.test(vp as never, o)).toBe(true);
    // A VP has no top-level issuer → the single-VC issuer verifier does not handle it.
    expect(w3cIssuerIdentity.test(vp as never, o)).toBe(false);
  });

  it('emits VALID fragments for a signed VP', async () => {
    const vp = await createPresentation(embeddedVc as never, { holder: DID });
    const { signed, error } = await signPresentation(vp, holderKey as never, {
      challenge: 'pipeline-vp-challenge',
    });
    expect(error).toBeUndefined();
    const o = await opts();

    const integrity = await w3cVpSignatureIntegrity.verify(signed as never, o as never);
    const status = await w3cVpCredentialStatus.verify(signed as never, o as never);
    const issuer = await w3cVpIssuerIdentity.verify(signed as never, o as never);

    expect(integrity.type).toBe('DOCUMENT_INTEGRITY');
    expect(integrity.status).toBe('VALID');
    expect(status.type).toBe('DOCUMENT_STATUS');
    expect(status.status).toBe('VALID');
    expect(issuer.type).toBe('ISSUER_IDENTITY');
    expect(issuer.status).toBe('VALID');
  });

  it('emits INVALID integrity for an UNSIGNED VP (no holder proof → not bound)', async () => {
    const vp = await createPresentation(embeddedVc as never, { holder: DID });
    const o = await opts();
    const integrity = await w3cVpSignatureIntegrity.verify(vp as never, o as never);
    expect(integrity.status).toBe('INVALID');
    expect((integrity as { reason?: { message?: string } }).reason?.message).toMatch(/not signed/);
  });

  it('emits INVALID integrity when an embedded credential is tampered', async () => {
    const vp = await createPresentation(embeddedVc as never, { holder: DID });
    const { signed } = await signPresentation(vp, holderKey as never, { challenge: 'c' });
    const tampered = JSON.parse(JSON.stringify(signed));
    const sub = Array.isArray(tampered.verifiableCredential)
      ? tampered.verifiableCredential[0]
      : tampered.verifiableCredential;
    sub.credentialSubject.blNumber = 'TAMPERED';
    const o = await opts();
    const integrity = await w3cVpSignatureIntegrity.verify(tampered, o as never);
    // Tampering an embedded credential breaks the VP holder proof (which signs OVER the
    // credentials), so this trips the proof check, not the per-credential signature branch.
    expect(integrity.status).toBe('INVALID');
  });

  it('names the embedded credential index when its OWN signature is invalid (VP proof still valid)', async () => {
    // Corrupt the credential's signature BEFORE signing the VP, so the holder proof is valid
    // over the corrupted content but the credential's own issuer signature is not. This is the
    // defense-in-depth case: a holder can legitimately sign a VP wrapping a forged credential.
    // `signPresentation` does not re-verify embedded credentials, so this VP is constructible.
    const raw = JSON.parse(
      JSON.stringify(await createPresentation(embeddedVc as never, { holder: DID })),
    );
    const sub = Array.isArray(raw.verifiableCredential)
      ? raw.verifiableCredential[0]
      : raw.verifiableCredential;
    sub.proof.proofValue = String(sub.proof.proofValue).slice(0, -6) + 'ZZZZZZ';
    const { signed } = await signPresentation(raw, holderKey as never, { challenge: 'y' });
    const o = await opts();
    const integrity = await w3cVpSignatureIntegrity.verify(signed as never, o as never);
    expect(integrity.status).toBe('INVALID');
    const message = (integrity as { reason?: { message?: string } }).reason?.message;
    expect(message).toMatch(/index 0/);
    expect(message).toMatch(/signature/i);
  });

  it('emits INVALID integrity when the declared holder does not match the signer (holder binding)', async () => {
    // Holder binding is enforced IN the integrity fragment (independent of the wrapper). A VP
    // whose `holder` differs from the signing key's DID must fail even though the proof crypto
    // is valid over that (mismatched) holder.
    const raw = JSON.parse(
      JSON.stringify(await createPresentation(embeddedVc as never, { holder: DID })),
    );
    raw.holder = 'did:web:someone-else.example'; // differs from the signing key's DID
    const { signed } = await signPresentation(raw, holderKey as never, { challenge: 'hb' });
    const o = await opts();
    const integrity = await w3cVpSignatureIntegrity.verify(signed as never, o as never);
    expect(integrity.status).toBe('INVALID');
    expect((integrity as { reason?: { message?: string } }).reason?.message).toMatch(
      /does not match the declared holder/i,
    );
  });

  it('an EXPIRED embedded credential fails STATUS, not integrity (temporal validity is a status concern)', async () => {
    // Embedded credential expired in 2021; VP created in 2020 (so creation passes) with a
    // long VP lifetime, then verified "now" (2026). The credential is cryptographically
    // authentic and holder-bound, so DOCUMENT_INTEGRITY stays VALID; expiry surfaces under
    // DOCUMENT_STATUS instead.
    const raw = {
      ...W3C_RAW_CREDENTIAL_V2_0,
      issuer: DID,
      validFrom: '2020-01-01T00:00:00Z',
      validUntil: '2021-01-01T00:00:00Z',
      credentialSubject: { ...W3C_RAW_CREDENTIAL_V2_0.credentialSubject, id: DID },
    };
    const s = await signCredential(raw as never, holderKey as never, 'ecdsa-sd-2023');
    const vc = assertDefined(
      (
        await deriveCredential(assertDefined(s.signed, 'signed'), [
          '/credentialSubject/id',
          '/validUntil',
        ])
      ).derived,
      'derived',
    );
    const vp = await createPresentation(vc as never, {
      holder: DID,
      now: new Date('2020-06-01T00:00:00Z'),
      expiresInSeconds: 315360000, // 10y so the VP envelope itself isn't expired
    });
    const { signed } = await signPresentation(vp, holderKey as never, { challenge: 'x' });
    const o = await opts();
    const integrity = await w3cVpSignatureIntegrity.verify(signed as never, o as never);
    const status = await w3cVpCredentialStatus.verify(signed as never, o as never);
    expect(integrity.status).toBe('VALID');
    expect(status.status).toBe('INVALID');
    expect((status as { reason?: { message?: string } }).reason?.message).toMatch(/expired/i);
  });

  it('w3cVpCredentialStatus emits INVALID when the VP ENVELOPE itself has expired', async () => {
    // Distinct from an embedded credential expiring: the presentation's own validUntil is past.
    // This branch runs before any status fetch, so a plain object is enough.
    const vp = {
      type: ['VerifiablePresentation'],
      verifiableCredential: [W3C_VERIFIABLE_DOCUMENT],
      validUntil: '2020-01-01T00:00:00Z',
    };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('INVALID');
    expect((status as { reason?: { message?: string } }).reason?.message).toMatch(
      /Presentation has expired/i,
    );
  });

  it('w3cVpCredentialStatus resolves an embedded StatusList2021Entry (not revoked → VALID)', async () => {
    // W3C_VERIFIABLE_DOCUMENT carries a real StatusList2021Entry (index 10 → not revoked).
    const vp = {
      type: ['VerifiablePresentation'],
      verifiableCredential: [W3C_VERIFIABLE_DOCUMENT],
    };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.type).toBe('DOCUMENT_STATUS');
    expect(status.status).toBe('VALID');
  });

  it('w3cVpCredentialStatus emits INVALID when an embedded credential is REVOKED', async () => {
    // Same status list, index 5 → revoked (mirrors the single-VC W3CCredentialStatus test).
    const revokedVc = {
      ...W3C_VERIFIABLE_DOCUMENT,
      credentialStatus: { ...W3C_VERIFIABLE_DOCUMENT.credentialStatus, statusListIndex: '5' },
    };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [revokedVc] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('INVALID');
    expect((status as { reason?: { message?: string } }).reason?.message).toMatch(/revoked/i);
    expect((status as { reason?: { message?: string } }).reason?.message).toMatch(/index 0/);
  });

  // statuslist/2 is a real BitstringStatusListCredential (the other supported status type):
  // indices 5-9 are revoked, the rest are not. Exercising it proves the fragment handles
  // BitstringStatusListEntry, not only StatusList2021Entry.
  const bitstringEntry = (index: string) => ({
    id: `https://trustvc.github.io/did/credentials/statuslist/2#${index}`,
    type: 'BitstringStatusListEntry',
    statusPurpose: 'revocation',
    statusListIndex: index,
    statusListCredential: 'https://trustvc.github.io/did/credentials/statuslist/2',
  });

  it('w3cVpCredentialStatus resolves a BitstringStatusListEntry (index 10 → not revoked → VALID)', async () => {
    const vc = { ...W3C_VERIFIABLE_DOCUMENT, credentialStatus: bitstringEntry('10') };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [vc] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('VALID');
  });

  it('w3cVpCredentialStatus emits INVALID for a REVOKED BitstringStatusListEntry (index 5)', async () => {
    const vc = { ...W3C_VERIFIABLE_DOCUMENT, credentialStatus: bitstringEntry('5') };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [vc] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('INVALID');
    expect((status as { reason?: { message?: string } }).reason?.message).toMatch(/revoked/i);
  });

  it('w3cVpCredentialStatus emits INVALID when an embedded credential is NOT YET VALID', async () => {
    // Temporal validity is a STATUS concern. A credential whose validFrom is in the future
    // must fail here (this path is symmetric with the expiry check). The status fragment does
    // not verify signatures, so a plain fixture object with an overridden validFrom suffices.
    const notYetVc = { ...W3C_VERIFIABLE_DOCUMENT, validFrom: '2999-01-01T00:00:00Z' };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [notYetVc] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('INVALID');
    expect((status as { reason?: { message?: string } }).reason?.message).toMatch(/not yet valid/i);
    expect((status as { reason?: { message?: string } }).reason?.message).toMatch(/index 0/);
  });

  it('w3cVpCredentialStatus names the CORRECT credential index (2nd VC revoked → "index 1")', async () => {
    // Two embedded credentials: index 0 is fine (statusListIndex 10 → not revoked), index 1 is
    // revoked (statusListIndex 5). The reason must point at index 1, proving the index is not
    // merely present but correct after the flatMap that carries the owning credential index.
    const ok = W3C_VERIFIABLE_DOCUMENT;
    const revokedVc = {
      ...W3C_VERIFIABLE_DOCUMENT,
      credentialStatus: { ...W3C_VERIFIABLE_DOCUMENT.credentialStatus, statusListIndex: '5' },
    };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [ok, revokedVc] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('INVALID');
    expect((status as { reason?: { message?: string } }).reason?.message).toMatch(/index 1/);
  });

  it('w3cVpCredentialStatus ERRORs (naming the index) when a supported status check fails', async () => {
    // A supported StatusList entry whose statusListIndex is out of range makes
    // verifyCredentialStatus RETURN an error (it never throws), which the fragment surfaces as
    // ERROR — and it must name the owning credential index, same parity as revoked/expired.
    const badStatusVc = {
      ...W3C_VERIFIABLE_DOCUMENT,
      credentialStatus: {
        ...W3C_VERIFIABLE_DOCUMENT.credentialStatus,
        statusListIndex: '99999999999', // beyond the status list's range → deterministic error
      },
    };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [badStatusVc] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('ERROR');
    const message = (status as { reason?: { message?: string } }).reason?.message;
    expect(message).toMatch(/Could not verify status/i);
    expect(message).toMatch(/index 0/);
  });

  it('w3cVpCredentialStatus ERRORs on an unsupported credentialStatus type (not silently dropped)', async () => {
    const vc = {
      ...W3C_VERIFIABLE_DOCUMENT,
      credentialStatus: { type: 'TransferableRecords' },
    };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [vc] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('ERROR');
    expect((status as { reason?: { message?: string } }).reason?.message).toMatch(/Unsupported/i);
  });

  it('w3cVpCredentialStatus returns VALID for a credential with NO credentialStatus (nothing to check)', async () => {
    // Absent credentialStatus is NOT the same as a malformed one: it contributes no status
    // entry, so there is nothing to revoke-check and the fragment must stay VALID (not ERROR).
    const noStatus = { ...W3C_VERIFIABLE_DOCUMENT } as { credentialStatus?: unknown };
    delete noStatus.credentialStatus;
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [noStatus] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('VALID');
  });

  it('w3cVpCredentialStatus ERRORs on a credentialStatus with NO type (not silently dropped)', async () => {
    // A `credentialStatus: {}` must not fall through both filters and skip revocation — it is
    // unevaluable, so it must surface as ERROR naming the credential index.
    const vc = { ...W3C_VERIFIABLE_DOCUMENT, credentialStatus: {} };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [vc] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('ERROR');
    const message = (status as { reason?: { message?: string } }).reason?.message;
    expect(message).toMatch(/missing/i);
    expect(message).toMatch(/index 0/);
  });

  it('w3cVpCredentialStatus emits INVALID for an UNPARSEABLE embedded temporal value', async () => {
    // `new Date("invalid")` is an Invalid Date whose comparisons all read false, so a garbage
    // validUntil would slip through as "not expired" unless explicitly rejected.
    const vc = { ...W3C_VERIFIABLE_DOCUMENT, validUntil: 'not-a-date' };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [vc] };
    const o = await opts();
    const status = await w3cVpCredentialStatus.verify(vp as never, o as never);
    expect(status.status).toBe('INVALID');
    const message = (status as { reason?: { message?: string } }).reason?.message;
    expect(message).toMatch(/unparseable validUntil/i);
    expect(message).toMatch(/index 0/);
  });

  it('w3cVpIssuerIdentity emits INVALID when an embedded credential has no issuer', async () => {
    const noIssuer = { ...W3C_VERIFIABLE_DOCUMENT } as { issuer?: string };
    delete noIssuer.issuer;
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [noIssuer] };
    const o = await opts();
    const issuer = await w3cVpIssuerIdentity.verify(vp as never, o as never);
    expect(issuer.status).toBe('INVALID');
    expect((issuer as { reason?: { message?: string } }).reason?.message).toMatch(/no issuer/i);
    expect((issuer as { reason?: { message?: string } }).reason?.message).toMatch(/index 0/);
  });

  it('w3cVpIssuerIdentity names the CORRECT index when only the 2nd VC lacks an issuer', async () => {
    const withIssuer = W3C_VERIFIABLE_DOCUMENT;
    const noIssuer = { ...W3C_VERIFIABLE_DOCUMENT } as { issuer?: string };
    delete noIssuer.issuer;
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [withIssuer, noIssuer] };
    const o = await opts();
    const issuer = await w3cVpIssuerIdentity.verify(vp as never, o as never);
    expect(issuer.status).toBe('INVALID');
    expect((issuer as { reason?: { message?: string } }).reason?.message).toMatch(/index 1/);
  });

  it('w3cVpIssuerIdentity resolves an embedded did:web issuer (→ VALID)', async () => {
    const vp = {
      type: ['VerifiablePresentation'],
      verifiableCredential: [W3C_VERIFIABLE_DOCUMENT],
    };
    const o = await opts();
    const issuer = await w3cVpIssuerIdentity.verify(vp as never, o as never);
    expect(issuer.type).toBe('ISSUER_IDENTITY');
    expect(issuer.status).toBe('VALID');
  });

  it('w3cVpIssuerIdentity emits INVALID when an embedded issuer DID cannot be resolved', async () => {
    // A syntactically valid but non-resolvable did:web (the reserved .invalid TLD never resolves)
    // must surface as INVALID rather than silently pass.
    const vc = { ...W3C_VERIFIABLE_DOCUMENT, issuer: 'did:web:nonexistent.example.invalid' };
    const vp = { type: ['VerifiablePresentation'], verifiableCredential: [vc] };
    const o = await opts();
    const issuer = await w3cVpIssuerIdentity.verify(vp as never, o as never);
    expect(issuer.status).toBe('INVALID');
    const message = (issuer as { reason?: { message?: string } }).reason?.message;
    expect(message).toMatch(/could not resolve issuer/i);
    expect(message).toMatch(/index 0/);
  });

  it('runs through the full verifyDocument() pipeline for a signed VP', async () => {
    const vp = await createPresentation(embeddedVc as never, { holder: DID });
    const { signed } = await signPresentation(vp, holderKey as never, {
      challenge: 'pipeline-challenge',
    });
    const fragments = await verifyDocument(signed as never);
    const byName = (name: string) => fragments.find((f) => f.name === name);

    // The three VP verifiers ran and passed.
    expect(byName('W3CVpSignatureIntegrity')?.status).toBe('VALID');
    expect(byName('W3CVpCredentialStatus')?.status).toBe('VALID');
    expect(byName('W3CVpIssuerIdentity')?.status).toBe('VALID');
    // VC-only verifiers must SKIP a VP — in particular W3CEmptyCredentialStatus must not
    // report a valid VP as INVALID.
    expect(byName('W3CEmptyCredentialStatus')?.status).toBe('SKIPPED');
    // A valid VP must produce NO INVALID/ERROR fragment across the whole pipeline.
    expect(fragments.every((f) => f.status === 'VALID' || f.status === 'SKIPPED')).toBe(true);
  });

  it('verifyDocument() rejects an EXPIRED embedded VC at DOCUMENT_STATUS, keeping DOCUMENT_INTEGRITY VALID', async () => {
    // End-to-end guard for the layer split: since integrity is now crypto-only, DOCUMENT_STATUS
    // is the SOLE catcher of embedded-credential expiry. This proves the whole pipeline (not just
    // an isolated fragment) still rejects the document AND attributes it to the right dimension.
    const raw = {
      ...W3C_RAW_CREDENTIAL_V2_0,
      issuer: DID,
      validFrom: '2020-01-01T00:00:00Z',
      validUntil: '2021-01-01T00:00:00Z',
      credentialSubject: { ...W3C_RAW_CREDENTIAL_V2_0.credentialSubject, id: DID },
    };
    const s = await signCredential(raw as never, holderKey as never, 'ecdsa-sd-2023');
    const vc = assertDefined(
      (
        await deriveCredential(assertDefined(s.signed, 'signed'), [
          '/credentialSubject/id',
          '/validUntil',
        ])
      ).derived,
      'derived',
    );
    const vp = await createPresentation(vc as never, {
      holder: DID,
      now: new Date('2020-06-01T00:00:00Z'),
      expiresInSeconds: 315360000,
    });
    const { signed } = await signPresentation(vp, holderKey as never, { challenge: 'e2e' });
    const fragments = await verifyDocument(signed as never);
    const byName = (name: string) => fragments.find((f) => f.name === name);

    expect(byName('W3CVpSignatureIntegrity')?.status).toBe('VALID');
    expect(byName('W3CVpCredentialStatus')?.status).toBe('INVALID');
    // Overall verdict: integrity dimension holds, status dimension fails → document invalid.
    expect(isValid(fragments, ['DOCUMENT_INTEGRITY'])).toBe(true);
    expect(isValid(fragments, ['DOCUMENT_STATUS'])).toBe(false);
    expect(isValid(fragments)).toBe(false);
  });

  it('verifyDocument() rejects a REVOKED embedded VC at DOCUMENT_STATUS, keeping DOCUMENT_INTEGRITY VALID', async () => {
    // Mint a holder-bound credential that references the real status list at index 5 (revoked).
    // It is cryptographically authentic and holder-bound (integrity VALID), but revoked (status
    // INVALID). `createPresentation` would reject a revoked credential, so we assemble the VP by
    // hand and sign the holder proof directly — the same bypass a malicious presenter would use.
    const raw = {
      ...W3C_RAW_CREDENTIAL_V2_0,
      '@context': [
        ...W3C_RAW_CREDENTIAL_V2_0['@context'],
        'https://w3id.org/vc/status-list/2021/v1',
      ],
      issuer: DID,
      validFrom: '2024-04-01T12:19:52Z',
      credentialStatus: {
        id: 'https://trustvc.github.io/did/credentials/statuslist/1#5',
        type: 'StatusList2021Entry',
        statusPurpose: 'revocation',
        statusListIndex: '5', // index 5 on statuslist/1 → REVOKED
        statusListCredential: 'https://trustvc.github.io/did/credentials/statuslist/1',
      },
      credentialSubject: { ...W3C_RAW_CREDENTIAL_V2_0.credentialSubject, id: DID },
    };
    const s = await signCredential(raw as never, holderKey as never, 'ecdsa-sd-2023');
    const vc = assertDefined(
      (await deriveCredential(assertDefined(s.signed, 'signed'), ['/credentialSubject/id']))
        .derived,
      'derived',
    );
    const rawVp = {
      '@context': ['https://www.w3.org/ns/credentials/v2'],
      type: ['VerifiablePresentation'],
      verifiableCredential: [vc],
      holder: DID,
    };
    const { signed } = await signPresentation(rawVp as never, holderKey as never, {
      challenge: 'e2e-revoked',
    });
    const fragments = await verifyDocument(signed as never);
    const byName = (name: string) => fragments.find((f) => f.name === name);

    expect(byName('W3CVpSignatureIntegrity')?.status).toBe('VALID');
    expect(byName('W3CVpCredentialStatus')?.status).toBe('INVALID');
    expect(
      (byName('W3CVpCredentialStatus') as { reason?: { message?: string } }).reason?.message,
    ).toMatch(/revoked/i);
    expect(isValid(fragments, ['DOCUMENT_INTEGRITY'])).toBe(true);
    expect(isValid(fragments, ['DOCUMENT_STATUS'])).toBe(false);
    expect(isValid(fragments)).toBe(false);
  });

  it('verifyDocument() rejects a REVOKED BitstringStatusList VC at DOCUMENT_STATUS (integrity VALID)', async () => {
    // Same end-to-end shape as the StatusList2021 case, but for the OTHER supported status type.
    // BitstringStatusListEntry is defined natively by the v2 credentials context, so no extra
    // context is needed. statuslist/2 index 5 → revoked.
    const raw = {
      ...W3C_RAW_CREDENTIAL_V2_0,
      issuer: DID,
      validFrom: '2024-04-01T12:19:52Z',
      credentialStatus: {
        id: 'https://trustvc.github.io/did/credentials/statuslist/2#5',
        type: 'BitstringStatusListEntry',
        statusPurpose: 'revocation',
        statusListIndex: '5', // index 5 on statuslist/2 → REVOKED
        statusListCredential: 'https://trustvc.github.io/did/credentials/statuslist/2',
      },
      credentialSubject: { ...W3C_RAW_CREDENTIAL_V2_0.credentialSubject, id: DID },
    };
    const s = await signCredential(raw as never, holderKey as never, 'ecdsa-sd-2023');
    const vc = assertDefined(
      (await deriveCredential(assertDefined(s.signed, 'signed'), ['/credentialSubject/id']))
        .derived,
      'derived',
    );
    const rawVp = {
      '@context': ['https://www.w3.org/ns/credentials/v2'],
      type: ['VerifiablePresentation'],
      verifiableCredential: [vc],
      holder: DID,
    };
    const { signed } = await signPresentation(rawVp as never, holderKey as never, {
      challenge: 'e2e-revoked-bitstring',
    });
    const fragments = await verifyDocument(signed as never);
    const byName = (name: string) => fragments.find((f) => f.name === name);

    expect(byName('W3CVpSignatureIntegrity')?.status).toBe('VALID');
    expect(byName('W3CVpCredentialStatus')?.status).toBe('INVALID');
    expect(
      (byName('W3CVpCredentialStatus') as { reason?: { message?: string } }).reason?.message,
    ).toMatch(/revoked/i);
    expect(isValid(fragments, ['DOCUMENT_INTEGRITY'])).toBe(true);
    expect(isValid(fragments, ['DOCUMENT_STATUS'])).toBe(false);
    expect(isValid(fragments)).toBe(false);
  });

  it('verifyDocument() rejects an UNSIGNED VP at DOCUMENT_INTEGRITY', async () => {
    // A raw (unsigned) VP is still routed in by shape, then judged INVALID by integrity.
    const vp = await createPresentation(embeddedVc as never, { holder: DID });
    const fragments = await verifyDocument(vp as never);
    const byName = (name: string) => fragments.find((f) => f.name === name);

    expect(byName('W3CVpSignatureIntegrity')?.status).toBe('INVALID');
    expect(isValid(fragments, ['DOCUMENT_INTEGRITY'])).toBe(false);
    expect(isValid(fragments)).toBe(false);
  });

  it('verifyDocument() rejects a VP whose embedded credential SIGNATURE is invalid', async () => {
    // Valid holder proof over a forged credential (see the isolated-fragment test) — the whole
    // pipeline must reject it at DOCUMENT_INTEGRITY.
    const raw = JSON.parse(
      JSON.stringify(await createPresentation(embeddedVc as never, { holder: DID })),
    );
    const sub = Array.isArray(raw.verifiableCredential)
      ? raw.verifiableCredential[0]
      : raw.verifiableCredential;
    sub.proof.proofValue = String(sub.proof.proofValue).slice(0, -6) + 'ZZZZZZ';
    const { signed } = await signPresentation(raw, holderKey as never, { challenge: 'e2e-badsig' });
    const fragments = await verifyDocument(signed as never);
    const byName = (name: string) => fragments.find((f) => f.name === name);

    expect(byName('W3CVpSignatureIntegrity')?.status).toBe('INVALID');
    expect(isValid(fragments, ['DOCUMENT_INTEGRITY'])).toBe(false);
    expect(isValid(fragments)).toBe(false);
  });
});
