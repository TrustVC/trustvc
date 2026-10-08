/* global HTMLElement */
import { fillInlineTemplate } from './fillInlineTemplate';
import { findInlineTemplateRenderMethod } from './findInlineTemplateRenderMethod';

/**
 * Renders a document's `INLINE_HTML_TEMPLATE` renderMethod entry into `host`, if it has one -- the
 * credential carries its own markup and CSS as plain data, and this fills that markup against
 * the credential's own `credentialSubject`.
 *
 * Framework-agnostic: callers (e.g. a React component's effect) own `host`'s lifecycle.
 *
 * Deliberately NOT an iframe: there's no renderMethod URL involved and no remote code to
 * sandbox. The template is parsed via DOMParser (never inserted with innerHTML against the
 * live page), filled in that detached document, and only the filled result is moved into a
 * Shadow DOM on `host` -- so the page's CSS can't leak into the template and the template's
 * CSS can't leak into the page, without hand-namespacing every selector.
 *
 * Browser-only: needs `DOMParser` and `attachShadow`. Safe to import in Node; just don't call it there.
 * @param {unknown} document - The credential / document to render.
 * @param {HTMLElement} host - Element to attach (or reuse) an open shadow root on. Re-rendering
 * into the same host replaces its previous shadow contents.
 * @returns {boolean} `true` if an `INLINE_HTML_TEMPLATE` entry was found and rendered, `false` otherwise
 * (`host` is left untouched).
 */
export function renderInlineTemplate(document: unknown, host: HTMLElement): boolean {
  const method = findInlineTemplateRenderMethod(document);
  if (!method) return false;
  const credentialSubject = (document as { credentialSubject?: Record<string, unknown> })
    ?.credentialSubject;

  const parsed = new DOMParser().parseFromString(method.template.html, 'text/html');
  fillInlineTemplate(parsed.body, credentialSubject);

  const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
  shadow.innerHTML = '';
  const style = host.ownerDocument.createElement('style');
  style.textContent = method.template.css;
  shadow.appendChild(style);
  Array.from(parsed.body.childNodes).forEach((node) => shadow.appendChild(node));
  return true;
}
