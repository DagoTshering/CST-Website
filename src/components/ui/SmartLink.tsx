import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type SmartLinkProps = Omit<ComponentPropsWithoutRef<"a">, "href"> & { href: string };

const isExternal = (href: string) => /^https?:\/\//.test(href);
const isProtocol = (href: string) => /^(mailto|tel):/.test(href);

/**
 * Internal paths and in-page anchors go through next/link; other websites open in a new tab;
 * mailto: and tel: links stay plain anchors. Internal links are not prefetched, because most
 * of them point at pages that do not exist yet (see src/content/todo-links.md).
 */
export function SmartLink({ href, children, ...props }: SmartLinkProps) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
        {children}
      </a>
    );
  }
  if (isProtocol(href)) {
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
