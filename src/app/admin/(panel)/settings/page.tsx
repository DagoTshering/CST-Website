import type { Metadata } from "next";

import { Card, CardHeader, Notice, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";

import { PasswordForm } from "./PasswordForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const admin = await requireAdmin();

  return (
    <>
      <PageHeader title="Settings" description="Your administrator account." />

      {admin.usingInitialPassword && (
        <Notice tone="warning" title="You are using the initial password" className="mb-6">
          It was set when this account was created and is known to whoever set up the website.
          Change it now, and always before the website goes into production.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card aria-labelledby="account-title">
          <CardHeader title="Account" />
          <h2 id="account-title" className="sr-only">
            Account
          </h2>
          <dl className="space-y-4 p-5 text-sm">
            <div>
              <dt className="text-admin-muted">Email</dt>
              <dd className="mt-0.5 font-medium break-all text-admin-navy">{admin.email}</dd>
            </div>
            <div>
              <dt className="text-admin-muted">Role</dt>
              <dd className="mt-0.5 font-medium text-admin-navy">Administrator</dd>
            </div>
          </dl>
        </Card>

        <Card className="lg:col-span-2" aria-labelledby="password-title">
          <CardHeader title="Change password" />
          <h2 id="password-title" className="sr-only">
            Change password
          </h2>
          <PasswordForm />
        </Card>
      </div>
    </>
  );
}
