import type { CompressedInlineTemplateRenderMethod } from './gzip';
import type { InlineTemplateRenderMethod } from './findInlineTemplateRenderMethod';

/**
 * A URL-based renderMethod entry, e.g. `EMBEDDED_RENDERER` pointing at generic-templates and
 * rendered by the decentralised renderer.
 */
export interface RendererRenderMethod {
  id: string;
  type: string;
  templateName?: string;
}

/**
 * The renderMethod entries a viewer can use, in priority order: render `inlineTemplate` first;
 * if it's absent or fails to render, fall back to `renderer`.
 */
export interface RenderMethods {
  /** The `INLINE_HTML_TEMPLATE` entry, compressed or not -- decompress it with `decompressInlineTemplate`. */
  inlineTemplate?: InlineTemplateRenderMethod | CompressedInlineTemplateRenderMethod;
  /** The first entry with a renderer URL (`id`) -- the fallback. */
  renderer?: RendererRenderMethod;
}

type Entry = Record<string, unknown>;

const isEntry = (method: unknown): method is Entry => !!method && typeof method === 'object';

const isInlineTemplate = (
  method: Entry,
): method is Entry & (InlineTemplateRenderMethod | CompressedInlineTemplateRenderMethod) =>
  method.type === 'INLINE_HTML_TEMPLATE' &&
  (typeof method.template === 'string' ||
    (!!method.template && typeof method.template === 'object'));

const isRenderer = (method: Entry): method is Entry & RendererRenderMethod =>
  method.type !== 'INLINE_HTML_TEMPLATE' &&
  typeof method.id === 'string' &&
  !!method.id &&
  typeof method.type === 'string';

/**
 * Reads a document's `renderMethod` (array, or a single object for documents that predate the
 * array form) and picks out what a viewer needs, regardless of the order the entries appear in.
 * Documents are untrusted input, so malformed entries are skipped rather than thrown on.
 * @param {unknown} document - The credential / document to inspect.
 * @returns {RenderMethods} The inline template and the renderer fallback, each if present.
 */
export function getRenderMethods(document: unknown): RenderMethods {
  const renderMethod = (document as { renderMethod?: unknown } | null)?.renderMethod;
  const methods = [renderMethod].flat().filter(isEntry);
  return {
    inlineTemplate: methods.find(isInlineTemplate),
    renderer: methods.find(isRenderer),
  };
}
