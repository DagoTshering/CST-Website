import type { ReactNode } from "react";

import type { FieldDef } from "@/lib/cms/form";
import { cx } from "@/lib/cx";

/** Input styling shared by every admin form control. */
export const controlClass =
  "block w-full rounded-md border border-admin-line bg-white px-3.5 py-2.5 text-[0.9375rem] text-admin-navy shadow-xs transition-colors placeholder:text-admin-muted/60 focus:border-admin-accent focus:ring-3 focus:ring-admin-accent/20 focus:outline-none aria-invalid:border-admin-danger aria-invalid:ring-admin-danger/15";

/** A field's label, help text and error, wrapped round its control. */
export function FieldShell({
  id,
  label,
  required,
  help,
  error,
  className,
  children,
  as: Tag = "div",
}: {
  id: string;
  label: string;
  required?: boolean;
  help?: string;
  error?: string;
  className?: string;
  children: ReactNode;
  as?: "div" | "fieldset";
}) {
  const Label = Tag === "fieldset" ? "legend" : "label";
  return (
    <Tag className={cx("min-w-0", className)}>
      <Label
        {...(Tag === "fieldset" ? {} : { htmlFor: id })}
        className="block text-sm font-medium text-admin-navy"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-admin-danger" aria-hidden="true">
            *
          </span>
        ) : (
          <span className="ml-1.5 text-xs font-normal text-admin-muted">Optional</span>
        )}
      </Label>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-admin-danger">
          {error}
        </p>
      ) : (
        help && (
          <p id={`${id}-help`} className="mt-1.5 text-xs leading-relaxed text-admin-muted">
            {help}
          </p>
        )
      )}
    </Tag>
  );
}

/** aria attributes linking a control to its error or help text. */
export function describe(id: string, error?: string, help?: string) {
  return {
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-error` : help ? `${id}-help` : undefined,
  } as const;
}

type SimpleField = Exclude<FieldDef, { kind: "image" } | { kind: "document" } | { kind: "heading" }>;

/** Text, number, date, select and status fields. Uncontrolled: the form submits them as is. */
export function SimpleControl({
  field,
  value,
  error,
}: {
  field: SimpleField;
  value: string;
  error?: string;
}) {
  const id = `field-${field.name}`;
  const aria = describe(id, error, field.help);
  const common = { id, name: field.name, required: field.required, ...aria };

  if (field.kind === "checkboxes") {
    const ticked = new Set(value.split(",").filter(Boolean));
    return (
      <div
        className={cx(
          "grid gap-x-6 gap-y-2.5 rounded-md border border-admin-line px-4 py-3",
          field.columns === 2 && "sm:grid-cols-2",
          field.columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {field.options.length === 0 && (
          <p className="text-sm text-admin-muted">None to choose from.</p>
        )}
        {field.options.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-2.5 text-sm text-admin-navy"
          >
            <input
              type="checkbox"
              name={field.name}
              value={option.value}
              defaultChecked={ticked.has(option.value)}
              className="mt-0.5 size-4 shrink-0 accent-admin-accent-strong"
            />
            {option.label}
          </label>
        ))}
      </div>
    );
  }

  if (field.kind === "status") {
    const current = value === "published" ? "published" : "draft";
    return (
      <div className="inline-flex rounded-md border border-admin-line bg-admin-bg p-1">
        {(
          [
            ["draft", "Draft"],
            ["published", "Published"],
          ] as const
        ).map(([option, label]) => (
          <label
            key={option}
            className="cursor-pointer rounded px-4 py-1.5 text-sm font-medium text-admin-muted transition-colors has-checked:bg-white has-checked:text-admin-navy has-checked:shadow-sm has-focus-visible:outline-2 has-focus-visible:outline-admin-accent"
          >
            <input
              type="radio"
              name={field.name}
              value={option}
              defaultChecked={current === option}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    );
  }

  switch (field.kind) {
    case "textarea":
      return (
        <textarea
          {...common}
          defaultValue={value}
          maxLength={field.maxLength}
          rows={field.rows ?? 4}
          className={cx(controlClass, "resize-y leading-relaxed")}
        />
      );
    case "number":
      return (
        <input
          {...common}
          type="number"
          inputMode="numeric"
          step={1}
          min={field.min}
          max={field.max}
          defaultValue={value}
          className={cx(controlClass, "max-w-40")}
        />
      );
    case "date":
      return (
        <input
          {...common}
          type="date"
          defaultValue={value}
          className={cx(controlClass, "max-w-52")}
        />
      );
    case "select":
      return (
        <select {...common} defaultValue={value} className={cx(controlClass, "pr-9")}>
          {!value && !field.options.some((option) => option.value === "") && (
            <option value="" disabled>
              Choose…
            </option>
          )}
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <input
          {...common}
          type="text"
          defaultValue={value}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          className={controlClass}
        />
      );
  }
}
