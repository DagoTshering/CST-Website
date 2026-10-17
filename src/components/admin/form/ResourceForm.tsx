"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { idleState, type FieldDef, type FormInitial, type FormState } from "@/lib/cms/form";
import { cx } from "@/lib/cx";

import { buttonClass, Notice } from "../ui";
import { FieldShell, SimpleControl } from "./fields";
import { MediaField } from "./MediaField";

type Props = {
  /** A Server Action with the record id already bound. */
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  fields: FieldDef[];
  initial: FormInitial;
  submitLabel: string;
  cancelHref?: string;
};

/**
 * The create/edit form every content category uses, built from its field definitions. The
 * Server Action validates on the server; errors come back per field, with what was typed.
 */
export function ResourceForm({ action, fields, initial, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState(action, idleState);
  const [media, setMedia] = useState(initial.media);
  const [uploads, setUploads] = useState(0);
  const summary = useRef<HTMLDivElement>(null);

  const values = state.status === "idle" ? initial.values : state.values;
  const errors = state.status === "error" ? state.fieldErrors : {};
  const error = (name: string) => errors[name]?.[0];
  // After each submission the fields re-mount, so they show what was submitted.
  const version = state.status === "idle" ? 0 : state.at;

  useEffect(() => {
    if (state.status !== "idle") summary.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="rounded-lg border border-admin-line bg-white shadow-xs">
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

        <div key={version} className="grid gap-x-6 gap-y-6 sm:grid-cols-2">
          {fields.map((field) => {
            if (field.kind === "image" || field.kind === "document") {
              return (
                <MediaField
                  key={field.name}
                  field={field}
                  preview={media[field.name] ?? null}
                  onChange={(preview) =>
                    setMedia((current) => ({ ...current, [field.name]: preview }))
                  }
                  onUploading={(busy) => setUploads((n) => n + (busy ? 1 : -1))}
                  altValue={field.kind === "image" ? (values[field.altName] ?? "") : ""}
                  error={error(field.name)}
                  altError={field.kind === "image" ? error(field.altName) : undefined}
                />
              );
            }
            return (
              <FieldShell
                key={field.name}
                id={`field-${field.name}`}
                label={field.label}
                required={field.required || field.kind === "status"}
                help={field.help}
                error={error(field.name)}
                as={field.kind === "status" ? "fieldset" : "div"}
                className={cx(field.width !== "half" && "sm:col-span-2")}
              >
                <SimpleControl
                  field={field}
                  value={values[field.name] ?? ""}
                  error={error(field.name)}
                />
              </FieldShell>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-admin-line bg-admin-bg/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-7">
        {cancelHref && (
          <Link href={cancelHref} className={buttonClass("ghost")}>
            Cancel
          </Link>
        )}
        <button type="submit" disabled={pending || uploads > 0} className={buttonClass("primary")}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {pending ? "Saving…" : uploads > 0 ? "Waiting for upload…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
