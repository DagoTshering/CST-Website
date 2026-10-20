import type { Metadata } from "next";
import Link from "next/link";

import { ListNotice } from "@/components/admin/DataTable";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ResourceForm } from "@/components/admin/form/ResourceForm";
import { formatDateTime, Notice, PageHeader } from "@/components/admin/ui";
import { aboutFields, getAboutForm } from "@/lib/cms/resources/about";

import { deleteAbout, saveAbout } from "./actions";

export const metadata: Metadata = { title: "Homepage About" };

export default async function Page({ searchParams }: PageProps<"/admin/about">) {
  const [{ notice }, current] = await Promise.all([searchParams, getAboutForm()]);

  return (
    <>
      <PageHeader
        title="Homepage About"
        description={
          <>
            The About CST section on the homepage: title, introduction and photograph. It appears on
            the website only while it is published. The full About page (/about) is edited under{" "}
            <Link
              href="/admin/about-page"
              className="font-medium text-admin-accent-strong underline underline-offset-2"
            >
              About Page
            </Link>
            .
          </>
        }
        actions={
          current && (
            <DeleteButton action={deleteAbout} itemName={current.values.heading} kind="section" />
          )
        }
      />
      <ListNotice notice={notice} kind="About CST section" />
      {!current && (
        <Notice tone="info" className="mb-5">
          The About CST section has not been written yet, so the homepage does not show it. Fill in
          the form below and publish it.
        </Notice>
      )}
      <ResourceForm
        action={saveAbout}
        fields={aboutFields}
        initial={current ?? { values: { status: "draft" }, media: {} }}
        submitLabel={current ? "Save changes" : "Create section"}
      />
      {current && (
        <p className="mt-3 text-xs text-admin-muted">
          Last updated {formatDateTime(current.updatedAt)}
        </p>
      )}
    </>
  );
}
