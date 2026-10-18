/*
 * Types shared by the admin forms (Client Components) and the Server Actions behind them.
 * Plain data only, so field definitions can be passed from a server page to a client form.
 */

type BaseField = {
  /** The form field name; also the key in the validation schema. */
  name: string;
  label: string;
  help?: string;
  required?: boolean;
  /** Fields are laid out in two columns on wide screens; "half" shares a row. */
  width?: "full" | "half";
  /**
   * Show the field only while another field has one of these values (e.g. the file only for the
   * "file" type), or, with `not`, while it has none of them.
   */
  showWhen?: { field: string; oneOf: string[]; not?: boolean };
};

export type FieldDef =
  | (BaseField & { kind: "text"; maxLength: number; placeholder?: string })
  | (BaseField & { kind: "textarea"; maxLength: number; rows?: number })
  | (BaseField & { kind: "number"; min: number; max: number })
  | (BaseField & { kind: "date" })
  | (BaseField & { kind: "select"; options: { value: string; label: string }[] })
  /** Several of the options can be ticked; the value is the ticked ones, joined by commas. */
  | (BaseField & {
      kind: "checkboxes";
      options: { value: string; label: string }[];
      columns?: 1 | 2 | 3;
    })
  | (BaseField & { kind: "status" })
  /** An uploaded image plus its description (alt text), stored in the field named altName. */
  | (BaseField & { kind: "image"; altName?: string })
  /** An uploaded PDF. */
  | (BaseField & { kind: "document" })
  /** Not a field: a heading that starts a section of the form. */
  | (BaseField & { kind: "heading" });

/** An uploaded file as the form shows it. */
export type MediaPreview = {
  id: string;
  url: string;
  name: string;
  kind: "image" | "document";
};

/** Initial values for a form: every field as a string, plus previews of attached files. */
export type FormInitial = {
  values: Record<string, string>;
  media: Record<string, MediaPreview | null>;
};

export type FormState =
  | { status: "idle" }
  | {
      status: "error" | "saved";
      message: string;
      fieldErrors: Record<string, string[] | undefined>;
      /** What was submitted, so the form keeps it after React resets the fields. */
      values: Record<string, string>;
      /** Distinguishes one result from the next, so the fields re-mount with these values. */
      at: number;
    };

export const idleState: FormState = { status: "idle" };

/** The result of a delete that did not redirect. */
export type DeleteResult = { ok: false; message: string };
