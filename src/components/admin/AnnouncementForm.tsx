"use client";

import type { FormState } from "@/lib/cms/form";

import { RichPostForm, type PostField, type PostFormInitial } from "./RichPostForm";

/** Creating or editing an announcement (general college notices); see RichPostForm. */
export function AnnouncementForm(props: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: PostFormInitial;
  cancelHref: string;
}) {
  const fields: PostField[] = [
    { kind: "text", name: "title", label: "Title", required: true, maxLength: 300 },
    {
      kind: "date",
      name: "publishedOn",
      label: "Publication date",
      required: true,
      width: "half",
      help: "The date the notice is dated, shown with it.",
    },
    {
      kind: "text",
      name: "slug",
      label: "Web address",
      maxLength: 160,
      placeholder: "made from the title",
      help: "The notice's page is /announcements/<this>. Left empty, it is made from the title.",
    },
  ];
  return (
    <RichPostForm
      {...props}
      fields={fields}
      section={{
        kind: "announcement",
        pageName: "Announcements page",
        publicBase: "/announcements",
        adminBase: "/admin/announcements",
      }}
      pdf={{
        label: "Document (PDF)",
        help: "Optional. The notice as a PDF, for visitors to download. PDF, up to 100 MB.",
      }}
      dateField="publishedOn"
    />
  );
}
