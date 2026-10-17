"use client";

import { FileText, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState } from "react";

import type { FieldDef, MediaPreview } from "@/lib/cms/form";
import { cx } from "@/lib/cx";

import { buttonClass } from "../ui";
import { controlClass, describe, FieldShell } from "./fields";

type MediaFieldDef = Extract<FieldDef, { kind: "image" } | { kind: "document" }>;

const ACCEPT = {
  image: "image/jpeg,image/png,image/webp",
  document: "application/pdf",
};

/**
 * An image or PDF field. Choosing a file uploads it straight away (POST /api/admin/uploads);
 * the form then submits only the returned id, in a hidden input. Images also take a
 * description (alt text). The preview is held by the parent form, so it survives the fields
 * being re-mounted after a submission.
 */
export function MediaField({
  field,
  preview,
  onChange,
  onUploading,
  altValue,
  error,
  altError,
}: {
  field: MediaFieldDef;
  preview: MediaPreview | null;
  onChange: (preview: MediaPreview | null) => void;
  onUploading: (uploading: boolean) => void;
  altValue: string;
  error?: string;
  altError?: string;
}) {
  const kind = field.kind === "image" ? "image" : "document";
  const id = `field-${field.name}`;
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const statusId = useId();
  const shownError = uploadError ?? error;

  async function upload(file: File) {
    setUploading(true);
    onUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("kind", kind);
      body.append("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const result = (await response.json().catch(() => ({}))) as Partial<MediaPreview> & {
        error?: string;
      };
      if (!response.ok || !result.id || !result.url) {
        setUploadError(result.error ?? "The file could not be uploaded. Please try again.");
        return;
      }
      onChange({ id: result.id, url: result.url, name: result.name ?? file.name, kind });
    } catch {
      setUploadError("The file could not be uploaded. Check your connection and try again.");
    } finally {
      setUploading(false);
      onUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      <FieldShell
        id={id}
        label={field.label}
        required={field.required}
        help={
          field.help ?? (kind === "image" ? "JPEG, PNG or WebP, up to 8 MB." : "PDF, up to 15 MB.")
        }
        error={shownError}
      >
        <input type="hidden" name={field.name} value={preview?.id ?? ""} />
        <input
          ref={fileInput}
          id={id}
          type="file"
          accept={ACCEPT[kind]}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
          {...describe(id, shownError, field.help)}
        />

        <div
          className={cx(
            "flex flex-col gap-4 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center",
            shownError ? "border-admin-danger/50" : "border-admin-line",
          )}
        >
          {preview ? (
            kind === "image" ? (
              <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md bg-admin-bg sm:w-40">
                <Image
                  src={preview.url}
                  alt=""
                  fill
                  unoptimized
                  sizes="160px"
                  className="object-cover"
                />
              </div>
            ) : (
              <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-admin-accent-soft text-admin-accent-strong">
                <FileText className="size-5" aria-hidden="true" />
              </span>
            )
          ) : (
            <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-admin-bg text-admin-muted">
              {kind === "image" ? (
                <ImagePlus className="size-5" aria-hidden="true" />
              ) : (
                <FileText className="size-5" aria-hidden="true" />
              )}
            </span>
          )}

          <div className="min-w-0 flex-1">
            <p id={statusId} className="truncate text-sm text-admin-navy" aria-live="polite">
              {uploading ? (
                "Uploading…"
              ) : preview ? (
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {preview.name}
                </a>
              ) : (
                <span className="text-admin-muted">No file chosen</span>
              )}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className={buttonClass("secondary", "min-h-9 px-3")}
              >
                {uploading ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Upload aria-hidden="true" />
                )}
                {preview ? "Replace" : kind === "image" ? "Upload image" : "Upload PDF"}
              </button>
              {preview && !uploading && (
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className={buttonClass("ghost", "min-h-9 px-3")}
                >
                  <Trash2 aria-hidden="true" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </FieldShell>

      {field.kind === "image" && (
        <FieldShell
          id={`field-${field.altName}`}
          label="Image description"
          required={field.required || Boolean(preview)}
          help="Describe the image for people who cannot see it, e.g. “Students working in the electronics lab”."
          error={altError}
        >
          <input
            id={`field-${field.altName}`}
            name={field.altName}
            type="text"
            maxLength={300}
            defaultValue={altValue}
            className={controlClass}
            {...describe(`field-${field.altName}`, altError, "help")}
          />
        </FieldShell>
      )}
    </div>
  );
}
