import "server-only";

import { and, eq } from "drizzle-orm";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

import type { DeleteResult, FormState } from "./form";
import { parsePosition, placeItem, positionField, type OrderingKey } from "./ordering";
import { formValues, recordId } from "./validation";

/*
 * The shared create/update/delete flow behind every content category's Server Actions:
 * authorise, validate, write in a transaction, refresh the public cache, then redirect with a
 * notice (or report errors back to the form). Each category supplies a ResourceDef with its
 * schema and its own Drizzle writes; see src/lib/cms/resources/.
 */

type Db = ReturnType<typeof getDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type MediaRef = { field: string; id: string | null; kind: "image" | "document" };

export type ResourceDef<T> = {
  /** Lower case, for messages: "facility". */
  singular: string;
  /** The admin list page, where saves and deletes return to. */
  basePath: string;
  /** Cache tag of the public data this category feeds. */
  tag: string;
  schema: z.ZodType<T>;
  /** The uploaded files the data points at, checked to exist and be of the right kind. */
  media?: (data: T) => MediaRef[];
  /**
   * Further checks against the database (inside the save's transaction): field errors or null.
   * `id` is the record being edited, or null for a new one.
   */
  validate?: (tx: Tx, data: T, id: number | null) => Promise<Record<string, string[]> | null>;
  /** Returns the new record's id (needed when the records are ordered). */
  create: (tx: Tx, data: T) => Promise<number | void>;
  /** Returns false when the record no longer exists. */
  update: (tx: Tx, id: number, data: T) => Promise<boolean>;
  /**
   * For records the administrator puts in order (see ordering.ts): which list, and the group a
   * record belongs to. The form's Position field for that group places it.
   */
  ordering?: { key: OrderingKey; group: (data: T) => string };
  /** Returns false when the record no longer exists; throws ActionError when it may not go. */
  remove: (tx: Tx, id: number) => Promise<boolean>;
};

/** A failure whose message is safe and useful to show the administrator. */
export class ActionError extends Error {}

export type Notice = "created" | "updated" | "deleted" | "missing";

const failed = (
  message: string,
  values: Record<string, string>,
  fieldErrors: Record<string, string[] | undefined> = {},
): FormState => ({ status: "error", message, fieldErrors, values, at: Date.now() });

async function checkMedia(tx: Tx, refs: MediaRef[]) {
  const errors: Record<string, string[]> = {};
  for (const ref of refs) {
    if (!ref.id) continue;
    const [found] = await tx
      .select({ id: schema.media.id })
      .from(schema.media)
      .where(and(eq(schema.media.id, ref.id), eq(schema.media.kind, ref.kind)))
      .limit(1);
    if (!found) errors[ref.field] = ["That file could not be found. Upload it again."];
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Creates (id null) or updates a record from a submitted form. On success it redirects to the
 * list page, or with `stay` returns a "saved" state for the form to show.
 */
export async function saveResource<T>(
  def: ResourceDef<T>,
  rawId: number | null,
  formData: FormData,
  options: { stay?: boolean } = {},
): Promise<FormState> {
  await requireAdmin();

  const values = formValues(formData);
  const id = rawId === null ? null : recordId.safeParse(rawId);
  if (id && !id.success) return failed("This record could not be found.", values);

  const parsed = def.schema.safeParse(values);
  if (!parsed.success) {
    return failed(
      "Please correct the highlighted fields.",
      values,
      z.flattenError(parsed.error).fieldErrors as Record<string, string[] | undefined>,
    );
  }

  let outcome: Notice;
  try {
    const result = await getDb().transaction(async (tx) => {
      const mediaErrors =
        (await checkMedia(tx, def.media?.(parsed.data) ?? [])) ??
        (await def.validate?.(tx, parsed.data, id === null ? null : id.data)) ??
        null;
      if (mediaErrors) return { mediaErrors };
      const place = async (recordId: number, isNew: boolean) => {
        if (!def.ordering) return;
        const group = def.ordering.group(parsed.data);
        const position = parsePosition(values[positionField(group)]);
        await placeItem(tx, def.ordering.key, group, recordId, position, isNew);
      };
      if (id === null) {
        const newId = await def.create(tx, parsed.data);
        if (typeof newId === "number") await place(newId, true);
        return { notice: "created" as const };
      }
      const found = await def.update(tx, id.data, parsed.data);
      if (found) await place(id.data, false);
      return { notice: found ? ("updated" as const) : ("missing" as const) };
    });
    if ("mediaErrors" in result) {
      return failed("Please correct the highlighted fields.", values, result.mediaErrors);
    }
    outcome = result.notice;
  } catch (error) {
    if (error instanceof ActionError) return failed(error.message, values);
    console.error(`Admin: saving a ${def.singular} failed`, error);
    return failed(`The ${def.singular} could not be saved. Please try again.`, values);
  }

  if (outcome === "missing") {
    return failed(`This ${def.singular} no longer exists. It may have been deleted.`, values);
  }

  updateTag(def.tag);
  if (options.stay) {
    refresh(); // re-render the admin page with what was saved
    return { status: "saved", message: "Changes saved.", fieldErrors: {}, values, at: Date.now() };
  }
  redirect(`${def.basePath}?notice=${outcome}`);
}

/** Deletes a record, then returns to the list page with a notice. */
export async function deleteResource<T>(def: ResourceDef<T>, rawId: number): Promise<DeleteResult> {
  await requireAdmin();

  const id = recordId.safeParse(rawId);
  if (!id.success) return { ok: false, message: "This record could not be found." };

  let removed: boolean;
  try {
    removed = await getDb().transaction((tx) => def.remove(tx, id.data));
  } catch (error) {
    if (error instanceof ActionError) return { ok: false, message: error.message };
    console.error(`Admin: deleting a ${def.singular} failed`, error);
    return { ok: false, message: `The ${def.singular} could not be deleted. Please try again.` };
  }

  if (removed) updateTag(def.tag);
  redirect(`${def.basePath}?notice=${removed ? "deleted" : "missing"}`);
}
