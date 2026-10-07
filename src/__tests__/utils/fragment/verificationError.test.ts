import { describe, expect, it } from 'vitest';
import { VerificationFragment } from '@tradetrust-tt/tt-verify';
import { getVerificationError, renderErrorMessage } from '../../../utils/fragment';
import { errorMessages } from '../../../utils/errorMessages';
import { W3CVpCode } from '../../../verify/fragments/presentation/w3cVpVerifier';

const { TYPES, MESSAGES } = errorMessages;

// A failing VP fragment, as the verifiers emit them.
const vpFragment = (
  name: string,
  type: string,
  code: W3CVpCode,
  message: string,
  credentialIndices: number[] = [],
  status: 'INVALID' | 'ERROR' = 'INVALID',
): VerificationFragment =>
  ({
    name,
    type,
    status,
    reason: { code, codeString: W3CVpCode[code], message },
    data: { credentialIndices },
  }) as unknown as VerificationFragment;

const status = (code: W3CVpCode, message: string, indices: number[] = []) =>
  vpFragment('W3CVpCredentialStatus', 'DOCUMENT_STATUS', code, message, indices);
const integrity = (code: W3CVpCode, message: string, indices: number[] = []) =>
  vpFragment('W3CVpSignatureIntegrity', 'DOCUMENT_INTEGRITY', code, message, indices);
const identity = (code: W3CVpCode, message: string, indices: number[] = []) =>
  vpFragment('W3CVpIssuerIdentity', 'ISSUER_IDENTITY', code, message, indices);

// A presentation whose credentials carry the labels a renderer would show.
const presentationWith = (...labels: (string | undefined)[]) => ({
  type: ['VerifiablePresentation'],
  verifiableCredential: labels.map((templateName) =>
    templateName
      ? { type: ['VerifiableCredential'], renderMethod: [{ templateName }] }
      : { type: ['VerifiableCredential'] },
  ),
});

describe('getVerificationError', () => {
  it('returns undefined when nothing failed', () => {
    const valid = [
      { name: 'W3CVpSignatureIntegrity', type: 'DOCUMENT_INTEGRITY', status: 'VALID' },
      { name: 'W3CVpCredentialStatus', type: 'DOCUMENT_STATUS', status: 'VALID' },
      { name: 'W3CVpIssuerIdentity', type: 'ISSUER_IDENTITY', status: 'VALID' },
    ] as unknown as VerificationFragment[];
    expect(getVerificationError(valid)).toBeUndefined();
  });

  it('gives an expired PRESENTATION the holder-facing remedy', () => {
    const err = getVerificationError([
      status(W3CVpCode.PRESENTATION_EXPIRED, 'Presentation has expired (validUntil 2020-01-01).'),
    ]);
    expect(err?.type).toBe(TYPES.PRESENTATION_EXPIRED);
    expect(err?.title).toBe('Presentation expired');
    expect(err?.message).toContain('Please ask the holder to present the credentials again');
  });

  // The distinction this whole mechanism exists for: same word "expired", opposite remedies.
  // Only the issuer can reissue a credential, so "present it again" is advice that cannot work.
  it('gives an expired CREDENTIAL the issuer-facing remedy, and never the holder one', () => {
    const err = getVerificationError(
      [
        status(
          W3CVpCode.CREDENTIAL_EXPIRED,
          'Embedded credential at index 1 has expired (validUntil 2020-01-01).',
          [1],
        ),
      ],
      presentationWith('CHAFTA_COO', 'BILL_OF_LADING'),
    );
    expect(err?.type).toBe(TYPES.CREDENTIAL_EXPIRED);
    expect(err?.message).toContain('Please ask the issuing authority to reissue it');
    // The advice that cannot work: only the issuer can reissue a credential.
    expect(err?.message).not.toContain('present it again');
    expect(err?.message).toContain('Presenting it again will not help');
    expect(err?.message).not.toContain('Ask the holder');
  });

  it('names the credential at fault by position AND label', () => {
    const err = getVerificationError(
      [status(W3CVpCode.CREDENTIAL_REVOKED, 'revoked', [1])],
      presentationWith('CHAFTA_COO', 'BILL_OF_LADING'),
    );
    expect(err?.message).toContain('Credential 2 ("BILL OF LADING")');
  });

  it('falls back to the position when the document is not supplied', () => {
    const err = getVerificationError([status(W3CVpCode.CREDENTIAL_REVOKED, 'revoked', [1])]);
    expect(err?.message).toContain('Credential 2');
    expect(err?.message).not.toContain('("');
  });

  it('names every credential at fault, and agrees the verb', () => {
    const err = getVerificationError(
      [status(W3CVpCode.CREDENTIAL_EXPIRED, 'expired', [0, 2])],
      presentationWith('CHAFTA_COO', 'PACKING_LIST', 'BILL_OF_LADING'),
    );
    expect(err?.message).toContain(
      'Credential 1 ("CHAFTA COO") and Credential 3 ("BILL OF LADING")',
    );
    expect(err?.message).toContain('have expired');
    expect(err?.message).toContain('reissue them');
  });

  // Verifying an embedded credential's signature needs its issuer's key, so an unresolvable
  // issuer ALSO fails integrity — with a raw TypeError. Reported the other way round, an intact
  // document is described to its holder as tampered with.
  it('reports an unresolvable issuer as the root cause, not the tampering it triggers', () => {
    const err = getVerificationError(
      [
        identity(W3CVpCode.CREDENTIAL_ISSUER_UNRESOLVABLE, 'Could not resolve issuer(s).', [0]),
        integrity(
          W3CVpCode.CREDENTIAL_SIGNATURE_INVALID,
          "has an invalid signature: Cannot read properties of null (reading 'verificationMethod')",
          [0],
        ),
      ],
      presentationWith('BILL_OF_LADING'),
    );
    expect(err?.type).toBe(TYPES.CREDENTIAL_ISSUER_UNRESOLVABLE);
    expect(err?.message).toContain('could not identify who issued');
    expect(err?.message).not.toContain('tampered');
  });

  // Pins a DELIBERATE tradeoff, not an ideal. Swapping a credential's status method for one
  // the pipeline cannot evaluate breaks its signature too, so both failures fire — and the
  // status message wins. The reason is the foreign-document case: a presentation from another
  // implementation, using a status method we do not implement but otherwise intact, should be
  // told what is wrong rather than accused of forgery.
  //
  // The cost is that deliberate evasion of a revocation check reads as a benign "we could not
  // check". If that trade is ever revisited, this test fails first and names the decision.
  it('reportsStatusRatherThanTampering: unevaluable status outranks the broken signature', () => {
    const err = getVerificationError(
      [
        integrity(W3CVpCode.CREDENTIAL_SIGNATURE_INVALID, 'Invalid signature.', [1]),
        status(W3CVpCode.CREDENTIAL_STATUS_UNSUPPORTED, 'Unsupported credentialStatus type.', [1]),
      ],
      presentationWith('PACKING_LIST', 'BILL_OF_LADING'),
    );
    expect(err?.type).toBe(TYPES.CREDENTIAL_STATUS_UNSUPPORTED);
    expect(err?.message).not.toContain('tampered');
  });

  it('reports revocation ahead of the signature failure that may accompany it', () => {
    const err = getVerificationError([
      integrity(W3CVpCode.CREDENTIAL_SIGNATURE_INVALID, 'Invalid signature.', [0]),
      status(W3CVpCode.CREDENTIAL_REVOKED, 'revoked', [0]),
    ]);
    expect(err?.type).toBe(TYPES.CREDENTIAL_REVOKED);
  });

  it('distinguishes suspension from revocation', () => {
    const err = getVerificationError([status(W3CVpCode.CREDENTIAL_SUSPENDED, 'suspended', [0])]);
    expect(err?.type).toBe(TYPES.CREDENTIAL_SUSPENDED);
    expect(err?.message).toContain('suspended');
  });

  it('carries the code through so a consumer can branch without parsing prose', () => {
    const err = getVerificationError([status(W3CVpCode.PRESENTATION_EXPIRED, 'expired')]);
    expect(err?.code).toBe(W3CVpCode.PRESENTATION_EXPIRED);
    expect(err?.codeString).toBe('PRESENTATION_EXPIRED');
  });

  // Raw verifier prose (validUntil, did:key, "Cannot read properties") must never surface.
  it('never leaks the verifier reason into the user-facing message', () => {
    const noisy =
      "Embedded credential at index 0 has an invalid signature: Cannot read properties of null (reading 'verificationMethod') did:key:zDnae";
    const err = getVerificationError([
      integrity(W3CVpCode.CREDENTIAL_SIGNATURE_INVALID, noisy, [0]),
    ]);
    expect(err?.message).not.toContain('validUntil');
    expect(err?.message).not.toContain('did:key');
    expect(err?.message).not.toContain('Cannot read properties');
  });

  it('falls back to the OpenAttestation mapping for non-presentation documents', () => {
    const oa = [
      { name: 'OpenAttestationHash', type: 'DOCUMENT_INTEGRITY', status: 'INVALID' },
      { name: 'OpenAttestationDnsTxtIdentityProof', type: 'ISSUER_IDENTITY', status: 'VALID' },
      {
        name: 'OpenAttestationEthereumDocumentStoreStatus',
        type: 'DOCUMENT_STATUS',
        status: 'VALID',
      },
    ] as unknown as VerificationFragment[];
    const err = getVerificationError(oa);
    expect(err?.type).toBe(TYPES.HASH);
    expect(err?.title).toBe(MESSAGES[TYPES.HASH].failureTitle);
    expect(err?.message).toBe(MESSAGES[TYPES.HASH].failureMessage);
  });

  it('gives every presentation code a message with no placeholder left in it', () => {
    const codes = Object.values(W3CVpCode).filter((c): c is number => typeof c === 'number');
    for (const code of codes) {
      if (code === W3CVpCode.SKIPPED || code === W3CVpCode.UNEXPECTED_ERROR) continue;
      const err = getVerificationError([status(code, 'reason', [0])], presentationWith('X'));
      expect(err, `code ${W3CVpCode[code]} has no mapping`).toBeDefined();
      expect(err?.message).not.toContain('{credentials}');
      expect(err?.title).not.toBe('');
    }
  });
});

describe('renderErrorMessage', () => {
  it('leaves a template without a placeholder alone', () => {
    expect(renderErrorMessage({ failureMessage: 'No placeholder here.' }, [0, 1])).toBe(
      'No placeholder here.',
    );
  });

  it('uses the singular form for exactly one credential', () => {
    expect(
      renderErrorMessage(
        {
          failureMessage: '{credentials} is late.',
          failureMessagePlural: '{credentials} are late.',
        },
        [0],
      ),
    ).toBe('Credential 1 is late.');
  });

  it('falls back to "A credential" when no index is known', () => {
    expect(renderErrorMessage({ failureMessage: '{credentials} failed.' }, [])).toBe(
      'A credential failed.',
    );
  });
});
