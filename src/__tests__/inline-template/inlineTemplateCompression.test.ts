import { describe, expect, it } from 'vitest';
import {
  compressInlineTemplate,
  compressTemplate,
  decompressInlineTemplate,
  findInlineTemplateRenderMethod,
  isCompressedInlineTemplate,
} from '../../inline-template';

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

describe('compressTemplate', () => {
  it('compresses HTML + CSS into the string an INLINE_HTML_TEMPLATE entry carries', async () => {
    const compressed = await compressTemplate(template);
    expect(compressed).toMatch(/^H4sI[A-Za-z0-9_-]+$/);

    const doc = { renderMethod: [{ type: 'INLINE_HTML_TEMPLATE', template: compressed }] };
    const restored = await decompressInlineTemplate(doc);
    expect(findInlineTemplateRenderMethod(restored)?.template).toEqual(template);
  });

  it('rejects a template missing html, css or templateName', async () => {
    await expect(compressTemplate({ ...template, css: undefined } as never)).rejects.toThrow(
      'Inline template must be an object with string templateName, html and css',
    );
  });
});

describe('compressInlineTemplate', () => {
  it('replaces the inline template object with a base64url gzip string, leaving other entries alone', async () => {
    const compressed = await compressInlineTemplate(unsignedDoc);
    const [embedded, inline] = compressed.renderMethod as [unknown, { template: unknown }];

    expect(embedded).toEqual(unsignedDoc.renderMethod[0]);
    expect(typeof inline.template).toBe('string');
    expect(inline.template).toMatch(/^[A-Za-z0-9_-]+$/);
    expect((inline.template as string).length).toBeLessThan(JSON.stringify(template).length);
    expect(isCompressedInlineTemplate(compressed)).toBe(true);
  });

  it('does not mutate its input', async () => {
    const before = JSON.stringify(unsignedDoc);
    await compressInlineTemplate(unsignedDoc);
    expect(JSON.stringify(unsignedDoc)).toBe(before);
  });

  it('returns the same reference when there is no plain inline template', async () => {
    const noInline = { renderMethod: [{ id: 'https://x', type: 'EMBEDDED_RENDERER' }] };
    const noRenderMethod = { credentialSubject: {} };
    expect(await compressInlineTemplate(noInline)).toBe(noInline);
    expect(await compressInlineTemplate(noRenderMethod)).toBe(noRenderMethod);

    const alreadyCompressed = await compressInlineTemplate(unsignedDoc);
    expect(await compressInlineTemplate(alreadyCompressed)).toBe(alreadyCompressed);
  });

  it('refuses a signed document, since compressing would invalidate the proof', async () => {
    await expect(
      compressInlineTemplate({ ...unsignedDoc, proof: { type: 'DataIntegrityProof' } }),
    ).rejects.toThrow(/before signing/);
  });

  it('keeps the single-object renderMethod form', async () => {
    const single = { renderMethod: { type: 'INLINE_HTML_TEMPLATE', template } };
    const compressed = await compressInlineTemplate(single);
    expect(Array.isArray(compressed.renderMethod)).toBe(false);
    expect(typeof (compressed.renderMethod as { template: unknown }).template).toBe('string');
  });
});

describe('decompressInlineTemplate', () => {
  it('round-trips back to the original document', async () => {
    const restored = await decompressInlineTemplate(await compressInlineTemplate(unsignedDoc));
    expect(restored).toEqual(unsignedDoc);
    expect(findInlineTemplateRenderMethod(restored)?.template).toEqual(template);
  });

  it('round-trips non-ASCII content', async () => {
    const doc = {
      renderMethod: [
        { type: 'INLINE_HTML_TEMPLATE', template: { ...template, html: '<p>Löwe 老虎 🐯</p>' } },
      ],
    };
    expect(await decompressInlineTemplate(await compressInlineTemplate(doc))).toEqual(doc);
  });

  it('does not mutate a signed (verified) input', async () => {
    const signed = {
      ...(await compressInlineTemplate(unsignedDoc)),
      proof: { type: 'DataIntegrityProof' },
    };
    const before = JSON.stringify(signed);
    const restored = await decompressInlineTemplate(signed);
    expect(JSON.stringify(signed)).toBe(before);
    expect(restored.proof).toEqual(signed.proof);
  });

  it('returns the same reference when there is no compressed inline template', async () => {
    expect(await decompressInlineTemplate(unsignedDoc)).toBe(unsignedDoc);
    const embeddedOnly = { renderMethod: [{ id: 'https://x', type: 'EMBEDDED_RENDERER' }] };
    expect(await decompressInlineTemplate(embeddedOnly)).toBe(embeddedOnly);
  });

  it('aborts when the template inflates beyond the size cap', async () => {
    const bomb = {
      renderMethod: [
        { type: 'INLINE_HTML_TEMPLATE', template: { ...template, html: '0'.repeat(200_000) } },
      ],
    };
    const compressed = await compressInlineTemplate(bomb);
    await expect(
      decompressInlineTemplate(compressed, { maxDecompressedBytes: 100_000 }),
    ).rejects.toThrow(/size limit/);
  });

  it('rejects a template string that is not valid base64url', async () => {
    const doc = { renderMethod: [{ type: 'INLINE_HTML_TEMPLATE', template: 'not base64url!' }] };
    await expect(decompressInlineTemplate(doc)).rejects.toThrow(/base64url/);
  });

  it('is not treated as renderable until decompressed', async () => {
    const compressed = await compressInlineTemplate(unsignedDoc);
    expect(findInlineTemplateRenderMethod(compressed)).toBeUndefined();
  });
});
