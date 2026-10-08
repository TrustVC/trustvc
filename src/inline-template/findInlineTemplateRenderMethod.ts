export interface InlineTemplateRenderMethod {
  type: 'INLINE_HTML_TEMPLATE';
  template: {
    templateName: string;
    html: string;
    css: string;
  };
}

const isInlineTemplateRenderMethod = (method: unknown): method is InlineTemplateRenderMethod =>
  !!method &&
  typeof method === 'object' &&
  (method as { type?: unknown }).type === 'INLINE_HTML_TEMPLATE' &&
  // Object form only: a string `template` is the gzipped form, which must go through
  // `decompressInlineTemplate` first -- never rendered as-is.
  !!(method as { template?: unknown }).template &&
  typeof (method as { template?: unknown }).template === 'object';

/**
 * Finds an `INLINE_HTML_TEMPLATE` renderMethod entry among a document's `renderMethod` array (or
 * single object, for documents that haven't adopted the array form). A document can carry
 * this alongside URL-based or data:-URI renderMethod entries -- this only ever looks for
 * this one type, ignoring the rest. A still-compressed entry is not returned; decompress the
 * document with `decompressInlineTemplate` first.
 * @param {unknown} document - The credential / document to inspect.
 * @returns {InlineTemplateRenderMethod | undefined} The first `INLINE_HTML_TEMPLATE` entry, if any.
 */
export function findInlineTemplateRenderMethod(
  document: unknown,
): InlineTemplateRenderMethod | undefined {
  const renderMethod = (document as { renderMethod?: unknown })?.renderMethod;
  const methods = [renderMethod].flat().filter(Boolean);
  return methods.find(isInlineTemplateRenderMethod);
}
