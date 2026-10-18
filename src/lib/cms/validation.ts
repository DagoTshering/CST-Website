import { z } from "zod";

/*
 * Field schemas for the admin forms. Form fields arrive as strings (or are missing); these
 * clean them (control characters removed, whitespace trimmed, line endings normalised) and
 * convert empty optional values to null. Content is stored and rendered as plain text, which
 * React escapes, so no HTML is ever accepted.
 */

const clean = (value: string) =>
  value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n?/g, "\n")
    .trim();

const str = z
  .string()
  .optional()
  .transform((value) => clean(value ?? ""));

const tooLong = (label: string, max: number) => `${label} must be at most ${max} characters.`;

export const requiredText = (label: string, max: number) =>
  str.pipe(z.string().min(1, `${label} is required.`).max(max, tooLong(label, max)));

export const optionalText = (label: string, max: number) =>
  str.pipe(z.string().max(max, tooLong(label, max))).transform((value) => value || null);

const isValidIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

export const requiredDate = (label: string) =>
  str.pipe(
    z
      .string()
      .min(1, `${label} is required.`)
      .refine(isValidIsoDate, `${label} must be a valid date.`),
  );

export const optionalDate = (label: string) =>
  str
    .pipe(z.string().refine((v) => v === "" || isValidIsoDate(v), `${label} must be a valid date.`))
    .transform((value) => value || null);

export const sortOrder = str
  .pipe(z.string().regex(/^\d{0,4}$/, "Use a whole number from 0 to 9999."))
  .transform((value) => (value === "" ? 0 : Number(value)));

export const optionalYear = (label: string) =>
  str
    .pipe(z.string().regex(/^(\d{4})?$/, `${label} must be a four-digit year.`))
    .transform((value) => (value === "" ? null : Number(value)))
    .refine((year) => year === null || (year >= 1950 && year <= 2100), {
      message: `${label} must be between 1950 and 2100.`,
    });

export const status = z.enum(["draft", "published"], { error: "Choose draft or published." });

export const requiredMediaId = (message: string) =>
  str.pipe(z.string().min(1, message).pipe(z.uuid(message)));

export const optionalMediaId = str
  .pipe(z.union([z.literal(""), z.uuid("That file is not valid. Upload it again.")]))
  .transform((value) => value || null);

/** A database id from a URL or a bound action argument, which the client could have changed. */
export const recordId = z.coerce.number().int().positive().max(2_147_483_647);

/**
 * The submitted text fields; files and React's internal $ACTION_ fields are left out. A field
 * sent more than once (a group of checkboxes) becomes its values joined by commas.
 */
export function formValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (typeof value !== "string" || key.startsWith("$ACTION")) continue;
    values[key] = key in values ? `${values[key]},${value}` : value;
  }
  return values;
}

/** Ticked checkboxes (the joined values) as a list of the allowed values, without repeats. */
export const checkedValues = <T extends string>(allowed: readonly T[]) =>
  str.transform((value) => [
    ...new Set(value.split(",").filter((v): v is T => (allowed as readonly string[]).includes(v))),
  ]);

/** Ticked checkboxes holding database ids, as numbers. */
export const checkedIds = str.transform((value) => [
  ...new Set(
    value
      .split(",")
      .filter((v) => /^\d{1,9}$/.test(v))
      .map(Number),
  ),
]);
