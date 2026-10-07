import { describe, expect, it } from 'vitest';
import { getVerificationError } from '../../../utils/fragment';
import { errorMessages } from '../../../utils/errorMessages';
import { W3CVpCode } from '../../../verify/fragments/presentation/w3cVpVerifier';

const { MESSAGES } = errorMessages;

/**
 * The agreed presentation copy, verbatim — one row per failure a user can be shown.
 *
 * This is a SPEC, not a snapshot: the strings were written and signed off deliberately, and a
 * change to any of them is a change to what a person is told when their document fails. Update
 * a row here only alongside the decision to reword it, never to make a build pass.
 */
const DOC = {
  type: ['VerifiablePresentation'],
  verifiableCredential: [
    { type: ['VerifiableCredential'] },
    { type: ['VerifiableCredential'], renderMethod: [{ templateName: 'BILL_OF_LADING' }] },
  ],
};

const fragment = (code: W3CVpCode, credentialIndices: number[]) =>
  ({
    name: 'W3CVpCredentialStatus',
    type: 'DOCUMENT_STATUS',
    status: 'INVALID',
    reason: { code, codeString: W3CVpCode[code], message: 'verifier prose, never shown' },
    data: { credentialIndices },
  }) as never;

type Row = [label: string, code: W3CVpCode, indices: number[], title: string, body: string];

const ENVELOPE: Row[] = [
  [
    'not signed',
    W3CVpCode.PRESENTATION_UNSIGNED,
    [],
    'Presentation not signed',
    'This presentation is not signed, so the presenter cannot prove the credentials are theirs. Please ask the holder to present them again.',
  ],
  [
    "holder's signature fails",
    W3CVpCode.PRESENTATION_PROOF_INVALID,
    [],
    'Presentation has been tampered with',
    "The presenter's signature does not match the contents of this presentation. Please ask the holder to present the credentials again.",
  ],
  [
    'proof carries no verificationMethod',
    W3CVpCode.PRESENTATION_PROOF_INCOMPLETE,
    [],
    'Presentation not signed',
    'This presentation carries no usable signature, so the presenter cannot prove the credentials are theirs. Please ask the holder to present them again.',
  ],
  [
    'signed by someone other than the declared holder',
    W3CVpCode.PRESENTATION_HOLDER_MISMATCH,
    [],
    'Presentation not signed by the holder',
    'This presentation was signed by someone other than the holder it names, so the presenter cannot prove the credentials are theirs. Please ask the holder to present them again.',
  ],
  [
    'expired',
    W3CVpCode.PRESENTATION_EXPIRED,
    [],
    'Presentation expired',
    'This presentation has expired and can no longer be used. Please ask the holder to present the credentials again.',
  ],
  [
    'expiry date unreadable',
    W3CVpCode.PRESENTATION_DATE_INVALID,
    [],
    'Presentation is invalid',
    'This presentation has an unreadable expiry date, so we cannot tell whether it is still usable. Please ask the holder to present the credentials again.',
  ],
  [
    'not yet valid',
    W3CVpCode.PRESENTATION_NOT_YET_VALID,
    [],
    'Presentation not yet valid',
    'This presentation does not take effect yet. Please check with the issuing authority before presenting it again.',
  ],
  [
    'contains no credentials',
    W3CVpCode.PRESENTATION_EMPTY,
    [],
    'Presentation is empty',
    'This presentation does not contain any credentials to verify. Please ask the holder to present them again.',
  ],
];

const CREDENTIALS: Row[] = [
  [
    'does not say who it was issued to',
    W3CVpCode.CREDENTIAL_SUBJECT_MISSING,
    [1],
    'Presentation not signed by the holder',
    'Credential 2 ("BILL OF LADING") does not say who it was issued to, so we cannot confirm the presenter holds it. Please ask the issuing authority to reissue it.',
  ],
  [
    'revoked',
    W3CVpCode.CREDENTIAL_REVOKED,
    [1],
    'Credential revoked',
    'Credential 2 ("BILL OF LADING") has been revoked by the issuing authority. Please contact them for more details.',
  ],
  [
    'suspended',
    W3CVpCode.CREDENTIAL_SUSPENDED,
    [1],
    'Credential suspended',
    'Credential 2 ("BILL OF LADING") has been suspended by the issuing authority. Please contact them for more details.',
  ],
  [
    'expired',
    W3CVpCode.CREDENTIAL_EXPIRED,
    [1],
    'Credential expired',
    'Credential 2 ("BILL OF LADING") has expired. Please ask the issuing authority to reissue it. Presenting it again will not help.',
  ],
  [
    'not yet valid',
    W3CVpCode.CREDENTIAL_NOT_YET_VALID,
    [1],
    'Credential not yet valid',
    'Credential 2 ("BILL OF LADING") does not take effect yet. Please check with the issuing authority before presenting it again.',
  ],
  [
    'dates unreadable',
    W3CVpCode.CREDENTIAL_DATE_INVALID,
    [1],
    'Credential is invalid',
    'Credential 2 ("BILL OF LADING") has an unreadable date, so we cannot tell whether it is still valid. Please ask the issuing authority to reissue it.',
  ],
  [
    'contents do not match its signature',
    W3CVpCode.CREDENTIAL_SIGNATURE_INVALID,
    [1],
    'Credential has been tampered with',
    'The contents of Credential 2 ("BILL OF LADING") do not match its signature. Please ask the issuing authority for a fresh copy.',
  ],
  [
    'issuer cannot be identified',
    W3CVpCode.CREDENTIAL_ISSUER_UNRESOLVABLE,
    [1],
    'Credential issuer cannot be identified',
    'We could not identify who issued Credential 2 ("BILL OF LADING"), so it cannot be verified. Please contact the issuing authority.',
  ],
  [
    'issuer is missing — same copy, deliberately merged',
    W3CVpCode.CREDENTIAL_ISSUER_MISSING,
    [1],
    'Credential issuer cannot be identified',
    'We could not identify who issued Credential 2 ("BILL OF LADING"), so it cannot be verified. Please contact the issuing authority.',
  ],
];

const INCOMPLETE: Row[] = [
  [
    'revocation list could not be reached',
    W3CVpCode.CREDENTIAL_STATUS_ERROR,
    [1],
    'Unable to check credential status',
    'We could not reach the status list for Credential 2 ("BILL OF LADING"), so we cannot confirm it is still valid. Please try again later.',
  ],
  [
    'unsupported revocation method',
    W3CVpCode.CREDENTIAL_STATUS_UNSUPPORTED,
    [1],
    'Unable to check credential status',
    'Credential 2 ("BILL OF LADING") records its status in a way we do not support, so we cannot confirm it is still valid. Please contact the issuing authority.',
  ],
  [
    'anything unrecognised — the true fallback',
    9999 as W3CVpCode,
    [],
    'Presentation could not be verified',
    'We could not verify this presentation. Please try again later. If this keeps happening, contact us using the feedback link below.',
  ],
];

describe('presentation copy, as specified', () => {
  // A credential issued to SOMEBODY ELSE deliberately shares the holder-mismatch row: either
  // way the presenter cannot show the credentials are theirs, and the remedy is the same.
  const SHARED: Row[] = [
    [
      'issued to someone other than the presenter',
      W3CVpCode.CREDENTIAL_SUBJECT_MISMATCH,
      [1],
      'Presentation not signed by the holder',
      'This presentation was signed by someone other than the holder it names, so the presenter cannot prove the credentials are theirs. Please ask the holder to present them again.',
    ],
  ];
  const check = ([label, code, indices, title, body]: Row) => {
    it(label, () => {
      const err = getVerificationError([fragment(code, indices)], DOC);
      expect(err, 'no failure resolved').toBeDefined();
      expect(MESSAGES[err?.type as string]?.failureTitle).toBe(title);
      expect(err?.message).toBe(body);
    });
  };

  describe('the presentation envelope', () => ENVELOPE.forEach(check));
  describe('credentials inside the presentation', () => CREDENTIALS.forEach(check));
  describe('checks we could not complete', () => INCOMPLETE.forEach(check));
  describe('failures that share a row', () => SHARED.forEach(check));
});
