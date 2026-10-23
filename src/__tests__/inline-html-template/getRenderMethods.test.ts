import { describe, expect, it } from 'vitest';
import { getRenderMethods, RenderMethods } from '../../inline-html-template';

const renderer = {
  id: 'https://generic-templates.tradetrust.io',
  type: 'EMBEDDED_RENDERER',
  templateName: 'BILL_OF_LADING',
};
const compressed = {
  type: 'INLINE_HTML_TEMPLATE',
  template: 'H4sIAAAAAAAAA6tWKkktLlGyUlAqzUvOz00tKk5VqAUAuDHZ_RkAAAA',
};
const plain = {
  type: 'INLINE_HTML_TEMPLATE',
  template: { templateName: 'BILL_OF_LADING', html: '<div></div>', css: '' },
};

describe('getRenderMethods', () => {
  it('returns both the inline HTML template and the renderer fallback', () => {
    expect(getRenderMethods({ renderMethod: [renderer, compressed] })).toEqual({
      inlineHtmlTemplate: compressed,
      renderer,
    });
  });

  it('does not depend on entry order', () => {
    expect(getRenderMethods({ renderMethod: [plain, renderer] })).toEqual({
      inlineHtmlTemplate: plain,
      renderer,
    });
  });

  it('accepts a single (non-array) renderMethod object', () => {
    expect(getRenderMethods({ renderMethod: renderer })).toEqual({
      inlineHtmlTemplate: undefined,
      renderer,
    });
    expect(getRenderMethods({ renderMethod: compressed })).toEqual({
      inlineHtmlTemplate: compressed,
      renderer: undefined,
    });
  });

  it('returns nothing for documents without a usable renderMethod', () => {
    const none: RenderMethods = { inlineHtmlTemplate: undefined, renderer: undefined };
    expect(getRenderMethods(undefined)).toEqual(none);
    expect(getRenderMethods({})).toEqual(none);
    expect(
      getRenderMethods({
        renderMethod: [
          null,
          'https://example.com',
          { type: 'EMBEDDED_RENDERER', id: '' },
          { type: 'INLINE_HTML_TEMPLATE' },
          { type: 'INLINE_HTML_TEMPLATE', template: 42 },
        ],
      }),
    ).toEqual(none);
  });

  it('skips an object-form template whose templateName, html or css is not a string', () => {
    for (const template of [
      {},
      { templateName: 'X', html: '<div></div>' },
      { templateName: 'X', html: 42, css: '' },
    ]) {
      expect(
        getRenderMethods({ renderMethod: [{ type: 'INLINE_HTML_TEMPLATE', template }, renderer] }),
      ).toEqual({ inlineHtmlTemplate: undefined, renderer });
    }
  });
});
