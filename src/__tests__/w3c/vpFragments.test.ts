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
    embeddedVc = (
      await deriveCredential(s.signed!, ['/credentialSubject/id', '/credentialSubject/blNumber'])
    ).derived!;
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
    expect(integrity.status).toBe('INVALID');
  });

  it('emits INVALID integrity when an embedded credential has EXPIRED', async () => {
    // Embedded credential expired in 2021; VP created in 2020 (so creation passes) with a
    // long VP lifetime, then verified "now" (2026) → the expired credential fails.
    const raw = {
      ...W3C_RAW_CREDENTIAL_V2_0,
      issuer: DID,
      validFrom: '2020-01-01T00:00:00Z',
      validUntil: '2021-01-01T00:00:00Z',
      credentialSubject: { ...W3C_RAW_CREDENTIAL_V2_0.credentialSubject, id: DID },
    };
    const s = await signCredential(raw as never, holderKey as never, 'ecdsa-sd-2023');
    const vc = (await deriveCredential(s.signed!, ['/credentialSubject/id', '/validUntil']))
      .derived!;
    const vp = await createPresentation(vc as never, {
      holder: DID,
      now: new Date('2020-06-01T00:00:00Z'),
      expiresInSeconds: 315360000, // 10y so the VP envelope itself isn't expired
    });
    const { signed } = await signPresentation(vp, holderKey as never, { challenge: 'x' });
    const o = await opts();
    const integrity = await w3cVpSignatureIntegrity.verify(signed as never, o as never);
    expect(integrity.status).toBe('INVALID');
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
    // No VP fragment errored.
    const vpFragments = fragments.filter((f) => f.name?.startsWith('W3CVp'));
    expect(vpFragments.every((f) => f.status !== 'ERROR')).toBe(true);
  });
});
