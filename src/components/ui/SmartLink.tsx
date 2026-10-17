import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type SmartLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { href: string };

const isExternal = (href: string) => /^https?:\/\//.test(href);
const isProtocol = (href: string) => /^(mailto|tel):/.test(href);
/** Uploaded files (src/app/media) are documents, not pages to navigate to client-side. */
const isFile = (href: string) => href.startsWith("/media/");

/**
 * Internal paths and in-page anchors go through next/link; other websites open in a new tab
 * (and say so to screen readers); mailto: and tel: links and uploaded files stay plain anchors. Internal links
 * are not prefetched, because most of them point at pages that do not exist yet (see
 * src/content/todo-links.md).
 */
export function SmartLink({ href, children, ...props }: SmartLinkProps) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
        {/* an aria-label replaces the content, so the hint is only added when there is none */}
        {!props["aria-label"] && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  }
  if (isProtocol(href) || isFile(href)) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={false} {...props}>
      {children}
    </Link>
  );
}
