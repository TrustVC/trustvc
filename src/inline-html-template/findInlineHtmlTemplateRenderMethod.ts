export interface InlineHtmlTemplateRenderMethod {
  type: 'INLINE_HTML_TEMPLATE';
  template: {
    templateName: string;
    html: string;
    css: string;
  };
}

const isInlineHtmlTemplateRenderMethod = (
  method: unknown,
): method is InlineHtmlTemplateRenderMethod => {
  if (!method || typeof method !== 'object') return false;
  if ((method as { type?: unknown }).type !== 'INLINE_HTML_TEMPLATE') return false;
  // Object form only: a string `template` is the gzipped form, which must go through
  // `decompressInlineHtmlTemplate` first -- never rendered as-is.
  const template = (method as { template?: unknown }).template;
  if (!template || typeof template !== 'object') return false;
  // Malformed entries fail the guard so rendering reports "nothing to render" instead of
  // passing undefined html/css on to buildInlineHtmlTemplateSrcdoc.
  const { templateName, html, css } = template as Record<string, unknown>;
  return typeof templateName === 'string' && typeof html === 'string' && typeof css === 'string';
};

/**
 * Finds an `INLINE_HTML_TEMPLATE` renderMethod entry among a document's `renderMethod` array (or
 * single object, for documents that haven't adopted the array form). A document can carry
 * this alongside URL-based or data:-URI renderMethod entries -- this only ever looks for
 * this one type, ignoring the rest. A still-compressed entry is not returned; decompress the
 * document with `decompressInlineHtmlTemplate` first.
 * @param {unknown} document - The credential / document to inspect.
 * @returns {InlineHtmlTemplateRenderMethod | undefined} The first `INLINE_HTML_TEMPLATE` entry, if any.
 */
export function findInlineHtmlTemplateRenderMethod(
  document: unknown,
): InlineHtmlTemplateRenderMethod | undefined {
  const renderMethod = (document as { renderMethod?: unknown })?.renderMethod;
  const methods = [renderMethod].flat().filter(Boolean);
  return methods.find(isInlineHtmlTemplateRenderMethod);
}
