/**
 * Rich text as the Vacancies editor (Tiptap) stores it: a JSON document. Anything submitted is
 * passed through `sanitizeDocument` on the server before it is saved, which keeps only the node
 * types, marks and attributes the editor offers, and only links that are safe to follow. The
 * public page renders the result as React elements (components/ui/RichText.tsx), never as HTML,
 * so nothing pasted into the editor can run on the site.
 *
 * Plain functions with no server-only imports: the editor's preview uses them in the browser.
 */

export type RichMark = { type: string; attrs?: Record<string, unknown> };

export type RichNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: RichNode[];
  marks?: RichMark[];
  text?: string;
};

/** An empty document (one empty paragraph), as the editor starts. */
export const EMPTY_DOCUMENT: RichNode = { type: "doc", content: [{ type: "paragraph" }] };

const ALIGNMENTS = ["left", "center", "right", "justify"];

/** The block and inline nodes kept, and the attributes each may carry. */
const NODES: Record<string, (attrs: Record<string, unknown>) => Record<string, unknown> | null> = {
  doc: () => null,
  paragraph: align,
  heading: (a) => ({
    level: [2, 3, 4].includes(Number(a.level)) ? Number(a.level) : 2,
    ...align(a),
  }),
  text: () => null,
  hardBreak: () => null,
  horizontalRule: () => null,
  blockquote: () => null,
  bulletList: () => null,
  orderedList: (a) => {
    const start = Number(a.start);
    return Number.isInteger(start) && start > 1 && start < 100000 ? { start } : null;
  },
  listItem: () => null,
  table: () => null,
  tableRow: () => null,
  tableHeader: cellAttrs,
  tableCell: cellAttrs,
};

const MARKS = ["bold", "italic", "underline", "strike", "link"];

function align(a: Record<string, unknown>) {
  return typeof a.textAlign === "string" &&
    ALIGNMENTS.includes(a.textAlign) &&
    a.textAlign !== "left"
    ? { textAlign: a.textAlign }
    : null;
}

function cellAttrs(a: Record<string, unknown>) {
  const span = (v: unknown) =>
    Number.isInteger(v) && (v as number) > 1 && (v as number) <= 50 ? (v as number) : undefined;
  const attrs: Record<string, unknown> = {};
  if (span(a.colspan)) attrs.colspan = span(a.colspan);
  if (span(a.rowspan)) attrs.rowspan = span(a.rowspan);
  return Object.keys(attrs).length > 0 ? attrs : null;
}

/**
 * A link target that is safe to follow: a web address (http/https), an email or phone link, a
 * page of this site ("/downloads") or a section ("#interview"). Anything else (javascript:,
 * data:, vbscript:, "//host") gives null.
 */
export function safeHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (href.length === 0 || href.length > 2000) return null;
  if (/^(\/(?!\/)|#)/.test(href)) return /[\s<>"]/.test(href) ? null : href;
  try {
    const url = new URL(href);
    return ["http:", "https:", "mailto:", "tel:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

const MAX_DEPTH = 40;
const MAX_NODES = 20000;
const MAX_TEXT = 200_000;

/**
 * The document with everything the editor does not offer removed: unknown nodes are dropped
 * (their text kept, as a paragraph where needed), unknown marks and attributes are dropped, and
 * a link whose target is not safe loses its link (its text stays). Returns null for something
 * that is not a document, or one too large or deeply nested.
 */
export function sanitizeDocument(input: unknown): RichNode | null {
  let nodes = 0;
  let textLength = 0;

  function marksOf(value: unknown): RichMark[] | undefined {
    if (!Array.isArray(value)) return undefined;
    const marks: RichMark[] = [];
    for (const m of value) {
      if (!m || typeof m !== "object" || !MARKS.includes((m as RichMark).type)) continue;
      const type = (m as RichMark).type;
      if (type === "link") {
        const href = safeHref((m as RichMark).attrs?.href);
        if (href) marks.push({ type, attrs: { href } });
      } else if (!marks.some((x) => x.type === type)) {
        marks.push({ type });
      }
    }
    return marks.length > 0 ? marks : undefined;
  }

  function clean(value: unknown, depth: number): RichNode[] {
    if (!value || typeof value !== "object" || depth > MAX_DEPTH) return [];
    if (++nodes > MAX_NODES) throw new RangeError("too many nodes");
    const node = value as RichNode;
    const children = Array.isArray(node.content)
      ? node.content.flatMap((child) => clean(child, depth + 1))
      : [];

    if (node.type === "text") {
      if (typeof node.text !== "string" || node.text.length === 0) return [];
      textLength += node.text.length;
      if (textLength > MAX_TEXT) throw new RangeError("too much text");
      const marks = marksOf(node.marks);
      return [{ type: "text", text: node.text, ...(marks ? { marks } : {}) }];
    }

    const allowed = NODES[node.type];
    // an unknown node: keep what it contains
    if (!allowed || node.type === "doc") return children;

    const attrs = allowed(node.attrs && typeof node.attrs === "object" ? node.attrs : {});
    const out: RichNode = { type: node.type };
    if (attrs) out.attrs = attrs;
    if (children.length > 0) out.content = children;
    return [out];
  }

  if (!input || typeof input !== "object" || (input as RichNode).type !== "doc") return null;
  try {
    const content = Array.isArray((input as RichNode).content)
      ? (input as RichNode).content!.flatMap((child) => clean(child, 1))
      : [];
    // text left at the top level by a dropped node goes into a paragraph
    const blocks = content.map((n) =>
      n.type === "text" || n.type === "hardBreak" ? { type: "paragraph", content: [n] } : n,
    );
    return { type: "doc", content: blocks.length > 0 ? blocks : [{ type: "paragraph" }] };
  } catch {
    return null;
  }
}

/** The document's text, blocks separated by spaces (for the listing's excerpt and searching). */
export function plainText(doc: RichNode): string {
  const parts: string[] = [];
  const walk = (node: RichNode) => {
    if (node.type === "text" && node.text) parts.push(node.text);
    else if (node.type === "hardBreak") parts.push(" ");
    node.content?.forEach(walk);
    if (node.type !== "text" && node.type !== "doc") parts.push(" ");
  };
  walk(doc);
  return parts.join("").replace(/\s+/g, " ").trim();
}

/** The first `max` characters of the text, cut at a word. */
export function excerptOf(doc: RichNode, max = 240): string {
  const text = plainText(doc);
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40)).trimEnd()}…`;
}
