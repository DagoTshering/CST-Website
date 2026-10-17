import type { Metadata } from "next";
import type { ReactNode } from "react";

import { site } from "@/content/site";

export const metadata: Metadata = {
  title: { default: "Administration", template: `%s | ${site.shortName} Admin` },
  robots: { index: false, follow: false },
};

/** Everything under /admin: the login page and the panel. None of the public site's chrome. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="flex-1 bg-admin-bg text-admin-navy">{children}</div>;
}
