import { describe, expect, it } from 'vitest';
import { VerificationType } from '@trustvc/w3c-issuer';
import { createPresentation } from '@trustvc/w3c-vc';
import {
  W3C_RAW_CREDENTIAL_V1_1,
  W3C_RAW_CREDENTIAL_V2_0,
  W3C_TRANSFERABLE_RECORD,
} from '../fixtures/fixtures';
import { deriveW3C, signW3C, signW3CPresentation, verifyW3CPresentation } from '../..';

// Asserts a value is defined and returns it narrowed (avoids `!` assertions).
const assertDefined = <T>(value: T | undefined, message: string): T => {
  if (value === undefined) throw new Error(message);
  return value;
};

// ECDSA-SD-2023 P-256 Multikey (same material as the sign tests), expressed as a did:key.
const ECDSA_PUB_MB = 'zDnaemDNwi4G5eTzGfRooFFu5Kns3be6yfyVNtiaMhWkZbwtc';
const ECDSA_SEC_MB = 'z42tmUXTVn3n9BihE6NhdMpvVBTnFTgmb6fw18o5Ud6puhRW';
const HOLDER_DID = `did:key:${ECDSA_PUB_MB}`;
const holderKey = {
  id: `${HOLDER_DID}#${ECDSA_PUB_MB}`,
  controller: HOLDER_DID,
  type: VerificationType.Multikey,
  publicKeyMultibase: ECDSA_PUB_MB,
  secretKeyMultibase: ECDSA_SEC_MB,
};
const CHALLENGE = 'trustvc-vp-test-challenge';
const DOMAIN = 'verifier.example.com';

// A DIFFERENT issuing party: the hosted did:web issuer (resolves live at trustvc.github.io).
// Its verification method is `#multikey-1` (an ECDSA-SD Multikey). This is a distinct DID
// from the did:key holder — proving the issuer is independent of the holder/subject.
const ISSUER_DID = 'did:web:trustvc.github.io:did:1';
const issuerKey = {
  id: `${ISSUER_DID}#multikey-1`,
  controller: ISSUER_DID,
  type: VerificationType.Multikey,
  publicKeyMultibase: ECDSA_PUB_MB,
  secretKeyMultibase: ECDSA_SEC_MB,
};

describe('W3C Verifiable Presentation (via @trustvc/trustvc)', () => {
  // Build a derived, presentable credential whose issuer + subject are the holder did:key.
  const makeDerivedVc = async () => {
    const raw = {
      ...W3C_RAW_CREDENTIAL_V2_0,
      issuer: HOLDER_DID,
      validFrom: '2024-04-01T12:19:52Z',
      credentialSubject: { ...W3C_RAW_CREDENTIAL_V2_0.credentialSubject, id: HOLDER_DID },
    };
    const signed = await signW3C(raw as never, holderKey as never, 'ecdsa-sd-2023');
    if (signed.error) throw new Error(`sign failed: ${signed.error}`);
    const derived = await deriveW3C(assertDefined(signed.signed, 'signed'), [
      '/credentialSubject/id',
      '/credentialSubject/blNumber',
    ]);
    if (derived.error) throw new Error(`derive failed: ${derived.error}`);
    return assertDefined(derived.derived, 'derived');
  };

  // A base (non-derived) selective-disclosure credential — used to prove the trustvc
  // layer auto-full-discloses underived credentials (fullDisclosure is enforced).
  const makeBaseSdVc = async () => {
    const raw = {
      ...W3C_RAW_CREDENTIAL_V2_0,
      issuer: HOLDER_DID,
      validFrom: '2024-04-01T12:19:52Z',
      credentialSubject: { ...W3C_RAW_CREDENTIAL_V2_0.credentialSubject, id: HOLDER_DID },
    };
    const signed = await signW3C(raw as never, holderKey as never, 'ecdsa-sd-2023');
    if (signed.error) throw new Error(`sign failed: ${signed.error}`);
    return assertDefined(signed.signed, 'signed'); // NOT derived
  };

  // A derived credential issued WITHOUT any credentialSubject.id (the raw subject has no id).
  // Selective disclosure retains a subject id when one exists, so it must be absent at issuance.
  const makeDerivedVcNoSubjectId = async () => {
    const raw = {
      ...W3C_RAW_CREDENTIAL_V2_0,
      issuer: HOLDER_DID,
      validFrom: '2024-04-01T12:19:52Z',
      // credentialSubject deliberately has NO `id`.
    };
    const signed = await signW3C(raw as never, holderKey as never, 'ecdsa-sd-2023');
    if (signed.error) throw new Error(`sign failed: ${signed.error}`);
    const derived = await deriveW3C(assertDefined(signed.signed, 'signed'), [
      '/credentialSubject/blNumber',
    ]);
    if (derived.error) throw new Error(`derive failed: ${derived.error}`);
    return assertDefined(derived.derived, 'derived');
  };

  // A derived, holder-bound v1.1 credential (issuanceDate/expirationDate data model).
  const makeDerivedV1Vc = async () => {
    const raw = {
      ...W3C_RAW_CREDENTIAL_V1_1,
      issuer: HOLDER_DID,
      credentialSubject: { ...W3C_RAW_CREDENTIAL_V1_1.credentialSubject, id: HOLDER_DID },
    };
    const signed = await signW3C(raw as never, holderKey as never, 'ecdsa-sd-2023');
    if (signed.error) throw new Error(`sign failed: ${signed.error}`);
    const derived = await deriveW3C(assertDefined(signed.signed, 'signed'), [
      '/credentialSubject/id',
      '/credentialSubject/blNumber',
    ]);
    if (derived.error) throw new Error(`derive failed: ${derived.error}`);
    return assertDefined(derived.derived, 'derived');
  };

  it('creates, signs and verifies a VP end-to-end', async () => {
    const vc = await makeDerivedVc();

    // create (validated + expiry-stamped)
    // (unsigned) create still available for inspecting the envelope
    const vp = await createPresentation(vc, { holder: HOLDER_DID });
    expect(vp.type).toContain('VerifiablePresentation');
    expect(vp.validFrom).toBeDefined();
    expect(vp.validUntil).toBeDefined();

    // create + sign in ONE call: pass credentials directly.
    // (fullDisclosure + holder binding + expiry are ENFORCED by the trustvc layer.)
    const { signed, error } = await signW3CPresentation(vc, holderKey as never, {
      holder: HOLDER_DID,
      challenge: CHALLENGE,
      domain: DOMAIN,
      expiresInSeconds: 600, // lifetime is required at the trustvc layer
    });
    expect(error).toBeUndefined();
    const signedVp = assertDefined(signed, 'expected signed VP');
    expect(signedVp.proof.cryptosuite).toBe('ecdsa-rdfc-2019');
    expect(signedVp.proof.challenge).toBe(CHALLENGE);

    // verify: proof + embedded credential + holder binding + expiry
    // (holder binding is ENFORCED by the trustvc layer.)
    const result = await verifyW3CPresentation(signedVp, {
      challenge: CHALLENGE,
      domain: DOMAIN,
      requireProof: true,
    });
    expect(result.verified).toBe(true);
    expect(result.presentationResult?.verified).toBe(true);
    expect(result.credentialResults?.every((r) => r.verified)).toBe(true);
  });

  it('fails verification with the wrong challenge (anti-replay)', async () => {
    const vc = await makeDerivedVc();
    const { signed } = await signW3CPresentation(vc, holderKey as never, {
      holder: HOLDER_DID,
      challenge: CHALLENGE,
      expiresInSeconds: 600,
    });
    const result = await verifyW3CPresentation(assertDefined(signed, 'signed VP'), {
      challenge: 'wrong-challenge',
    });
    expect(result.verified).toBe(false);
  });

  it('requires a VP lifetime (expiresInSeconds or validUntil)', async () => {
    const vc = await makeDerivedVc();
    // Bypass the type to exercise the runtime guard.
    const result = await signW3CPresentation(
      vc,
      holderKey as never,
      {
        holder: HOLDER_DID,
        challenge: CHALLENGE,
      } as never,
    );
    expect(result.signed).toBeUndefined();
    expect(result.error).toMatch(/lifetime is required/);
  });

  it('rejects an unsigned VP (holder binding is enforced at the trustvc layer)', async () => {
    const vc = await makeDerivedVc();
    const vp = await createPresentation(vc, { holder: HOLDER_DID });
    const result = await verifyW3CPresentation(vp);
    expect(result.verified).toBe(false);
    expect(result.error).toMatch(/holder binding requires a signed presentation/);
  });

  describe('proof modes', () => {
    it('signs and verifies an assertionMethod proof (no challenge)', async () => {
      const vc = await makeDerivedVc();
      const { signed, error } = await signW3CPresentation(vc, holderKey as never, {
        holder: HOLDER_DID,
        expiresInSeconds: 600, // no challenge → assertionMethod
      });
      expect(error).toBeUndefined();
      const signedVp = assertDefined(signed, 'signed VP');
      expect(signedVp.proof.proofPurpose).toBe('assertionMethod');
      expect(signedVp.proof.challenge).toBeUndefined();

      const result = await verifyW3CPresentation(signedVp); // no challenge needed
      expect(result.verified).toBe(true);
    });

    it('rejects a domain without a challenge', async () => {
      const vc = await makeDerivedVc();
      const result = await signW3CPresentation(vc, holderKey as never, {
        holder: HOLDER_DID,
        domain: DOMAIN,
        expiresInSeconds: 600,
      });
      expect(result.signed).toBeUndefined();
      expect(result.error).toMatch(/"domain" requires a "challenge"/);
    });
  });

  describe('invalid signing key', () => {
    it('rejects when no signing key is provided', async () => {
      const vc = await makeDerivedVc();
      const result = await signW3CPresentation(vc, undefined as never, { expiresInSeconds: 600 });
      expect(result.signed).toBeUndefined();
      expect(result.error).toMatch(/a signing key \(keyPair\) is required/);
    });

    it('rejects a structurally-invalid key (missing secretKeyMultibase)', async () => {
      const vc = await makeDerivedVc();
      const noSecret = { ...holderKey } as { secretKeyMultibase?: string };
      delete noSecret.secretKeyMultibase;
      const result = await signW3CPresentation(vc, noSecret as never, {
        holder: HOLDER_DID,
        expiresInSeconds: 600,
      });
      expect(result.signed).toBeUndefined();
      expect(result.error).toMatch(/"secretKeyMultibase" property in keyPair is required/);
    });

    it('rejects a key that cannot be loaded as an ECDSA (P-256) Multikey', async () => {
      const vc = await makeDerivedVc();
      const garbageKey = {
        ...holderKey,
        publicKeyMultibase: 'zGARBAGEKEYNOTVALID',
        secretKeyMultibase: 'zGARBAGEKEYNOTVALID',
      };
      const result = await signW3CPresentation(vc, garbageKey as never, {
        holder: HOLDER_DID,
        expiresInSeconds: 600,
      });
      expect(result.signed).toBeUndefined();
      expect(result.error).toMatch(/An ECDSA \(P-256\) Multikey is required/);
    });
  });

  describe('credential policy', () => {
    // A holder can omit any statement the issuer did not mark mandatory and the credential
    // still verifies. These two prove the trustvc-level guarantee end-to-end: a revoked or
    // expired credential cannot be presented even by a holder who deliberately derives the
    // offending field away. It holds because @trustvc/w3c-vc makes `/credentialStatus` and
    // the expiry mandatory at issuance — so this ALSO guards the dependency: downgrade or
    // weaken that and these fail, rather than the hole silently reopening.
    describe('fields a holder cannot strip to dodge a check', () => {
      const bol = (extra: Record<string, unknown>) => ({
        '@context': [
          'https://www.w3.org/ns/credentials/v2',
          'https://trustvc.io/context/bill-of-lading.json',
        ],
        type: ['VerifiableCredential'],
        issuer: HOLDER_DID,
        credentialSubject: { id: HOLDER_DID, type: ['BillOfLading'], blNumber: 'BL-STRIP' },
        ...extra,
      });

      /**
       * Signs, then derives revealing ONLY the subject — asking for nothing else.
       * @param {object} raw - The raw credential to sign.
       * @returns {Promise<object>} The derived credential, minus anything not mandatory.
       */
      const signAndStrip = async (raw: object) => {
        const signed = await signW3C(raw as never, holderKey as never, 'ecdsa-sd-2023');
        if (signed.error) throw new Error(`sign failed: ${signed.error}`);
        const derived = await deriveW3C(assertDefined(signed.signed, 'signed'), [
          '/credentialSubject/id',
          '/credentialSubject/blNumber',
        ]);
        if (derived.error) throw new Error(`derive failed: ${derived.error}`);
        return assertDefined(derived.derived, 'derived');
      };

      it('cannot present a REVOKED credential by stripping credentialStatus', async () => {
        // Index 5 on the hosted status list is revoked.
        const vc = await signAndStrip(
          bol({
            '@context': [
              'https://www.w3.org/ns/credentials/v2',
              'https://trustvc.io/context/bill-of-lading.json',
              'https://w3id.org/vc/status-list/2021/v1',
            ],
            validFrom: '2024-04-01T12:19:52Z',
            credentialStatus: {
              id: 'https://trustvc.github.io/did/credentials/statuslist/1#5',
              type: 'StatusList2021Entry',
              statusPurpose: 'revocation',
              statusListIndex: '5',
              statusListCredential: 'https://trustvc.github.io/did/credentials/statuslist/1',
            },
          }),
        );
        expect(vc.credentialStatus).toBeDefined(); // survived the strip attempt

        const result = await signW3CPresentation(vc, holderKey as never, {
          holder: HOLDER_DID,
          expiresInSeconds: 600,
        });
        expect(result.signed).toBeUndefined();
        expect(result.error).toMatch(/revocation/);
      });

      it('cannot present an EXPIRED credential by stripping validUntil', async () => {
        const vc = await signAndStrip(
          bol({ validFrom: '2020-01-01T00:00:00Z', validUntil: '2021-01-01T00:00:00Z' }),
        );
        expect(vc.validUntil).toBeDefined(); // survived the strip attempt

        const result = await signW3CPresentation(vc, holderKey as never, {
          holder: HOLDER_DID,
          expiresInSeconds: 600,
        });
        expect(result.signed).toBeUndefined();
        expect(result.error).toMatch(/has expired/);
      });
    });

    it('blocks a credential with a TransferableRecords status', async () => {
      const result = await signW3CPresentation(
        W3C_TRANSFERABLE_RECORD as never,
        holderKey as never,
        {
          holder: HOLDER_DID,
          expiresInSeconds: 600,
        },
      );
      expect(result.signed).toBeUndefined();
      expect(result.error).toMatch(/TransferableRecords/);
    });

    it('fails when a credential is about someone other than the holder', async () => {
      const vc = await makeDerivedVc(); // subject === HOLDER_DID
      const result = await signW3CPresentation(vc, holderKey as never, {
        holder: 'did:example:someone-else',
        challenge: CHALLENGE,
        expiresInSeconds: 600,
      });
      expect(result.signed).toBeUndefined();
      expect(result.error).toMatch(/does not match the holder/);
    });

    it('rejects a credential with no credentialSubject.id (cannot be holder-bound)', async () => {
      const vc = await makeDerivedVcNoSubjectId();
      const result = await signW3CPresentation(vc, holderKey as never, {
        holder: HOLDER_DID,
        challenge: CHALLENGE,
        expiresInSeconds: 600,
      });
      expect(result.signed).toBeUndefined();
      expect(result.error).toMatch(/no "credentialSubject\.id"/);
    });

    it('auto full-discloses an underived (base SD) credential', async () => {
      const baseVc = await makeBaseSdVc(); // NOT derived
      const { signed, error } = await signW3CPresentation(baseVc, holderKey as never, {
        holder: HOLDER_DID,
        challenge: CHALLENGE,
        expiresInSeconds: 600,
      });
      expect(error).toBeUndefined();
      const result = await verifyW3CPresentation(assertDefined(signed, 'signed VP'), {
        challenge: CHALLENGE,
      });
      expect(result.verified).toBe(true);
    });

    it('verifies a VP whose credential was issued by a DIFFERENT party (did:web issuer, did:key holder)', async () => {
      // Issuer = did:web (a different DID, resolved live); subject/holder = the did:key presenter.
      // The credential proof is verified against the ISSUER's did:web; the VP proof against the
      // HOLDER's did:key. Holder binding checks subject == holder == VP signer only — the issuer
      // is deliberately NOT part of it.
      const raw = {
        ...W3C_RAW_CREDENTIAL_V2_0,
        issuer: ISSUER_DID, // different party
        validFrom: '2024-04-01T12:19:52Z',
        credentialSubject: { ...W3C_RAW_CREDENTIAL_V2_0.credentialSubject, id: HOLDER_DID },
      };
      const signedCred = await signW3C(raw as never, issuerKey as never, 'ecdsa-sd-2023');
      expect(signedCred.error).toBeUndefined();
      const derived = await deriveW3C(assertDefined(signedCred.signed, 'signed'), [
        '/credentialSubject/id',
        '/credentialSubject/blNumber',
      ]);
      const vc = assertDefined(derived.derived, 'derived');

      // The holder (did:key) — NOT the issuer — presents and signs the VP.
      const { signed, error } = await signW3CPresentation(vc, holderKey as never, {
        holder: HOLDER_DID,
        challenge: CHALLENGE,
        expiresInSeconds: 600,
      });
      expect(error).toBeUndefined();
      const result = await verifyW3CPresentation(assertDefined(signed, 'signed VP'), {
        challenge: CHALLENGE,
      });
      expect(result.verified).toBe(true);
      expect(result.credentialResults?.every((r) => r.verified)).toBe(true);
    });

    it('wraps and verifies multiple credentials', async () => {
      const [vc1, vc2] = [await makeDerivedVc(), await makeDerivedVc()];
      const { signed, error } = await signW3CPresentation([vc1, vc2], holderKey as never, {
        holder: HOLDER_DID,
        challenge: CHALLENGE,
        expiresInSeconds: 600,
      });
      expect(error).toBeUndefined();
      const result = await verifyW3CPresentation(assertDefined(signed, 'signed VP'), {
        challenge: CHALLENGE,
      });
      expect(result.verified).toBe(true);
      expect(result.credentialResults?.length).toBe(2);
    });
  });

  describe('expiry & versioning', () => {
    it('accepts an explicit validUntil as the lifetime', async () => {
      const vc = await makeDerivedVc();
      const { signed, error } = await signW3CPresentation(vc, holderKey as never, {
        holder: HOLDER_DID,
        challenge: CHALLENGE,
        validUntil: '2999-01-01T00:00:00Z',
      });
      expect(error).toBeUndefined();
      expect(assertDefined(signed, 'signed VP').validUntil).toBe('2999-01-01T00:00:00Z');
    });

    it('rejects an expired VP at verify', async () => {
      const vc = await makeDerivedVc();
      // A VP that was validly created but whose window is entirely in the past.
      const { signed, error } = await signW3CPresentation(
        vc,
        holderKey as never,
        {
          holder: HOLDER_DID,
          challenge: CHALLENGE,
          validFrom: '2020-01-01T00:00:00Z',
          validUntil: '2020-01-02T00:00:00Z',
        } as never,
      );
      expect(error).toBeUndefined();
      const result = await verifyW3CPresentation(assertDefined(signed, 'signed VP'), {
        challenge: CHALLENGE,
      });
      expect(result.verified).toBe(false);
      expect(result.error).toMatch(/expired/);
    });

    it('always produces a v2 envelope (caller cannot downgrade to v1)', async () => {
      const vc = await makeDerivedVc();
      const { signed, error } = await signW3CPresentation(
        vc,
        holderKey as never,
        {
          holder: HOLDER_DID,
          challenge: CHALLENGE,
          expiresInSeconds: 600,
          version: 'v1', // ignored — v2 is enforced
        } as never,
      );
      expect(error).toBeUndefined();
      const signedVp = assertDefined(signed, 'signed VP') as {
        validFrom?: string;
        issuanceDate?: string;
      };
      expect(signedVp.validFrom).toBeDefined(); // v2 field
      expect(signedVp.issuanceDate).toBeUndefined(); // v1 field absent
    });

    it('wraps a v1.1 credential in a v2 envelope and verifies it', async () => {
      const v1Vc = await makeDerivedV1Vc();
      const { signed, error } = await signW3CPresentation(v1Vc, holderKey as never, {
        holder: HOLDER_DID,
        challenge: CHALLENGE,
        expiresInSeconds: 600,
      });
      expect(error).toBeUndefined();
      const signedVp = assertDefined(signed, 'signed VP') as { validFrom?: string };
      expect(signedVp.validFrom).toBeDefined(); // envelope is v2 even though the credential is v1.1
      const result = await verifyW3CPresentation(signedVp as never, { challenge: CHALLENGE });
      expect(result.verified).toBe(true);
    });
  });
});
