import { ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { categories } from "@/components/admin/categories";
import { PageHeader } from "@/components/admin/ui";
import { getContentCounts, type CategoryKey } from "@/lib/cms/dashboard";

export const metadata: Metadata = { title: "Website Content" };

const ORDER: CategoryKey[] = [
  "about",
  "facilities",
  "programmes",
  "events",
  "leadership",
  "announcements",
  "downloads",
];

export default async function ContentPage() {
  const counts = await getContentCounts();

  return (
    <>
      <PageHeader
        title="Website Content"
        description="Everything on the website that can be edited here: the homepage sections and the Downloads page. Other pages are not yet managed in the admin panel."
      />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ORDER.map((key) => {
          const { label, href, icon: Icon, description, unit } = categories[key];
          const { total, published } = counts[key];
          return (
            <li key={key}>
              <Link
                href={href}
                className="group flex h-full gap-4 rounded-lg border border-admin-line bg-white p-5 shadow-xs transition-[border-color,box-shadow] hover:border-admin-accent/60 hover:shadow-sm"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-accent-soft text-admin-accent-strong">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-admin-navy">{label}</span>
                    <ArrowRight
                      className="size-4 shrink-0 text-admin-muted transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="mt-1 block text-sm text-admin-muted">{description}</span>
                  <span className="mt-3 block text-xs font-medium text-admin-navy">
                    {key === "about"
                      ? total === 0
                        ? "Not written yet"
                        : published > 0
                          ? "Published"
                          : "Draft"
                      : `${total} ${unit} · ${published} published`}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <div className="flex h-full gap-4 rounded-lg border border-dashed border-admin-line p-5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-admin-bg text-admin-muted">
              <Clock className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="flex items-center gap-2 font-semibold text-admin-navy">
                Media Library
                <span className="rounded-full bg-admin-bg px-2 py-0.5 text-[0.6875rem] font-semibold text-admin-muted ring-1 ring-admin-line">
                  Coming soon
                </span>
              </span>
              <span className="mt-1 block text-sm text-admin-muted">
                Browsing and reusing uploaded files. For now, upload images and documents from each
                content form.
              </span>
            </span>
          </div>
        </li>
      </ul>
    </>
  );
}
