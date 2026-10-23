/* global HTMLElement, ParentNode */
/*
 * Fills a parsed INLINE_HTML_TEMPLATE DOM tree against a credential's `credentialSubject`, in
 * place. Binding rules (ours, not a W3C convention):
 * - `[data-field="x"]` -- set to `String(data.x)` via `.textContent` (never `.innerHTML`,
 *   so injection via a malicious credentialSubject value is structurally impossible, not
 *   just escaped). Only primitive values are shown; objects and arrays fill as empty, like a
 *   missing value, rather than as `[object Object]`.
 * - `[data-field-src="x"]` -- set as the element's `src` (see `fillFieldSrc`).
 * - `<template data-repeat="x">...</template>` -- cloned once per item in `data.x` (an
 *   array); `data-field` attributes inside the clone resolve against that array item, not
 *   the top-level `data`.
 *
 * `root` is expected to come from a freshly `DOMParser`-parsed document (see
 * `buildInlineHtmlTemplateSrcdoc`) -- never the live page document. The parsed tree is only
 * inert while detached: event-handler attributes in the template run once its nodes reach a
 * live page, so the filled result must only ever be shown inside the sandboxed iframe that
 * `renderInlineHtmlTemplate` creates.
 */
const toText = (value: unknown): string | undefined =>
  typeof value === 'string' ||
  typeof value === 'number' ||
  typeof value === 'boolean' ||
  typeof value === 'bigint'
    ? String(value)
    : undefined;

function fillField(el: HTMLElement, data: Record<string, unknown> | undefined): void {
  const key = el.dataset.field;
  if (!key) return;
  el.textContent = toText(data?.[key]) ?? '';
}

/**
 * `[data-field-src="x"]` -- set via `.src` instead of `.textContent`, for an `<img>` (e.g. a
 * `logo` field carrying a `data:` URI). Kept as a narrow, single-purpose directive -- "set
 * src on an img" -- rather than a generic "set this attribute" mechanism, since an
 * `<img src>` can't execute script even from an attacker-controlled value (unlike, say, an
 * `href`), so this can't become an injection vector the way a generic attribute-setter could.
 * @param {HTMLElement} el - Element carrying the `data-field-src` attribute.
 * @param {Record<string, unknown> | undefined} data - Data the attribute's key resolves against.
 */
function fillFieldSrc(el: HTMLElement, data: Record<string, unknown> | undefined): void {
  const key = el.dataset.fieldSrc;
  if (!key) return;
  const src = toText(data?.[key]);
  if (src === undefined) {
    el.removeAttribute('src');
    return;
  }
  el.setAttribute('src', src);
}

/**
 * Fills an INLINE_HTML_TEMPLATE DOM tree in place against `subject` (see the binding rules above).
 * @param {ParentNode} root - Root of a detached, `DOMParser`-parsed template tree.
 * @param {Record<string, unknown> | undefined} subject - Usually the credential's `credentialSubject`.
 */
export function fillInlineHtmlTemplate(
  root: ParentNode,
  subject: Record<string, unknown> | undefined,
): void {
  // Fill top-level fields FIRST, while every <template>'s content is still an inert
  // DocumentFragment (not part of the light tree, so this querySelectorAll can't reach
  // inside it). Repeat blocks are cloned and inserted afterwards, last, specifically so
  // there is no later top-level pass left to re-touch (and clobber) the freshly-filled
  // clones with the wrong (parent-scoped) data.
  root.querySelectorAll<HTMLElement>('[data-field]').forEach((el) => fillField(el, subject));
  root.querySelectorAll<HTMLElement>('[data-field-src]').forEach((el) => fillFieldSrc(el, subject));

  root.querySelectorAll<HTMLTemplateElement>('template[data-repeat]').forEach((tpl) => {
    const key = tpl.dataset.repeat;
    // Credential data is issuer-controlled: a non-array value (string, object) renders as an
    // empty list rather than throwing on .forEach.
    const value = key ? subject?.[key] : undefined;
    const items = Array.isArray(value) ? (value as Record<string, unknown>[]) : [];

    const ownerDocument = tpl.ownerDocument;
    items.forEach((item) => {
      const clone = ownerDocument.importNode(tpl.content, true);
      clone
        .querySelectorAll<HTMLElement>('[data-field]')
        .forEach((fieldEl) => fillField(fieldEl, item));
      clone
        .querySelectorAll<HTMLElement>('[data-field-src]')
        .forEach((fieldEl) => fillFieldSrc(fieldEl, item));
      tpl.before(clone);
    });
    tpl.remove();
  });
}
