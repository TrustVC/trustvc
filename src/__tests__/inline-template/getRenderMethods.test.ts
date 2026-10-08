import { describe, expect, it } from 'vitest';
import { getRenderMethods, RenderMethods } from '../../inline-template';

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
  it('returns both the inline template and the renderer fallback', () => {
    expect(getRenderMethods({ renderMethod: [renderer, compressed] })).toEqual({
      inlineTemplate: compressed,
      renderer,
    });
  });

  it('does not depend on entry order', () => {
    expect(getRenderMethods({ renderMethod: [plain, renderer] })).toEqual({
      inlineTemplate: plain,
      renderer,
    });
  });

  it('accepts a single (non-array) renderMethod object', () => {
    expect(getRenderMethods({ renderMethod: renderer })).toEqual({
      inlineTemplate: undefined,
      renderer,
    });
    expect(getRenderMethods({ renderMethod: compressed })).toEqual({
      inlineTemplate: compressed,
      renderer: undefined,
    });
  });

  it('returns nothing for documents without a usable renderMethod', () => {
    const none: RenderMethods = { inlineTemplate: undefined, renderer: undefined };
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
});
