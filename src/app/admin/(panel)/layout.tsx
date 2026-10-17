import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Suspense } from "react";

import { AccountMenu } from "@/components/admin/AccountMenu";
import { AdminFrame } from "@/components/admin/AdminFrame";
import { getAdminIdentity } from "@/lib/auth/dal";

/** The signed-in administrator in the top bar. Reads the session, so it streams in. */
async function Account() {
  const admin = await getAdminIdentity();
  if (!admin) redirect("/admin/login");
  return <AccountMenu admin={admin} />;
}

/**
 * The protected admin panel. Each page and Server Action checks the session itself (layouts
 * do not re-run on every navigation, so they are not where protection lives).
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <AdminFrame
      account={
        <Suspense fallback={<span className="size-8 animate-pulse rounded-full bg-admin-line" />}>
          <Account />
        </Suspense>
      }
    >
      {children}
    </AdminFrame>
  );
}
