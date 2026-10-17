"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";

import { controlClass, describe, FieldShell } from "@/components/admin/form/fields";
import { buttonClass, Notice } from "@/components/admin/ui";

import { changePassword, type PasswordState } from "./actions";

const fields = [
  { name: "current", label: "Current password", autoComplete: "current-password" },
  {
    name: "next",
    label: "New password",
    autoComplete: "new-password",
    help: "At least 12 characters. A short sentence is easier to remember than a jumble.",
  },
  { name: "confirm", label: "Confirm new password", autoComplete: "new-password" },
] as const;

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, {});
  const summary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status) summary.current?.focus();
  }, [state]);

  return (
    <form action={action} className="space-y-5 p-5 sm:p-6">
      {state.status && (
        <Notice
          ref={summary}
          tabIndex={-1}
          tone={state.status === "saved" ? "success" : "error"}
          className="focus:outline-none"
        >
          {state.message}
        </Notice>
      )}
      {fields.map((field) => {
        const id = `password-${field.name}`;
        const error = state.fieldErrors?.[field.name];
        const help = "help" in field ? field.help : undefined;
        return (
          <FieldShell
            key={field.name}
            id={id}
            label={field.label}
            required
            help={help}
            error={error}
          >
            <input
              id={id}
              name={field.name}
              type="password"
              autoComplete={field.autoComplete}
              required
              disabled={pending}
              className={controlClass}
              {...describe(id, error, help)}
            />
          </FieldShell>
        );
      })}
      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
          {pending ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}
