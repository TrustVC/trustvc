// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderInlineTemplate } from '../../inline-template';

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

describe('renderInlineTemplate', () => {
  it('fills the stored template against credentialSubject inside a Shadow DOM on the host', () => {
    const host = document.createElement('div');
    expect(renderInlineTemplate(bolDocument, host)).toBe(true);

    const shadow = host.shadowRoot;
    expect(shadow).not.toBeNull();
    expect(shadow?.querySelector('[data-field="blNumber"]')?.textContent).toBe('SGCNM21566325');
    expect(shadow?.querySelector('[data-field="shipperName"]')?.textContent).toBe('Shipper Co');
    expect(shadow?.querySelectorAll('tr')).toHaveLength(2);
    expect(shadow?.querySelector('style')?.textContent).toBe(css);
  });

  it("does not leak the template's markup or CSS into the host's light DOM", () => {
    const host = document.createElement('div');
    renderInlineTemplate(bolDocument, host);
    expect(host.querySelector('style')).toBeNull();
    expect(host.textContent).toBe('');
  });

  it('replaces previous contents when re-rendered into the same host', () => {
    const host = document.createElement('div');
    renderInlineTemplate(bolDocument, host);
    renderInlineTemplate(
      { ...bolDocument, credentialSubject: { ...bolDocument.credentialSubject, packages: [] } },
      host,
    );
    expect(host.shadowRoot?.querySelectorAll('style')).toHaveLength(1);
    expect(host.shadowRoot?.querySelectorAll('.bol')).toHaveLength(1);
    expect(host.shadowRoot?.querySelectorAll('tr')).toHaveLength(0);
  });

  it('returns false and leaves the host untouched when the document has no INLINE_HTML_TEMPLATE entry', () => {
    const host = document.createElement('div');
    expect(
      renderInlineTemplate(
        { renderMethod: [{ id: 'https://x', type: 'EMBEDDED_RENDERER' }] },
        host,
      ),
    ).toBe(false);
    expect(host.shadowRoot).toBeNull();
  });
});
