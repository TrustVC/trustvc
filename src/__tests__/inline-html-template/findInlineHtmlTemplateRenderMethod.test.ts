import { describe, expect, it } from 'vitest';
import { findInlineHtmlTemplateRenderMethod } from '../../inline-html-template';

describe('findInlineHtmlTemplateRenderMethod', () => {
  it('finds an INLINE_HTML_TEMPLATE entry among other renderMethod entries', () => {
    const document = {
      renderMethod: [
        {
          id: 'https://generic-templates.tradetrust.io',
          type: 'EMBEDDED_RENDERER',
          templateName: 'BILL_OF_LADING',
        },
        {
          type: 'INLINE_HTML_TEMPLATE',
          template: { templateName: 'BILL_OF_LADING', html: '<div></div>', css: '' },
        },
      ],
    };
    expect(findInlineHtmlTemplateRenderMethod(document)?.template.templateName).toBe(
      'BILL_OF_LADING',
    );
  });

  it('accepts a single (non-array) renderMethod object', () => {
    const document = {
      renderMethod: {
        type: 'INLINE_HTML_TEMPLATE',
        template: { templateName: 'INVOICE', html: '', css: '' },
      },
    };
    expect(findInlineHtmlTemplateRenderMethod(document)?.template.templateName).toBe('INVOICE');
  });

  it('returns undefined when there is no INLINE_HTML_TEMPLATE entry', () => {
    const document = {
      renderMethod: [{ id: 'https://x', type: 'EMBEDDED_RENDERER', templateName: 'X' }],
    };
    expect(findInlineHtmlTemplateRenderMethod(document)).toBeUndefined();
  });

  it('skips an object-form template whose templateName, html or css is not a string', () => {
    for (const template of [
      {},
      { templateName: 'X', html: '<div></div>' },
      { templateName: 'X', css: '' },
      { html: '<div></div>', css: '' },
      { templateName: 'X', html: 42, css: '' },
    ]) {
      const document = { renderMethod: [{ type: 'INLINE_HTML_TEMPLATE', template }] };
      expect(findInlineHtmlTemplateRenderMethod(document)).toBeUndefined();
    }
  });

  it('returns undefined when renderMethod is missing entirely', () => {
    expect(findInlineHtmlTemplateRenderMethod({})).toBeUndefined();
    expect(findInlineHtmlTemplateRenderMethod(undefined)).toBeUndefined();
  });
});
