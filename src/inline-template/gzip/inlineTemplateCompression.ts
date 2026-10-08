import type { InlineTemplateRenderMethod } from '../findInlineTemplateRenderMethod';
import {
  fromBase64Url,
  gunzip,
  gzip,
  INLINE_TEMPLATE_MAX_DECOMPRESSED_BYTES,
  toBase64Url,
} from './gzip';

/**
 * An `INLINE_HTML_TEMPLATE` entry whose `template` has been compressed: the string is
 * `base64url(gzip(JSON.stringify({ templateName, html, css })))`. Concealment for casual
 * inspection and a smaller credential -- not confidentiality (anyone can gunzip it).
 *
 * The string form signs under the same JSON-LD context as the object form (a string value is
 * just a literal for the `template` term), so no context change is needed.
 */
export interface CompressedInlineTemplateRenderMethod {
  type: 'INLINE_HTML_TEMPLATE';
  template: string;
}

type Template = InlineTemplateRenderMethod['template'];

const isInlineTemplateEntry = (
  method: unknown,
): method is { type: 'INLINE_HTML_TEMPLATE'; template: unknown } =>
  !!method &&
  typeof method === 'object' &&
  (method as { type?: unknown }).type === 'INLINE_HTML_TEMPLATE';

const isPlainEntry = (method: unknown): method is InlineTemplateRenderMethod =>
  isInlineTemplateEntry(method) && !!method.template && typeof method.template === 'object';

const isCompressedEntry = (method: unknown): method is CompressedInlineTemplateRenderMethod =>
  isInlineTemplateEntry(method) && typeof method.template === 'string';

const renderMethodsOf = (document: unknown): unknown[] =>
  [(document as { renderMethod?: unknown })?.renderMethod].flat().filter(Boolean);

/**
 * Returns a copy of `document` with each `renderMethod` entry passed through `map`, keeping the
 * array-vs-single-object form the document used.
 * @template T
 * @param {T} document - Document whose renderMethod is rewritten.
 * @param {Function} map - Async transform applied to every entry.
 * @returns {Promise<T>} The shallow copy.
 */
const mapRenderMethods = async <T>(
  document: T,
  map: (method: unknown) => Promise<unknown>,
): Promise<T> => {
  const renderMethod = (document as { renderMethod?: unknown }).renderMethod;
  const mapped = Array.isArray(renderMethod)
    ? await Promise.all(renderMethod.map(map))
    : await map(renderMethod);
  return { ...document, renderMethod: mapped };
};

const assertTemplate = (value: unknown, label = 'Decompressed inline template'): Template => {
  const t = value as Partial<Template> | null;
  if (
    !t ||
    typeof t !== 'object' ||
    typeof t.templateName !== 'string' ||
    typeof t.html !== 'string' ||
    typeof t.css !== 'string'
  ) {
    throw new Error(`${label} must be an object with string templateName, html and css`);
  }
  return { templateName: t.templateName, html: t.html, css: t.css };
};

/**
 * Compresses a template's HTML + CSS into the string an `INLINE_HTML_TEMPLATE` renderMethod entry
 * carries: `base64url(gzip(JSON.stringify({ templateName, html, css })))`. Pass the result to
 * `DocumentBuilder.inlineTemplate()`.
 * @param {object} template - The template to compress.
 * @param {string} template.templateName - Name of the template, e.g. 'BILL_OF_LADING'.
 * @param {string} template.html - Template markup, using `data-field` / `data-field-src` / `data-repeat` bindings.
 * @param {string} template.css - Styles for the markup (scoped to the template's Shadow DOM when rendered).
 * @returns {Promise<string>} The compressed template string.
 */
export async function compressTemplate(template: Template): Promise<string> {
  const json = JSON.stringify(assertTemplate(template, 'Inline template'));
  return toBase64Url(await gzip(new TextEncoder().encode(json)));
}

/**
 * True if the document carries an `INLINE_HTML_TEMPLATE` entry whose template is still compressed.
 * @param {unknown} document - The credential / document to inspect.
 * @returns {boolean} Whether `decompressInlineTemplate` would change anything.
 */
export function isCompressedInlineTemplate(document: unknown): boolean {
  return renderMethodsOf(document).some(isCompressedEntry);
}

/**
 * Gzips the template of every plain `INLINE_HTML_TEMPLATE` renderMethod entry. Call on the UNSIGNED
 * document, before signing, so the proof covers the compressed string.
 *
 * A document with no plain inline template (no renderMethod, other types only, or already
 * compressed) is returned as-is -- the same reference, untouched.
 * @template T
 * @param {T} document - The unsigned credential.
 * @returns {Promise<T>} A copy with compressed template(s), or `document` itself if there was nothing to compress.
 * @throws If `document` already has a `proof` -- compressing it would invalidate the signature.
 */
export async function compressInlineTemplate<T>(document: T): Promise<T> {
  if (!renderMethodsOf(document).some(isPlainEntry)) return document;
  if ((document as { proof?: unknown }).proof) {
    throw new Error(
      'compressInlineTemplate must be called before signing: the document already has a proof',
    );
  }
  return mapRenderMethods(document, async (method) => {
    if (!isPlainEntry(method)) return method;
    const template = await compressTemplate(method.template);
    return { ...method, template } satisfies CompressedInlineTemplateRenderMethod;
  });
}

/**
 * Restores the template object of every compressed `INLINE_HTML_TEMPLATE` renderMethod entry, so it
 * can be passed to `renderInlineTemplate`. Call AFTER verification, on the verified document:
 * the proof covers the compressed form, so this returns a copy and never mutates its input.
 *
 * A document with no compressed inline template is returned as-is -- the same reference.
 * @template T
 * @param {T} document - The (verified) credential.
 * @param {object} [options] - Options.
 * @param {number} [options.maxDecompressedBytes] - Abort if a template inflates beyond this (default 4 MB).
 * @returns {Promise<T>} A copy with decompressed template(s), or `document` itself if there was nothing to decompress.
 * @throws If a template is not valid base64url/gzip, exceeds the size cap, or doesn't decode to a template object.
 */
export async function decompressInlineTemplate<T>(
  document: T,
  options: { maxDecompressedBytes?: number } = {},
): Promise<T> {
  if (!isCompressedInlineTemplate(document)) return document;
  const maxBytes = options.maxDecompressedBytes ?? INLINE_TEMPLATE_MAX_DECOMPRESSED_BYTES;
  return mapRenderMethods(document, async (method) => {
    if (!isCompressedEntry(method)) return method;
    const bytes = await gunzip(fromBase64Url(method.template), maxBytes);
    const template = assertTemplate(JSON.parse(new TextDecoder().decode(bytes)));
    return { ...method, template } satisfies InlineTemplateRenderMethod;
  });
}
