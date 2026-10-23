import { describe, expect, it } from 'vitest';
import {
  compressTemplate,
  decompressInlineHtmlTemplate,
  findInlineHtmlTemplateRenderMethod,
  isCompressedInlineHtmlTemplate,
} from '../../inline-html-template';

const template = {
  templateName: 'BILL_OF_LADING',
  html: '<div class="bol"><span data-field="blNumber"></span></div>'.repeat(50),
  css: '.bol { color: red; } '.repeat(50),
};

const unsignedDoc = {
  type: ['VerifiableCredential'],
  credentialSubject: { blNumber: 'SGCNM21566325' },
  renderMethod: [
    {
      id: 'https://generic-templates.tradetrust.io',
      type: 'EMBEDDED_RENDERER',
      templateName: 'BILL_OF_LADING',
    },
    { type: 'INLINE_HTML_TEMPLATE', template },
  ],
};

// Builds a document carrying `tpl` compressed, the way an issuer does before signing.
const withCompressed = async <T extends { renderMethod: unknown[] }>(doc: T) => ({
  ...doc,
  renderMethod: await Promise.all(
    doc.renderMethod.map(async (m) => {
      const entry = m as { type?: string; template?: unknown };
      return entry.type === 'INLINE_HTML_TEMPLATE' && typeof entry.template === 'object'
        ? { ...entry, template: await compressTemplate(entry.template as typeof template) }
        : m;
    }),
  ),
});

describe('compressTemplate', () => {
  it('compresses HTML + CSS into the string an INLINE_HTML_TEMPLATE entry carries', async () => {
    const compressed = await compressTemplate(template);
    expect(compressed).toMatch(/^H4sI[A-Za-z0-9_-]+$/);

    const doc = { renderMethod: [{ type: 'INLINE_HTML_TEMPLATE', template: compressed }] };
    expect(isCompressedInlineHtmlTemplate(doc)).toBe(true);
    const restored = await decompressInlineHtmlTemplate(doc);
    expect(findInlineHtmlTemplateRenderMethod(restored)?.template).toEqual(template);
    expect(isCompressedInlineHtmlTemplate(restored)).toBe(false);
  });

  it('only compresses templateName, html and css, dropping anything else on the object', async () => {
    const compressed = await compressTemplate({
      ...template,
      credentialSubject: { a: 1 },
    } as never);
    const doc = { renderMethod: [{ type: 'INLINE_HTML_TEMPLATE', template: compressed }] };
    const restored = await decompressInlineHtmlTemplate(doc);
    expect(findInlineHtmlTemplateRenderMethod(restored)?.template).toEqual(template);
  });

  it('rejects a whole credential instead of a template object', async () => {
    await expect(compressTemplate(unsignedDoc as never)).rejects.toThrow(
      'Inline HTML template must be an object with string templateName, html and css',
    );
  });

  it('rejects a template missing html, css or templateName', async () => {
    await expect(compressTemplate({ ...template, css: undefined } as never)).rejects.toThrow(
      'Inline HTML template must be an object with string templateName, html and css',
    );
  });
});

describe('decompressInlineHtmlTemplate', () => {
  it('round-trips back to the original document', async () => {
    const restored = await decompressInlineHtmlTemplate(await withCompressed(unsignedDoc));
    expect(restored).toEqual(unsignedDoc);
    expect(findInlineHtmlTemplateRenderMethod(restored)?.template).toEqual(template);
  });

  it('round-trips non-ASCII content', async () => {
    const doc = {
      renderMethod: [
        { type: 'INLINE_HTML_TEMPLATE', template: { ...template, html: '<p>Löwe 老虎 🐯</p>' } },
      ],
    };
    expect(await decompressInlineHtmlTemplate(await withCompressed(doc))).toEqual(doc);
  });

  it('does not mutate a signed (verified) input', async () => {
    const signed = {
      ...(await withCompressed(unsignedDoc)),
      proof: { type: 'DataIntegrityProof' },
    };
    const before = JSON.stringify(signed);
    const restored = await decompressInlineHtmlTemplate(signed);
    expect(JSON.stringify(signed)).toBe(before);
    expect(restored.proof).toEqual(signed.proof);
  });

  it('returns the same reference when there is no compressed inline HTML template', async () => {
    expect(await decompressInlineHtmlTemplate(unsignedDoc)).toBe(unsignedDoc);
    const embeddedOnly = { renderMethod: [{ id: 'https://x', type: 'EMBEDDED_RENDERER' }] };
    expect(await decompressInlineHtmlTemplate(embeddedOnly)).toBe(embeddedOnly);
  });

  it('aborts when the template inflates beyond the size cap', async () => {
    const bomb = {
      renderMethod: [
        { type: 'INLINE_HTML_TEMPLATE', template: { ...template, html: '0'.repeat(200_000) } },
      ],
    };
    const compressed = await withCompressed(bomb);
    await expect(
      decompressInlineHtmlTemplate(compressed, { maxDecompressedBytes: 100_000 }),
    ).rejects.toThrow(/size limit/);
  });

  it('rejects a template string that is not valid base64url', async () => {
    const doc = { renderMethod: [{ type: 'INLINE_HTML_TEMPLATE', template: 'not base64url!' }] };
    await expect(decompressInlineHtmlTemplate(doc)).rejects.toThrow(/base64url/);
  });

  it('is not treated as renderable until decompressed', async () => {
    const compressed = await withCompressed(unsignedDoc);
    expect(findInlineHtmlTemplateRenderMethod(compressed)).toBeUndefined();
  });
});
