"use client";

import type { Editor } from "@tiptap/react";
import { Eye, FileText, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { RichText } from "@/components/ui/RichText";
import { idleState, type FieldDef, type FormState, type MediaPreview } from "@/lib/cms/form";
import { EMPTY_DOCUMENT, sanitizeDocument, type RichNode } from "@/lib/rich-text";
import { formatVacancyDate } from "@/lib/vacancies";

import { FieldShell, SimpleControl } from "./form/fields";
import { MediaField } from "./form/MediaField";
import { RichTextEditor } from "./form/RichTextEditor";
import { buttonClass, Notice, StatusBadge } from "./ui";

/** The plain fields a post's form can have (the editor and the PDF are always there). */
export type PostField = Exclude<
  FieldDef,
  { kind: "image" } | { kind: "document" } | { kind: "heading" } | { kind: "status" }
>;

/** Where a kind of post lives, for the form's wording and links. */
export type PostSection = {
  /** e.g. "vacancy post". */
  kind: string;
  /** e.g. "Vacancies page". */
  pageName: string;
  /** e.g. "/vacancies": a post's page is <publicBase>/<slug>. */
  publicBase: string;
  /** e.g. "/admin/vacancies": a post's preview page is <adminBase>/<id>/preview. */
  adminBase: string;
};

/** JSON with object keys in a fixed order (the database reorders them), for comparing. */
const canonical = (value: unknown) =>
  JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
      : v,
  );

export type PostFormInitial = {
  /** null for a new post. */
  id: number | null;
  /** Earlier addresses that redirect to it. */
  oldSlugs: string[];
  values: Record<string, string>;
  attachment: MediaPreview | null;
  content: RichNode;
  status: "draft" | "published";
  publishedAt: string | null;
  slug: string | null;
};

/**
 * Creating or editing a post written in the rich-text editor (a vacancy post, an announcement).
 * Its buttons say what happens to it: a draft (or a new post) can be saved as a draft or
 * published; a published post can be updated (its changes go live) or unpublished (back to a
 * draft, off the public page). Preview shows the post as visitors will see it, with the changes
 * not yet saved. The plain fields (`fields`) come first; one named "title" is the post's title.
 */
export function RichPostForm({
  action,
  initial,
  cancelHref,
  fields,
  section,
  pdf,
  categoryLabels,
  dateField,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: PostFormInitial;
  cancelHref: string;
  fields: PostField[];
  section: PostSection;
  pdf: { label: string; help: string };
  /** The category field's values as the preview shows them; free text is shown as it is. */
  categoryLabels?: Record<string, string>;
  /** A date field the preview shows as the post's date; otherwise its first publication. */
  dateField?: string;
}) {
  const [state, formAction, pending] = useActionState(action, idleState);
  const [attachment, setAttachment] = useState(initial.attachment);
  const [uploads, setUploads] = useState(0);
  const [preview, setPreview] = useState<{
    title: string;
    category: string;
    date: string;
    doc: RichNode;
  } | null>(null);
  const editor = useRef<Editor | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const summary = useRef<HTMLDivElement>(null);

  // Next.js keeps the page's state when it is left and shown again, and saving here refreshes
  // `initial`: when the saved post differs from what the form shows (changed elsewhere, or
  // normalised on saving), the fields, the PDF and the editor follow it; the message stays.
  const fingerprint = canonical([
    initial.values,
    initial.content,
    initial.attachment?.id ?? null,
    initial.status,
    initial.publishedAt,
  ]);
  const [shownRecord, setShownRecord] = useState(fingerprint);
  const [recordVersion, setRecordVersion] = useState(0);
  if (shownRecord !== fingerprint) {
    setShownRecord(fingerprint);
    setAttachment(initial.attachment);
    setRecordVersion((v) => v + 1);
  }
  useEffect(() => {
    const current = editor.current;
    if (
      current &&
      !current.isDestroyed &&
      canonical(current.getJSON()) !== canonical(initial.content)
    ) {
      current.commands.setContent(initial.content, { emitUpdate: true });
    }
  }, [fingerprint, initial.content]);

  const values = state.status === "error" ? state.values : initial.values;
  const errors = state.status === "error" ? state.fieldErrors : {};
  const error = (name: string) => errors[name]?.[0];
  // after each submission the plain fields re-mount, showing what was saved (or typed)
  const version = `${state.status === "idle" ? 0 : state.at}:${recordVersion}`;
  const busy = pending || uploads > 0;
  const isPublished = initial.status === "published";

  useEffect(() => {
    if (state.status !== "idle") summary.current?.focus();
  }, [state]);

  function openPreview() {
    const data = new FormData(form.current!);
    setPreview({
      title: String(data.get("title") ?? "").trim() || "Untitled",
      category: String(data.get("category") ?? "").trim(),
      date: dateField ? String(data.get(dateField) ?? "") : "",
      doc:
        (editor.current && !editor.current.isDestroyed
          ? sanitizeDocument(editor.current.getJSON())
          : null) ?? EMPTY_DOCUMENT,
    });
    dialog.current?.showModal();
  }

  return (
    <>
      <form
        ref={form}
        action={formAction}
        className="rounded-lg border border-admin-line bg-white shadow-xs"
      >
        <div className="space-y-6 p-5 sm:p-7">
          {state.status !== "idle" && (
            <Notice
              ref={summary}
              tabIndex={-1}
              tone={state.status === "error" ? "error" : "success"}
              className="focus:outline-none"
            >
              {state.message}
            </Notice>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-admin-bg px-4 py-3 text-sm">
            <span className="font-medium text-admin-navy">Status</span>
            <StatusBadge status={initial.status} />
            <span className="text-admin-muted">
              {isPublished
                ? `On the ${section.pageName}${initial.publishedAt ? ` since ${formatVacancyDate(new Date(initial.publishedAt))}` : ""}.`
                : initial.slug
                  ? `A draft: not on the ${section.pageName}.`
                  : "New: not saved yet."}
            </span>
            {isPublished && initial.slug && (
              <Link
                href={`${section.publicBase}/${initial.slug}`}
                className="font-medium text-admin-accent-strong underline underline-offset-2"
              >
                View on the website
              </Link>
            )}
            {initial.id !== null && (
              <Link
                href={`${section.adminBase}/${initial.id}/preview`}
                className="font-medium text-admin-accent-strong underline underline-offset-2"
              >
                Preview page
              </Link>
            )}
            {initial.oldSlugs.length > 0 && (
              <span className="w-full text-xs text-admin-muted">
                Earlier {initial.oldSlugs.length === 1 ? "address" : "addresses"}, redirecting here:{" "}
                {initial.oldSlugs.map((slug) => `${section.publicBase}/${slug}`).join(", ")}
              </span>
            )}
          </div>

          <div key={version} className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
            {fields.map((field) => (
              <FieldShell
                key={field.name}
                id={`field-${field.name}`}
                label={field.label}
                required={field.required}
                help={field.help}
                error={error(field.name)}
                className={field.width === "half" ? undefined : "sm:col-span-2"}
              >
                <SimpleControl
                  field={field}
                  value={values[field.name] ?? ""}
                  error={error(field.name)}
                />
              </FieldShell>
            ))}
          </div>

          <div>
            <p id="content-label" className="block text-sm font-medium text-admin-navy">
              Content
            </p>
            <p id="content-help" className="mt-1 text-xs leading-relaxed text-admin-muted">
              Paste from Word or a PDF, or write here. Tables keep their rows and columns: use the
              table buttons to add or remove them once the cursor is in a table.
            </p>
            <div className="mt-2">
              <RichTextEditor
                name="content"
                initial={initial.content}
                labelledBy="content-label"
                describedBy={error("content") ? "content-error" : "content-help"}
                invalid={Boolean(error("content"))}
                onChange={(e) => {
                  editor.current = e;
                }}
              />
            </div>
            {error("content") && (
              <p id="content-error" className="mt-1.5 text-sm text-admin-danger">
                {error("content")}
              </p>
            )}
          </div>

          <MediaField
            field={{ kind: "document", name: "attachmentId", label: pdf.label, help: pdf.help }}
            preview={attachment}
            onChange={setAttachment}
            onUploading={(on) => setUploads((n) => n + (on ? 1 : -1))}
            altValue=""
            error={error("attachmentId")}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-admin-line bg-admin-bg/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
          <Link href={cancelHref} className={buttonClass("ghost")}>
            Cancel
          </Link>
          <button type="button" onClick={openPreview} className={buttonClass("secondary")}>
            <Eye aria-hidden="true" />
            Preview
          </button>
          {isPublished ? (
            <>
              <button
                type="submit"
                name="intent"
                value="unpublish"
                disabled={busy}
                className={buttonClass("secondary")}
              >
                Unpublish
              </button>
              <button
                type="submit"
                name="intent"
                value="update"
                disabled={busy}
                className={buttonClass("primary")}
              >
                {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
                {uploads > 0 ? "Waiting for upload…" : "Update"}
              </button>
            </>
          ) : (
            <>
              <button
                type="submit"
                name="intent"
                value="draft"
                disabled={busy}
                className={buttonClass("secondary")}
              >
                Save draft
              </button>
              <button
                type="submit"
                name="intent"
                value="publish"
                disabled={busy}
                className={buttonClass("primary")}
              >
                {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
                {uploads > 0 ? "Waiting for upload…" : "Publish"}
              </button>
            </>
          )}
        </div>
      </form>

      <dialog
        ref={dialog}
        aria-labelledby="preview-title"
        className="m-auto w-[min(56rem,calc(100vw-2rem))] max-h-[90vh] rounded-lg border border-admin-line bg-white p-0 shadow-xl backdrop:bg-admin-navy/50"
        onClose={() => setPreview(null)}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-admin-line bg-admin-bg px-5 py-3">
          <p className="text-sm font-medium text-admin-navy">
            Preview: as visitors will see it{isPublished ? "" : " once published"} (changes not yet
            saved are included)
          </p>
          <button
            type="button"
            onClick={() => dialog.current?.close()}
            className={buttonClass("ghost", "min-h-9 px-2")}
            aria-label="Close the preview"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        {preview && (
          <article className="px-6 py-8 sm:px-10">
            <p className="font-mono text-[0.6875rem] tracking-[0.14em] text-muted uppercase">
              {(categoryLabels ? categoryLabels[preview.category] : preview.category) ||
                "No category"}{" "}
              ·{" "}
              {dateField
                ? /^\d{4}-\d{2}-\d{2}$/.test(preview.date)
                  ? formatVacancyDate(new Date(`${preview.date}T00:00:00Z`))
                  : "No date"
                : initial.publishedAt
                  ? formatVacancyDate(new Date(initial.publishedAt))
                  : "Not yet published"}
            </p>
            <h2 id="preview-title" className="mt-3 heading-serif text-ink">
              {preview.title}
            </h2>
            <RichText doc={preview.doc} className="mt-8" />
            {attachment && (
              <p className="mt-8 flex items-start gap-2 text-sm font-medium text-primary-strong">
                <FileText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  Download the PDF: {attachment.name}
                </span>
              </p>
            )}
          </article>
        )}
      </dialog>
    </>
  );
}
