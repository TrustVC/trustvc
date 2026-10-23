// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { fillInlineHtmlTemplate } from '../../inline-html-template';

const parse = (html: string): Document => new DOMParser().parseFromString(html, 'text/html');

describe('fillInlineHtmlTemplate', () => {
  it('fills flat data-field elements from the subject', () => {
    const doc = parse(
      `<div><span data-field="blNumber"></span><span data-field="scac"></span></div>`,
    );
    fillInlineHtmlTemplate(doc.body, { blNumber: 'SGCNM21566325', scac: '20250107' });
    expect(doc.querySelector('[data-field="blNumber"]')?.textContent).toBe('SGCNM21566325');
    expect(doc.querySelector('[data-field="scac"]')?.textContent).toBe('20250107');
  });

  it("fills missing fields as empty text instead of leaking 'undefined'/'null'", () => {
    const doc = parse(`<span data-field="doesNotExist"></span><span data-field="nil"></span>`);
    fillInlineHtmlTemplate(doc.body, { nil: null });
    doc.querySelectorAll('[data-field]').forEach((el) => expect(el.textContent).toBe(''));
  });

  it("fills primitives as text and objects/arrays as empty instead of '[object Object]'", () => {
    const doc = parse(`
      <span data-field="num"></span><span data-field="bool"></span>
      <span data-field="obj"></span><span data-field="arr"></span>
      <img id="objSrc" data-field-src="obj" src="placeholder.png">
    `);
    fillInlineHtmlTemplate(doc.body, { num: 0, bool: false, obj: { a: 1 }, arr: ['a'] });
    expect(doc.querySelector('[data-field="num"]')?.textContent).toBe('0');
    expect(doc.querySelector('[data-field="bool"]')?.textContent).toBe('false');
    expect(doc.querySelector('[data-field="obj"]')?.textContent).toBe('');
    expect(doc.querySelector('[data-field="arr"]')?.textContent).toBe('');
    expect(doc.getElementById('objSrc')?.hasAttribute('src')).toBe(false);
  });

  it('clones a <template data-repeat> block once per array item and fills each clone against that item', () => {
    const doc = parse(`
      <table><tbody>
        <template data-repeat="packages">
          <tr><td data-field="packagesDescription"></td><td data-field="packagesWeight"></td></tr>
        </template>
      </tbody></table>
    `);
    fillInlineHtmlTemplate(doc.body, {
      packages: [
        { packagesDescription: '1 container', packagesWeight: '1000kg' },
        { packagesDescription: '2nd container', packagesWeight: '2000kg' },
      ],
    });

    const rows = doc.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0]?.querySelector('[data-field="packagesDescription"]')?.textContent).toBe(
      '1 container',
    );
    expect(rows[0]?.querySelector('[data-field="packagesWeight"]')?.textContent).toBe('1000kg');
    expect(rows[1]?.querySelector('[data-field="packagesDescription"]')?.textContent).toBe(
      '2nd container',
    );
  });

  it('removes the <template> element itself after cloning, and produces zero rows for an empty array', () => {
    const doc = parse(`
      <table><tbody><template data-repeat="packages"><tr><td data-field="x"></td></tr></template></tbody></table>
    `);
    fillInlineHtmlTemplate(doc.body, { packages: [] });
    expect(doc.querySelector('template')).toBeNull();
    expect(doc.querySelectorAll('tr')).toHaveLength(0);
  });

  it('treats a non-array data-repeat value as an empty list instead of throwing', () => {
    for (const packages of ['not an array', { 0: { x: 'a' } }, 42]) {
      const doc = parse(
        `<table><tbody><template data-repeat="packages"><tr><td data-field="x"></td></tr></template></tbody></table>`,
      );
      expect(() => fillInlineHtmlTemplate(doc.body, { packages })).not.toThrow();
      expect(doc.querySelector('template')).toBeNull();
      expect(doc.querySelectorAll('tr')).toHaveLength(0);
    }
  });

  it('does not double-fill fields inside an unprocessed <template> when there is also a top-level field with the same name', () => {
    // template.content is inert and isn't part of the light-tree traversal used for the
    // top-level fill pass, so this must not accidentally stamp the repeat item's fields
    // onto the still-unfilled template contents before cloning.
    const doc = parse(`
      <div data-field="blNumber"></div>
      <template data-repeat="packages"><span data-field="blNumber"></span></template>
    `);
    fillInlineHtmlTemplate(doc.body, {
      blNumber: 'TOP-LEVEL',
      packages: [{ blNumber: 'FROM-ITEM' }],
    });
    expect(doc.querySelector('div[data-field="blNumber"]')?.textContent).toBe('TOP-LEVEL');
    expect(doc.querySelector('span[data-field="blNumber"]')?.textContent).toBe('FROM-ITEM');
  });

  it('treats field values as literal text -- a value containing markup never becomes child elements', () => {
    const doc = parse(`<div data-field="shipperName"></div>`);
    fillInlineHtmlTemplate(doc.body, { shipperName: '<img src=x onerror="alert(1)">' });
    const el = doc.querySelector('[data-field="shipperName"]');
    expect(el?.children).toHaveLength(0);
    expect(el?.textContent).toBe('<img src=x onerror="alert(1)">');
  });

  it('sets src from data-field-src, at top level and inside repeat clones, and removes it when missing', () => {
    const doc = parse(`
      <img id="logo" data-field-src="logo" src="placeholder.png">
      <img id="missing" data-field-src="nope" src="placeholder.png">
      <div id="list"><template data-repeat="items"><img data-field-src="icon"></template></div>
    `);
    fillInlineHtmlTemplate(doc.body, {
      logo: 'data:image/png;base64,AAAA',
      items: [{ icon: 'a.png' }, { icon: 'b.png' }],
    });
    expect(doc.getElementById('logo')?.getAttribute('src')).toBe('data:image/png;base64,AAAA');
    expect(doc.getElementById('missing')?.hasAttribute('src')).toBe(false);
    const icons = Array.from(doc.querySelectorAll('#list img')).map((img) =>
      img.getAttribute('src'),
    );
    expect(icons).toEqual(['a.png', 'b.png']);
  });
});
