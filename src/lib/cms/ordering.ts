import "server-only";

import { sql, type SQL } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb } from "@/lib/db";
import { mediaUrl } from "@/lib/media/url";

import type { Tx } from "./crud";
import type { FieldDef } from "./form";

/*
 * The order of items in the admin panel's ordered lists (staff within a department, the
 * executives' chart rows, downloads within a category, …). Administrators never see the stored
 * sort_order: they choose a Position (First / After … / Last) in a form, or drag items on an
 * Arrange screen, and the group is renumbered 10, 20, 30, … behind the scenes.
 *
 * Each list is described once here. Its items fall into groups (a department, a chart row; or one
 * group, "all"); positions only ever compare items in the same group.
 */

export type OrderingKey =
  | "staff"
  | "departments"
  | "executives"
  | "facilities"
  | "programmes"
  | "downloads"
  | "downloadCategories"
  | "programmeModules"
  | "programmeFacilities"
  | "centres"
  | "admissionTracks"
  | "admissionFaqs"
  | "admissionStepTypes"
  | "importantLinks"
  | "partners";

type Ordering = {
  table: string;
  /** What an item is called in the lists: an expression over `t` (and the joins in `from`). */
  label: SQL;
  /** The group an item belongs to, as text; "all" for a single list. */
  group: SQL;
  /** Tables joined to `t`, for the label, photo or section. */
  from?: SQL;
  /** A thumbnail's storage key, when the items have photos. */
  photo?: SQL;
  /** Sub-heading within a group, kept together (the programme of a project report). */
  section?: SQL;
  sectionOrder?: SQL;
  /** Cache tags to refresh after a change of order. */
  tags: string[];
  /** The admin list to return to. */
  listPath: (group: string) => string;
};

const t = sql.raw("t");

const orderings: Record<OrderingKey, Ordering> = {
  staff: {
    table: "staff",
    label: sql`${t}.name`,
    group: sql`${t}.department_id::text`,
    from: sql`left join media m on m.id = ${t}.photo_id`,
    photo: sql`m.storage_key`,
    tags: ["cms:staff"],
    listPath: (group) => `/admin/staff?department=${group}`,
  },
  departments: {
    table: "departments",
    label: sql`${t}.name`,
    group: sql`'all'`,
    tags: ["cms:staff"],
    listPath: () => "/admin/staff/departments",
  },
  executives: {
    table: "executives",
    label: sql`${t}.name`,
    group: sql`${t}.level::text`,
    from: sql`left join staff s on s.id = ${t}.staff_id
      left join media m on m.id = coalesce(${t}.photo_id, s.photo_id)`,
    photo: sql`m.storage_key`,
    tags: ["cms:executives"],
    listPath: () => "/admin/executives",
  },
  facilities: {
    table: "facilities",
    label: sql`${t}.name`,
    group: sql`'all'`,
    from: sql`left join media m on m.id = ${t}.image_id`,
    photo: sql`m.storage_key`,
    tags: ["cms:facilities"],
    listPath: () => "/admin/facilities",
  },
  programmes: {
    table: "programmes",
    label: sql`${t}.name`,
    // undergraduate and postgraduate programmes are listed apart everywhere, so ordered apart
    group: sql`${t}.level::text`,
    tags: ["cms:programmes", "cms:downloads", "cms:staff"],
    listPath: () => "/admin/programmes",
  },
  downloads: {
    table: "downloads",
    label: sql`${t}.title`,
    group: sql`${t}.category_id::text`,
    from: sql`left join programmes p on p.id = ${t}.programme_id`,
    section: sql`p.name`,
    sectionOrder: sql`p.sort_order`,
    tags: ["cms:downloads"],
    listPath: (group) => `/admin/downloads?category=${group}`,
  },
  downloadCategories: {
    table: "download_categories",
    label: sql`${t}.name`,
    group: sql`'all'`,
    tags: ["cms:downloads"],
    listPath: () => "/admin/downloads/categories",
  },
  programmeModules: {
    table: "programme_modules",
    label: sql`${t}.name`,
    group: sql`${t}.programme_id::text`,
    tags: ["cms:programmes"],
    listPath: (group) => `/admin/programmes/${group}#modules`,
  },
  programmeFacilities: {
    table: "programme_facilities",
    label: sql`${t}.name`,
    group: sql`${t}.programme_id::text`,
    tags: ["cms:programmes"],
    listPath: (group) => `/admin/programmes/${group}#facilities`,
  },
  // the About page's research centres and innovation centres, each in its own order
  centres: {
    table: "research_centres",
    label: sql`${t}.acronym`,
    group: sql`${t}.centre_group::text`,
    from: sql`left join media m on m.id = ${t}.image_id`,
    photo: sql`m.storage_key`,
    tags: ["cms:about-page"],
    listPath: () => "/admin/about-page#centres",
  },
  admissionTracks: {
    table: "admission_tracks",
    label: sql`${t}.title`,
    group: sql`'all'`,
    tags: ["cms:admission"],
    listPath: () => "/admin/admissions#requirements",
  },
  admissionFaqs: {
    table: "admission_faqs",
    label: sql`${t}.question`,
    group: sql`'all'`,
    tags: ["cms:admission"],
    listPath: () => "/admin/admissions#faq",
  },
  admissionStepTypes: {
    table: "admission_step_types",
    label: sql`${t}.name`,
    group: sql`'all'`,
    tags: ["cms:admission"],
    listPath: () => "/admin/admissions/steps",
  },
  importantLinks: {
    table: "important_links",
    label: sql`${t}.label`,
    group: sql`'all'`,
    tags: ["cms:important-links"],
    listPath: () => "/admin/important-links",
  },
  // international and national partners are listed apart, so ordered apart
  partners: {
    table: "partners",
    label: sql`${t}.name`,
    group: sql`${t}.category::text`,
    from: sql`left join media m on m.id = ${t}.logo_id`,
    photo: sql`m.storage_key`,
    tags: ["cms:partners"],
    listPath: (group) => `/admin/partners?category=${group}`,
  },
};

export type OrderedItem = {
  id: number;
  label: string;
  group: string;
  section: string | null;
  photo: string | null;
};

const isGroupKey = (group: string) =>
  group === "all" ||
  /^\d{1,9}$/.test(group) ||
  group === "undergraduate" ||
  group === "postgraduate" ||
  group === "research" ||
  group === "innovation" ||
  group === "international" ||
  group === "national";

/** The items of one group (or, without `group`, of every group), in their current order. */
export async function orderedItems(
  key: OrderingKey,
  group?: string,
  db: Pick<Tx, "execute"> = getDb(),
): Promise<OrderedItem[]> {
  const o = orderings[key];
  if (group !== undefined && !isGroupKey(group)) return [];
  const rows = await db.execute<{
    id: number;
    label: string;
    group: string;
    section: string | null;
    photo: string | null;
  }>(sql`
    select ${t}.id, ${o.label} as label, ${o.group} as "group",
      ${o.section ?? sql`null`} as section, ${o.photo ?? sql`null`} as photo
    from ${sql.identifier(o.table)} as t ${o.from ?? sql``}
    ${group === undefined ? sql`` : sql`where ${o.group} = ${group}`}
    order by "group",
      ${o.section ? sql`${o.sectionOrder ?? o.section} asc nulls first, ${o.section},` : sql``}
      ${t}.sort_order, label, ${t}.id
  `);
  return rows.map((row) => ({
    id: Number(row.id),
    label: row.label,
    group: row.group,
    section: row.section,
    photo: row.photo ? mediaUrl(row.photo) : null,
  }));
}

/** Gives the items these positions in this order: 10, 20, 30, … */
async function renumber(tx: Tx, key: OrderingKey, ids: number[]) {
  if (ids.length === 0) return;
  const values = sql.join(
    ids.map((id, i) => sql`(${id}::integer, ${(i + 1) * 10}::integer)`),
    sql`, `,
  );
  await tx.execute(sql`
    update ${sql.identifier(orderings[key].table)} as t set sort_order = v.position
    from (values ${values}) as v(id, position) where t.id = v.id
  `);
}

// ---------------------------------------------------------------------------- forms

/** "first", "last" or "after:<id>": where to put an item in its group. */
export type Position = "first" | "last" | { after: number };

export function parsePosition(value: string | undefined): Position | null {
  if (value === "first" || value === "last") return value;
  const after = value?.match(/^after:(\d{1,9})$/);
  return after ? { after: Number(after[1]) } : null;
}

/** The form field holding the position within `group`. */
export const positionField = (group: string) => `position@${group}`;

/**
 * Puts the item at the position in its group and renumbers the group. Called in the save's
 * transaction (see saveResource). Without a position, a new item goes last and an existing one
 * keeps its place (if it is already in the group).
 */
export async function placeItem(
  tx: Tx,
  key: OrderingKey,
  group: string,
  id: number,
  position: Position | null,
  isNew: boolean,
) {
  const ids = (await orderedItems(key, group, tx)).map((item) => item.id);
  const others = ids.filter((other) => other !== id);
  if (!position && !isNew && ids.includes(id)) return;
  const place = position ?? "last";
  let at = others.length;
  if (place === "first") at = 0;
  else if (place !== "last") {
    const after = others.indexOf(place.after);
    at = after === -1 ? others.length : after + 1;
  }
  others.splice(at, 0, id);
  await renumber(tx, key, others);
}

/**
 * The Position fields for a form: one per group, each shown while that group is chosen in the
 * form's `groupField` (e.g. the department), listing First, After … and Last. `current` is the
 * item being edited (left out of its own list, which starts at its present place).
 */
export function positionFields(
  items: OrderedItem[],
  options: {
    groups: string[];
    groupField?: string;
    label: string;
    help?: string;
    current?: { id: number; group: string };
  },
): { fields: FieldDef[]; values: Record<string, string> } {
  const fields: FieldDef[] = [];
  const values: Record<string, string> = {};
  for (const group of options.groups) {
    const inGroup = items.filter((item) => item.group === group);
    const others = inGroup.filter((item) => item.id !== options.current?.id);
    fields.push({
      kind: "select",
      name: positionField(group),
      label: options.label,
      required: true,
      width: "half",
      help: options.help,
      options: [
        { value: "first", label: "First" },
        ...others.map((item) => ({
          value: `after:${item.id}`,
          label: `After ${item.label}${item.section ? ` (${item.section})` : ""}`,
        })),
        { value: "last", label: "Last" },
      ],
      ...(options.groupField ? { showWhen: { field: options.groupField, oneOf: [group] } } : {}),
    });
    // Where it is now, in its own group; elsewhere (if moved there), last.
    let value = "last";
    if (options.current?.group === group) {
      const at = inGroup.findIndex((item) => item.id === options.current?.id);
      value = at <= 0 ? "first" : `after:${inGroup[at - 1].id}`;
    }
    values[positionField(group)] = value;
  }
  return { fields, values };
}

// ---------------------------------------------------------------------------- arrange screen

export type ArrangeResult = { ok: false; message: string };

/**
 * Saves a group's order from the Arrange screen. The ids must be exactly the group's items: if
 * someone added or removed one meanwhile, nothing is saved and the administrator reloads.
 */
export async function saveArrangement(
  key: OrderingKey,
  group: string,
  ids: unknown,
): Promise<ArrangeResult> {
  await requireAdmin();
  const o = orderings[key];
  if (!o || !isGroupKey(group)) return { ok: false, message: "This list could not be found." };
  if (
    !Array.isArray(ids) ||
    ids.length > 5000 ||
    !ids.every((id) => Number.isInteger(id) && id > 0)
  ) {
    return { ok: false, message: "The order could not be read. Reload and try again." };
  }

  let saved: boolean;
  try {
    saved = await getDb().transaction(async (tx) => {
      const current = (await orderedItems(key, group, tx)).map((item) => item.id);
      const wanted = new Set(ids as number[]);
      if (wanted.size !== current.length || !current.every((id) => wanted.has(id))) return false;
      await renumber(tx, key, ids as number[]);
      return true;
    });
  } catch (error) {
    console.error(`Admin: saving the order of ${key} failed`, error);
    return { ok: false, message: "The order could not be saved. Please try again." };
  }
  if (!saved) {
    return {
      ok: false,
      message: "The list has changed since you opened it. Reload the page and arrange it again.",
    };
  }

  for (const tag of o.tags) updateTag(tag);
  const [path, fragment] = o.listPath(group).split("#");
  redirect(
    `${path}${path.includes("?") ? "&" : "?"}notice=reordered${fragment ? `#${fragment}` : ""}`,
  );
}

/**
 * The Position fields and their values for a form (see positionFields), read from the database.
 * Without `groups`, the list is one group.
 */
export async function positionForm(
  key: OrderingKey,
  options: {
    label: string;
    help?: string;
    groups?: string[];
    groupField?: string;
    current?: { id: number; group: string };
  },
) {
  await requireAdmin();
  return positionFields(await orderedItems(key), { ...options, groups: options.groups ?? ["all"] });
}

/** The form's fields with the Position fields placed just before Status (or at the end). */
export function withPosition(fields: FieldDef[], position: FieldDef[]) {
  const at = fields.findIndex((field) => field.kind === "status");
  return at === -1
    ? [...fields, ...position]
    : [...fields.slice(0, at), ...position, ...fields.slice(at)];
}
