// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import {
  buildInlineTemplateSrcdoc,
  INLINE_TEMPLATE_CSP,
  INLINE_TEMPLATE_SANDBOX,
  printInlineTemplate,
  renderInlineTemplate,
} from '../../inline-template';

const html = `
  <div class="bol">
    <div data-field="blNumber"></div>
    <div data-field="shipperName"></div>
    <table><tbody>
      <template data-repeat="packages">
        <tr><td data-field="packagesDescription"></td></tr>
      </template>
    </tbody></table>
  </div>
`;
const css = '.bol { color: red; }';

const bolDocument = {
  renderMethod: [
    { type: 'INLINE_HTML_TEMPLATE', template: { templateName: 'BILL_OF_LADING', html, css } },
  ],
  credentialSubject: {
    blNumber: 'SGCNM21566325',
    shipperName: 'Shipper Co',
    packages: [{ packagesDescription: '1 container' }, { packagesDescription: '2nd container' }],
  },
};

const withTemplate = (templateHtml: string, templateCss = '') => ({
  renderMethod: [
    {
      type: 'INLINE_HTML_TEMPLATE',
      template: { templateName: 'T', html: templateHtml, css: templateCss },
    },
  ],
  credentialSubject: {},
});

const parse = (srcdoc: string | undefined) =>
  new DOMParser().parseFromString(srcdoc ?? '', 'text/html');

describe('buildInlineTemplateSrcdoc', () => {
  it('fills the stored template against credentialSubject', () => {
    const doc = parse(buildInlineTemplateSrcdoc(bolDocument));
    expect(doc.querySelector('[data-field="blNumber"]')?.textContent).toBe('SGCNM21566325');
    expect(doc.querySelector('[data-field="shipperName"]')?.textContent).toBe('Shipper Co');
    expect(doc.querySelectorAll('tr')).toHaveLength(2);
    expect(Array.from(doc.head.querySelectorAll('style')).map((s) => s.textContent)).toContain(css);
  });

  it('puts the CSP meta first in <head>, before any template CSS', () => {
    const doc = parse(buildInlineTemplateSrcdoc(bolDocument));
    const first = doc.head.firstElementChild;
    expect(first?.getAttribute('http-equiv')).toBe('Content-Security-Policy');
    expect(first?.getAttribute('content')).toBe(INLINE_TEMPLATE_CSP);
  });

  it('keeps a </style> in the template CSS from closing the style element', () => {
    const doc = parse(
      buildInlineTemplateSrcdoc(withTemplate('<p>x</p>', 'p{}</style><img id="escaped">')),
    );
    expect(doc.getElementById('escaped')).toBeNull();
  });

  it('returns undefined when the document has no INLINE_HTML_TEMPLATE entry', () => {
    expect(
      buildInlineTemplateSrcdoc({ renderMethod: [{ id: 'https://x', type: 'EMBEDDED_RENDERER' }] }),
    ).toBeUndefined();
  });
});

describe('renderInlineTemplate', () => {
  it('mounts the filled template in a sandboxed srcdoc iframe on the host', () => {
    const host = document.createElement('div');
    expect(renderInlineTemplate(bolDocument, host)).toBe(true);

    const frames = host.querySelectorAll('iframe');
    expect(frames).toHaveLength(1);
    expect(frames[0].getAttribute('sandbox')).toBe(INLINE_TEMPLATE_SANDBOX);
    expect(frames[0].srcdoc).toBe(buildInlineTemplateSrcdoc(bolDocument));
  });

  it('never grants allow-scripts to the frame', () => {
    expect(INLINE_TEMPLATE_SANDBOX.split(/\s+/)).not.toContain('allow-scripts');
  });

  it("does not put the template's markup or CSS into the host page's DOM", () => {
    const host = document.createElement('div');
    renderInlineTemplate(
      withTemplate('<img src="data:," onerror="window.__ran = true"><p>x</p>', css),
      host,
    );
    expect(host.shadowRoot).toBeNull();
    expect(host.querySelector('img, style, p')).toBeNull();
    expect(host.textContent).toBe('');
  });

  it('replaces previous contents when re-rendered into the same host', () => {
    const host = document.createElement('div');
    renderInlineTemplate(bolDocument, host);
    renderInlineTemplate(
      { ...bolDocument, credentialSubject: { ...bolDocument.credentialSubject, packages: [] } },
      host,
    );
    const frames = host.querySelectorAll('iframe');
    expect(frames).toHaveLength(1);
    expect(parse(frames[0].srcdoc).querySelectorAll('tr')).toHaveLength(0);
  });

  it('returns false and leaves the host untouched when the document has no INLINE_HTML_TEMPLATE entry', () => {
    const host = document.createElement('div');
    expect(
      renderInlineTemplate(
        { renderMethod: [{ id: 'https://x', type: 'EMBEDDED_RENDERER' }] },
        host,
      ),
    ).toBe(false);
    expect(host.childNodes).toHaveLength(0);
  });
});

describe('printInlineTemplate', () => {
  it("prints the rendered frame's window, not the host page", () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    renderInlineTemplate(bolDocument, host);
    const frameWindow = host.querySelector('iframe')!.contentWindow!;
    vi.spyOn(frameWindow, 'focus').mockImplementation(() => undefined);
    const framePrint = vi.spyOn(frameWindow, 'print').mockImplementation(() => undefined);
    const pagePrint = vi.spyOn(window, 'print').mockImplementation(() => undefined);

    expect(printInlineTemplate(host)).toBe(true);
    expect(framePrint).toHaveBeenCalledTimes(1);
    expect(pagePrint).not.toHaveBeenCalled();
    host.remove();
  });

  it('allows print() in the sandboxed frame without allowing scripts', () => {
    const flags = INLINE_TEMPLATE_SANDBOX.split(/\s+/);
    expect(flags).toContain('allow-modals');
    expect(flags).not.toContain('allow-scripts');
  });

  it('returns false when nothing has been rendered into the host', () => {
    expect(printInlineTemplate(document.createElement('div'))).toBe(false);
  });
});
