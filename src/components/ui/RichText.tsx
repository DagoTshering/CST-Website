import type { CSSProperties, ReactNode } from "react";

import { safeHref, type RichNode } from "@/lib/rich-text";
import { cx } from "@/lib/cx";

import { SmartLink } from "./SmartLink";
import s from "./RichText.module.css";

/**
 * A rich-text document (lib/rich-text.ts) as React elements: no HTML is ever injected, so text is
 * always escaped, and only the node types the editor offers are drawn. Links are checked again
 * here. Tables sit in a box that scrolls sideways when they are wider than the screen. Works on
 * the server (the public pages) and in the browser (the editor's preview).
 */
export function RichText({ doc, className }: { doc: RichNode; className?: string }) {
  return <div className={cx(s.rich, className)}>{children(doc)}</div>;
}

function children(node: RichNode): ReactNode {
  return node.content?.map((child, i) => render(child, i));
}

function alignStyle(node: RichNode): CSSProperties | undefined {
  const align = node.attrs?.textAlign;
  return align === "center" || align === "right" || align === "justify"
    ? { textAlign: align }
    : undefined;
}

function text(node: RichNode, key: number): ReactNode {
  let out: ReactNode = node.text;
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") out = <strong>{out}</strong>;
    else if (mark.type === "italic") out = <em>{out}</em>;
    else if (mark.type === "underline") out = <u>{out}</u>;
    else if (mark.type === "strike") out = <s>{out}</s>;
    else if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      if (href) out = <SmartLink href={href}>{out}</SmartLink>;
    }
  }
  return <span key={key}>{out}</span>;
}

function cell(node: RichNode, key: number) {
  const span = (v: unknown) => (typeof v === "number" && v > 1 ? v : undefined);
  // the key is passed on its own: React does not take it from a spread object
  const spans = {
    colSpan: span(node.attrs?.colspan),
    rowSpan: span(node.attrs?.rowspan),
  };
  return node.type === "tableHeader" ? (
    <th key={key} scope="col" {...spans}>
      {children(node)}
    </th>
  ) : (
    <td key={key} {...spans}>
      {children(node)}
    </td>
  );
}

function render(node: RichNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return text(node, key);
    case "paragraph":
      return (
        <p key={key} style={alignStyle(node)}>
          {children(node)}
        </p>
      );
    case "heading": {
      const level = node.attrs?.level;
      const Tag = level === 3 ? "h3" : level === 4 ? "h4" : "h2";
      return (
        <Tag key={key} style={alignStyle(node)}>
          {children(node)}
        </Tag>
      );
    }
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    case "blockquote":
      return <blockquote key={key}>{children(node)}</blockquote>;
    case "bulletList":
      return <ul key={key}>{children(node)}</ul>;
    case "orderedList":
      return (
        <ol key={key} start={typeof node.attrs?.start === "number" ? node.attrs.start : undefined}>
          {children(node)}
        </ol>
      );
    case "listItem":
      return <li key={key}>{children(node)}</li>;
    case "table":
      return (
        // a focusable region, so a keyboard can scroll a wide table
        <div key={key} className={s.tableScroll} role="region" aria-label="Table" tabIndex={0}>
          <table>
            <tbody>{node.content?.map((row, i) => render(row, i))}</tbody>
          </table>
        </div>
      );
    case "tableRow":
      return <tr key={key}>{node.content?.map((c, i) => cell(c, i))}</tr>;
    default:
      return null;
  }
}
