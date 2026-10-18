import {
  ArrowRight,
  Building2,
  CalendarPlus,
  FileDown,
  History,
  Landmark,
  Megaphone,
  PlusCircle,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { categories, editHref } from "@/components/admin/categories";
import {
  Card,
  CardHeader,
  EmptyState,
  formatDateTime,
  Notice,
  StatusBadge,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/dal";
import { getContentCounts, getRecentlyUpdated, type CategoryKey } from "@/lib/cms/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

/** The categories summarised in the cards, in this order. */
const SUMMARY: CategoryKey[] = [
  "programmes",
  "facilities",
  "events",
  "announcements",
  "staff",
  "downloads",
];

const quickActions = [
  { href: "/admin/programmes/new", label: "Add an academic programme", icon: PlusCircle },
  { href: "/admin/events/new", label: "Create an event", icon: CalendarPlus },
  { href: "/admin/announcements/new", label: "Publish an announcement", icon: Megaphone },
  { href: "/admin/facilities", label: "Manage facilities", icon: Building2 },
  { href: "/admin/about", label: "Edit About CST", icon: Landmark },
  { href: "/admin/downloads/new", label: "Add a download", icon: FileDown },
];

/** The welcome shows at once; the counts and activity stream in behind it. */
export default function DashboardPage() {
  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-medium text-admin-accent-strong">Overview</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-admin-navy sm:text-[1.75rem]">
          Welcome to the CST Website Administration Panel
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-admin-muted">
          Manage the content shown on the public website. Drafts stay private until you publish
          them.
        </p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="h-36 animate-pulse rounded-lg border border-admin-line bg-white"
          />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="h-72 animate-pulse rounded-lg border border-admin-line bg-white lg:col-span-2" />
        <div className="h-72 animate-pulse rounded-lg border border-admin-line bg-white" />
      </div>
    </div>
  );
}

async function DashboardContent() {
  const admin = await requireAdmin();
  const [counts, recent] = await Promise.all([getContentCounts(), getRecentlyUpdated()]);

  return (
    <>
      {admin.usingInitialPassword && (
        <Notice tone="warning" title="Change the initial password" className="mb-6">
          This account still uses the password it was created with. Change it before the website
          goes into production.{" "}
          <Link href="/admin/settings" className="font-semibold underline underline-offset-2">
            Change password
          </Link>
        </Notice>
      )}

      <section aria-labelledby="summary-title">
        <h2 id="summary-title" className="sr-only">
          Content summary
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {SUMMARY.map((key) => {
            const { label, href, icon: Icon } = categories[key];
            const { total, published } = counts[key];
            return (
              <li key={key}>
                <Link
                  href={href}
                  className="group flex h-full flex-col rounded-lg border border-admin-line bg-white p-5 shadow-xs transition-[border-color,box-shadow] hover:border-admin-accent/60 hover:shadow-sm"
                >
                  <span className="flex items-center justify-between">
                    <span className="flex size-9 items-center justify-center rounded-md bg-admin-accent-soft text-admin-accent-strong">
                      <Icon className="size-[18px]" aria-hidden="true" />
                    </span>
                    <ArrowRight
                      className="size-4 text-admin-muted opacity-0 transition-opacity group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-4 text-sm font-medium text-admin-muted">{label}</span>
                  <span className="mt-1 font-display text-3xl font-semibold tracking-tight text-admin-navy tabular-nums">
                    {total}
                  </span>
                  <span className="mt-1 text-xs text-admin-muted">
                    {published} published · {total - published} draft
                    {total - published === 1 ? "" : "s"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" aria-labelledby="recent-title">
          <CardHeader title="Recently updated" />
          <h2 id="recent-title" className="sr-only">
            Recently updated content
          </h2>
          {recent.length === 0 ? (
            <EmptyState icon={History} title="Nothing here yet">
              Content you create or edit will be listed here, most recent first.
            </EmptyState>
          ) : (
            <ul className="divide-y divide-admin-line">
              {recent.map((item) => (
                <li key={`${item.category}-${item.id}`}>
                  <Link
                    href={editHref(item.category, item.id)}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-admin-bg/60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-admin-navy">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-admin-muted">
                        {categories[item.category].label} · {formatDateTime(item.updatedAt)}
                      </span>
                    </span>
                    <StatusBadge status={item.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card aria-labelledby="actions-title">
          <CardHeader title="Quick actions" />
          <h2 id="actions-title" className="sr-only">
            Quick actions
          </h2>
          <ul className="p-2">
            {quickActions.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-admin-navy transition-colors hover:bg-admin-accent-soft"
                >
                  <Icon className="size-[18px] text-admin-accent-strong" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <ArrowRight
                    className="size-4 text-admin-muted transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
