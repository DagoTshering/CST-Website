"use client";

import { Loader2, Trash2, TriangleAlert } from "lucide-react";
import { useId, useRef, useState, useTransition } from "react";

import type { DeleteResult } from "@/lib/cms/form";

import { buttonClass } from "./ui";

/**
 * Deletes a record after the administrator confirms in a dialog. The Server Action (with the
 * id bound) redirects back to the list on success, or returns a message to show here.
 */
export function DeleteButton({
  action,
  itemName,
  kind,
  compact = false,
}: {
  action: () => Promise<DeleteResult>;
  /** What is being deleted, e.g. the facility's name. */
  itemName: string;
  /** e.g. "facility". */
  kind: string;
  /** An icon-only button, for table rows. */
  compact?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();

  const confirm = () =>
    startTransition(async () => {
      const result = await action();
      if (result && !result.ok) setError(result.message);
    });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          dialog.current?.showModal();
        }}
        className={
          compact
            ? "rounded-md p-2 text-admin-muted transition-colors hover:bg-admin-danger-soft hover:text-admin-danger"
            : buttonClass(
                "secondary",
                "text-admin-danger hover:border-admin-danger/40 hover:bg-admin-danger-soft",
              )
        }
      >
        <Trash2 className="size-4" aria-hidden="true" />
        <span className={compact ? "sr-only" : undefined}>
          Delete{compact ? ` ${itemName}` : ""}
        </span>
      </button>

      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className="m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-admin-line bg-white p-0 text-left shadow-xl backdrop:bg-admin-navy/40"
        onCancel={(event) => {
          if (pending) event.preventDefault();
        }}
      >
        <div className="flex gap-4 p-6">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-admin-danger-soft text-admin-danger">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-admin-navy">
              Delete this {kind}?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed break-words text-admin-muted">
              “{itemName}” will be removed permanently and disappear from the public website. This
              cannot be undone.
            </p>
            {error && (
              <p role="alert" className="mt-3 text-sm text-admin-danger">
                {error}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-admin-line bg-admin-bg/60 px-6 py-4">
          <button
            type="button"
            autoFocus
            disabled={pending}
            onClick={() => dialog.current?.close()}
            className={buttonClass("secondary")}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={confirm}
            className={buttonClass("danger")}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {pending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </dialog>
    </>
  );
}
