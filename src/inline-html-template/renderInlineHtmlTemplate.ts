/* global HTMLElement, HTMLIFrameElement, Element, Event */
import { fillInlineHtmlTemplate } from './fillInlineHtmlTemplate';
import { findInlineHtmlTemplateRenderMethod } from './findInlineHtmlTemplateRenderMethod';

/**
 * CSP for the rendered template. The template must render fully offline from the signed
 * credential: no remote scripts, stylesheets, fonts, images, frames or form targets. Inline
 * `<style>` / `style=""` are allowed (the template's CSS is shipped inline), and `data:`
 * images / fonts are allowed (that is how a template embeds its logo / fonts).
 */
export const INLINE_HTML_TEMPLATE_CSP =
  "default-src 'none'; img-src data:; font-src data:; style-src 'unsafe-inline'; form-action 'none'";

/**
 * Sandbox flags for the iframe the template renders in. `allow-same-origin` WITHOUT
 * `allow-scripts`: nothing in the frame can run (no `<script>`, no `onerror=` / `onload=`
 * handlers, no `javascript:` URLs), so same-origin only lets the host page measure the
 * frame's height, intercept link clicks and print the frame. Never add `allow-scripts`
 * alongside it -- that pair lets the frame remove its own sandbox. `allow-modals` is only
 * there because browsers ignore `print()` on a sandboxed frame without it (see
 * `printInlineHtmlTemplate`); with no scripts in the frame, the template itself can't open any
 * dialog. Forms, popups and top-level navigation stay blocked because their flags are absent.
 */
export const INLINE_HTML_TEMPLATE_SANDBOX = 'allow-same-origin allow-modals';

/**
 * Builds the complete, filled HTML document for a credential's `INLINE_HTML_TEMPLATE` entry,
 * ready to be used as a sandboxed iframe's `srcdoc` (see `renderInlineHtmlTemplate`).
 *
 * The template is parsed with DOMParser and filled in that detached document. Only its
 * `<body>` content is kept; the template's CSS comes from `template.css`. The CSP `<meta>`
 * is placed first so it applies before any template content is parsed.
 *
 * Browser-only: needs `DOMParser`.
 * @param {unknown} document - The credential / document to render.
 * @returns {string | undefined} The srcdoc HTML, or `undefined` if the document has no
 * renderable `INLINE_HTML_TEMPLATE` entry.
 */
export function buildInlineHtmlTemplateSrcdoc(document: unknown): string | undefined {
  const method = findInlineHtmlTemplateRenderMethod(document);
  if (!method) return undefined;
  const credentialSubject = (document as { credentialSubject?: Record<string, unknown> })
    ?.credentialSubject;

  const parser = new DOMParser();
  const parsed = parser.parseFromString(method.template.html, 'text/html');
  fillInlineHtmlTemplate(parsed.body, credentialSubject);

  const out = parser.parseFromString(
    '<!doctype html><html><head></head><body></body></html>',
    'text/html',
  );
  const csp = out.createElement('meta');
  csp.setAttribute('http-equiv', 'Content-Security-Policy');
  csp.setAttribute('content', INLINE_HTML_TEMPLATE_CSP);
  out.head.appendChild(csp);
  const charset = out.createElement('meta');
  charset.setAttribute('charset', 'utf-8');
  out.head.appendChild(charset);
  // Matches the previous Shadow DOM rendering, which had no body margin; the template's own
  // CSS comes after this, so it can override it.
  const reset = out.createElement('style');
  reset.textContent = 'html,body{margin:0;padding:0}';
  out.head.appendChild(reset);
  const style = out.createElement('style');
  // `<style>` text is serialised unescaped, so a `</style` in the CSS would close the element
  // early. Harmless inside the sandbox, but keep the CSS where it belongs.
  style.textContent = method.template.css.replace(/<\/style/gi, String.raw`<\/style`);
  out.head.appendChild(style);
  // DOMParser moves these into <head> (dropped above) only when they lead the markup; after body
  // content, or cloned out of a repeat block, they stay in <body>. There a meta refresh would
  // navigate the frame to an unsigned page, <base> would retarget relative URLs, and some
  // <link> hints fetch outside the CSP. Removed after filling so repeat clones are covered.
  parsed.body.querySelectorAll('meta, base, link').forEach((el) => el.remove());
  Array.from(parsed.body.childNodes).forEach((node) =>
    out.body.appendChild(out.importNode(node, true)),
  );

  return `<!doctype html>${out.documentElement.outerHTML}`;
}

const cleanups = new WeakMap<HTMLElement, () => void>();

/**
 * Cancels link navigation inside the frame. The sandbox already blocks popups and
 * `target="_top"`, but a plain `<a href>` would still load another page inside the frame,
 * which would then sit under the host page's verification status without being signed.
 * In-page `#fragment` links are left alone.
 * @param {Event} event - A click event from the frame's document.
 */
function blockLinkNavigation(event: Event): void {
  const target = event.target as Element | null;
  const link = target?.closest?.('a, area');
  if (!link) return;
  const href = link.getAttribute('href');
  if (href !== null && href.startsWith('#')) return;
  event.preventDefault();
}

/**
 * Renders a document's `INLINE_HTML_TEMPLATE` renderMethod entry into `host`, if it has one -- the
 * credential carries its own markup and CSS as plain data, and this fills that markup against
 * the credential's own `credentialSubject`.
 *
 * The filled template is mounted in a sandboxed `<iframe srcdoc>` inside `host`, NOT in the
 * host page's DOM. Template HTML is issuer-controlled, and DOMParser only stops `<script>`
 * tags: event-handler attributes (`<img onerror>`, `<svg onload>`, ...) and `javascript:`
 * links run as soon as the nodes reach a live page, and a Shadow DOM is not a security
 * boundary (template CSS could also cover the host page with `position: fixed`). In the
 * frame, nothing can run, nothing remote can load (`INLINE_HTML_TEMPLATE_CSP`), and the template
 * can only draw inside its own box. The frame's height follows its content.
 *
 * Framework-agnostic: callers (e.g. a React component's effect) own `host`'s lifecycle.
 *
 * Browser-only: needs `DOMParser`. Safe to import in Node; just don't call it there.
 * @param {unknown} document - The credential / document to render.
 * @param {HTMLElement} host - Element to render into. Re-rendering into the same host
 * replaces its previous contents.
 * @returns {boolean} `true` if an `INLINE_HTML_TEMPLATE` entry was found and rendered, `false` otherwise
 * (`host` is left untouched).
 */
export function renderInlineHtmlTemplate(document: unknown, host: HTMLElement): boolean {
  const srcdoc = buildInlineHtmlTemplateSrcdoc(document);
  if (srcdoc === undefined) return false;

  cleanups.get(host)?.();
  const view = host.ownerDocument.defaultView;
  const frame = host.ownerDocument.createElement('iframe') as HTMLIFrameElement;
  frame.setAttribute('sandbox', INLINE_HTML_TEMPLATE_SANDBOX);
  frame.setAttribute('title', 'Document');
  frame.setAttribute('scrolling', 'no');
  frame.style.display = 'block';
  frame.style.width = '100%';
  frame.style.border = '0';

  let observer: { disconnect: () => void } | undefined;
  const onLoad = () => {
    const doc = frame.contentDocument;
    if (!doc) return;
    doc.addEventListener('click', blockLinkNavigation, true);
    const resize = () => {
      frame.style.height = `${doc.documentElement.scrollHeight}px`;
    };
    resize();
    observer?.disconnect();
    if (view?.ResizeObserver) {
      const ro = new view.ResizeObserver(resize);
      ro.observe(doc.documentElement);
      observer = ro;
    }
  };
  frame.addEventListener('load', onLoad);
  cleanups.set(host, () => {
    frame.removeEventListener('load', onLoad);
    observer?.disconnect();
  });

  frame.srcdoc = srcdoc;
  host.replaceChildren(frame);
  return true;
}

/**
 * Opens the browser's print dialog for the template `renderInlineHtmlTemplate` mounted in `host`,
 * printing only the template -- not the host page around it.
 *
 * Browser-only. Call it from a user gesture (e.g. a Print button's click handler).
 * @param {HTMLElement} host - The element previously passed to `renderInlineHtmlTemplate`.
 * @returns {boolean} `true` if a rendered template was found and the print dialog requested,
 * `false` otherwise (nothing rendered in `host` yet, or the render failed).
 */
export function printInlineHtmlTemplate(host: HTMLElement): boolean {
  const view = host.querySelector('iframe')?.contentWindow;
  if (!view) return false;
  view.focus();
  view.print();
  return true;
}
