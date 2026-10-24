import "server-only";

import { and, asc, eq, ne } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/dal";
import { CONTACT_TIMEZONE } from "@/lib/contact";
import { getDb, schema } from "@/lib/db";

import type { ResourceDef } from "../crud";
import type { FieldDef, FormInitial } from "../form";
import {
  checkedValues,
  lines,
  optionalMediaId,
  optionalText,
  optionalUrl,
  requiredText,
  status,
} from "../validation";
import { asField, loadPreview, toPhoto } from "./shared";

/*
 * The Contact page (/contact): what it says once (the settings: banner, address, hours, the
 * main phone and email, the map), the offices of its directory, and the college's pages
 * elsewhere online.
 */

const { contactOffices, contactSettings, contactSocialLinks, media } = schema;

export const CONTACT_TAG = "cms:contact";

const SETTINGS_ID = 1;

const email = (label: string) =>
  optionalText(label, 254).pipe(z.union([z.null(), z.email("Enter a valid email address.")]));

const phone = (label: string) =>
  optionalText(label, 40).refine(
    (value) =>
      value === null || (/^[\d\s()+-]+$/.test(value) && value.replace(/\D/g, "").length >= 6),
    `${label}: enter a phone number, e.g. (+975) 17160538.`,
  );

const time = (label: string) =>
  requiredText(label, 5).refine(
    (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value),
    `${label}: use 24-hour time, e.g. 08:00 or 16:00.`,
  );

/** A required web address (http or https). */
const requiredUrl = (label: string) =>
  optionalUrl(label).pipe(z.string({ error: `${label} is required.` }));

/**
 * The embedded map: a Google Maps address, the only maps the site's Content Security Policy lets
 * the page show. The HTML that Google's "Embed a map" gives can be pasted as it is; its address
 * is taken from it.
 */
const mapEmbed = requiredText("Embedded map", 2000)
  .transform(
    (value) => value.match(/<iframe[^>]*\ssrc="([^"]+)"/i)?.[1]?.replace(/&amp;/g, "&") ?? value,
  )
  .refine((value) => {
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        value.length <= 1000 &&
        (url.hostname === "maps.google.com" ||
          (url.hostname === "www.google.com" && url.pathname.startsWith("/maps")))
      );
    } catch {
      return false;
    }
  }, "Embedded map: paste the map's embed code or address from Google Maps (Share → Embed a map).");

const DAYS = ["1", "2", "3", "4", "5", "6", "0"] as const;
const DAY_NAMES: Record<(typeof DAYS)[number], string> = {
  "1": "Monday",
  "2": "Tuesday",
  "3": "Wednesday",
  "4": "Thursday",
  "5": "Friday",
  "6": "Saturday",
  "0": "Sunday",
};

// ---------------------------------------------------------------------------- settings

const settingsSchema = z
  .object({
    intro: requiredText("Introduction", 400),
    bannerImageId: optionalMediaId,
    bannerImageAlt: optionalText("Image description", 300),
    addressLines: lines("Address", 6, 120).refine(
      (items) => items.length > 0,
      "Address is required.",
    ),
    postal: optionalText("Post box", 200),
    openDays: checkedValues(DAYS)
      .refine((days) => days.length > 0, "Tick the days the office is open.")
      .transform((days) => days.map(Number)),
    opensAt: time("Opens at"),
    closesAt: time("Closes at"),
    phone: phone("Phone"),
    phoneNote: optionalText("Whose number", 120),
    email: email("Email"),
    whatsappUrl: optionalUrl("WhatsApp"),
    mapLink: requiredUrl("Directions link"),
    mapEmbed,
  })
  .superRefine((data, ctx) => {
    if (data.bannerImageId && !data.bannerImageAlt) {
      ctx.addIssue({
        code: "custom",
        path: ["bannerImageAlt"],
        message: "Describe the image for people who cannot see it.",
      });
    }
    if (data.opensAt >= data.closesAt) {
      ctx.addIssue({
        code: "custom",
        path: ["closesAt"],
        message: "The office must close after it opens.",
      });
    }
  })
  .transform((data) => ({
    ...data,
    bannerImageAlt: data.bannerImageId ? data.bannerImageAlt : null,
  }));

type SettingsInput = z.output<typeof settingsSchema>;

export const contactSettingsFields: FieldDef[] = [
  { kind: "heading", name: "bannerSection", label: "Banner" },
  {
    kind: "textarea",
    name: "intro",
    label: "Introduction",
    required: true,
    maxLength: 400,
    rows: 2,
    help: "Under the page's title.",
  },
  {
    kind: "image",
    name: "bannerImageId",
    altName: "bannerImageAlt",
    label: "Photo",
    help: "A wide campus photograph; its edges fade into the page. Without one, the page shows only its title.",
  },

  { kind: "heading", name: "visitSection", label: "Visit us" },
  {
    kind: "textarea",
    name: "addressLines",
    label: "Address",
    required: true,
    maxLength: 800,
    rows: 3,
    width: "half",
    help: "One line per line of the address.",
  },
  {
    kind: "text",
    name: "postal",
    label: "Post box",
    maxLength: 200,
    width: "half",
    placeholder: "Post-Box No. 450, Postal Code 21101",
  },
  {
    kind: "text",
    name: "mapLink",
    label: "Directions link",
    required: true,
    maxLength: 500,
    width: "half",
    placeholder: "https://maps.app.goo.gl/…",
    help: "Opened by “Directions” and “Open in Google Maps”.",
  },
  {
    kind: "textarea",
    name: "mapEmbed",
    label: "Embedded map",
    required: true,
    maxLength: 2000,
    rows: 3,
    width: "half",
    help: "In Google Maps: Share → Embed a map → Copy HTML, and paste it here.",
  },

  {
    kind: "heading",
    name: "hoursSection",
    label: "Office hours",
    help: "In Bhutan time. The page shows whether the office is open now (it does not know about public holidays).",
  },
  {
    kind: "checkboxes",
    name: "openDays",
    label: "Open on",
    required: true,
    columns: 3,
    options: DAYS.map((d) => ({ value: d, label: DAY_NAMES[d] })),
  },
  {
    kind: "text",
    name: "opensAt",
    label: "Opens at",
    required: true,
    maxLength: 5,
    width: "half",
    placeholder: "08:00",
  },
  {
    kind: "text",
    name: "closesAt",
    label: "Closes at",
    required: true,
    maxLength: 5,
    width: "half",
    placeholder: "16:00",
  },

  { kind: "heading", name: "touchSection", label: "Get in touch" },
  {
    kind: "text",
    name: "phone",
    label: "Phone",
    maxLength: 40,
    width: "half",
    placeholder: "(+975) 17160538",
  },
  {
    kind: "text",
    name: "phoneNote",
    label: "Whose number",
    maxLength: 120,
    width: "half",
    placeholder: "Administration Office",
  },
  {
    kind: "text",
    name: "email",
    label: "Email",
    maxLength: 254,
    width: "half",
    help: "Also the office the message box is addressed to at first, when an office has this email.",
  },
  {
    kind: "text",
    name: "whatsappUrl",
    label: "WhatsApp",
    maxLength: 500,
    width: "half",
    placeholder: "https://wa.me/97517160538",
    help: "Without it, the WhatsApp button is left out.",
  },
];

/** The settings are one record: saving creates it the first time and updates it after that. */
export const contactSettingsResource: ResourceDef<SettingsInput> = {
  singular: "Contact page",
  basePath: "/admin/contact",
  tag: CONTACT_TAG,
  schema: settingsSchema,
  media: (data) => [{ field: "bannerImageId", id: data.bannerImageId, kind: "image" }],
  create: async (tx, data) => {
    await tx
      .insert(contactSettings)
      .values({ id: SETTINGS_ID, ...data })
      .onConflictDoUpdate({ target: contactSettings.id, set: data });
  },
  update: async () => false, // never used: saving always goes through create (an upsert)
  remove: async () => false,
};

export async function getContactSettingsForm(): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(contactSettings)
    .where(eq(contactSettings.id, SETTINGS_ID))
    .limit(1);
  if (!row) return null;
  return {
    values: {
      intro: row.intro,
      bannerImageId: asField(row.bannerImageId),
      bannerImageAlt: asField(row.bannerImageAlt),
      addressLines: row.addressLines.join("\n"),
      postal: asField(row.postal),
      openDays: row.openDays.join(","),
      opensAt: row.opensAt,
      closesAt: row.closesAt,
      phone: asField(row.phone),
      phoneNote: asField(row.phoneNote),
      email: asField(row.email),
      whatsappUrl: asField(row.whatsappUrl),
      mapLink: row.mapLink,
      mapEmbed: row.mapEmbed,
    },
    media: { bannerImageId: await loadPreview(row.bannerImageId) },
  };
}

// ---------------------------------------------------------------------------- offices

const officeSchema = z
  .object({
    name: requiredText("Name", 160),
    email: email("Email"),
    phone: phone("Phone"),
    status,
  })
  .superRefine((data, ctx) => {
    if (!data.email && !data.phone) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Give the office an email, a phone number, or both.",
      });
    }
  });

type OfficeInput = z.output<typeof officeSchema>;

export const officeFields: FieldDef[] = [
  {
    kind: "text",
    name: "name",
    label: "Name",
    required: true,
    maxLength: 160,
    placeholder: "Dean of Student Affairs",
  },
  {
    kind: "text",
    name: "email",
    label: "Email",
    maxLength: 254,
    width: "half",
    help: "With an email, visitors can write to the office from the page.",
  },
  {
    kind: "text",
    name: "phone",
    label: "Phone",
    maxLength: 40,
    width: "half",
    placeholder: "(+975) 17160538",
  },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const officeResource: ResourceDef<OfficeInput> = {
  singular: "office",
  basePath: "/admin/contact",
  tag: CONTACT_TAG,
  schema: officeSchema,
  ordering: { key: "contactOffices", group: () => "all" },
  create: async (tx, data) =>
    (await tx.insert(contactOffices).values(data).returning({ id: contactOffices.id }))[0].id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(contactOffices)
        .set(data)
        .where(eq(contactOffices.id, id))
        .returning({ id: contactOffices.id })
    ).length > 0,
  remove: async (tx, id) =>
    (
      await tx
        .delete(contactOffices)
        .where(eq(contactOffices.id, id))
        .returning({ id: contactOffices.id })
    ).length > 0,
};

export async function getOfficeForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(contactOffices)
    .where(eq(contactOffices.id, id))
    .limit(1);
  if (!row) return null;
  return {
    values: {
      name: row.name,
      email: asField(row.email),
      phone: asField(row.phone),
      status: row.status,
    },
    media: {},
  };
}

// ---------------------------------------------------------------------------- online

const socialSchema = z.object({
  label: requiredText("Name", 60),
  url: requiredUrl("Link"),
  status,
});

type SocialInput = z.output<typeof socialSchema>;

export const socialFields: FieldDef[] = [
  {
    kind: "text",
    name: "label",
    label: "Name",
    required: true,
    maxLength: 60,
    width: "half",
    placeholder: "Facebook",
  },
  {
    kind: "text",
    name: "url",
    label: "Link",
    required: true,
    maxLength: 500,
    width: "half",
    placeholder: "https://www.facebook.com/CST.University/",
  },
  { kind: "status", name: "status", label: "Status", width: "half" },
];

export const socialResource: ResourceDef<SocialInput> = {
  singular: "link",
  basePath: "/admin/contact",
  tag: CONTACT_TAG,
  schema: socialSchema,
  validate: async (tx, data, id) => {
    const [taken] = await tx
      .select({ id: contactSocialLinks.id })
      .from(contactSocialLinks)
      .where(
        id === null
          ? eq(contactSocialLinks.url, data.url)
          : and(eq(contactSocialLinks.url, data.url), ne(contactSocialLinks.id, id)),
      )
      .limit(1);
    return taken ? { url: ["This link is already listed."] } : null;
  },
  ordering: { key: "contactSocial", group: () => "all" },
  create: async (tx, data) =>
    (await tx.insert(contactSocialLinks).values(data).returning({ id: contactSocialLinks.id }))[0]
      .id,
  update: async (tx, id, data) =>
    (
      await tx
        .update(contactSocialLinks)
        .set(data)
        .where(eq(contactSocialLinks.id, id))
        .returning({ id: contactSocialLinks.id })
    ).length > 0,
  remove: async (tx, id) =>
    (
      await tx
        .delete(contactSocialLinks)
        .where(eq(contactSocialLinks.id, id))
        .returning({ id: contactSocialLinks.id })
    ).length > 0,
};

export async function getSocialForm(id: number): Promise<FormInitial | null> {
  await requireAdmin();
  const [row] = await getDb()
    .select()
    .from(contactSocialLinks)
    .where(eq(contactSocialLinks.id, id))
    .limit(1);
  if (!row) return null;
  return { values: { label: row.label, url: row.url, status: row.status }, media: {} };
}

// ---------------------------------------------------------------------------- admin

export async function listContactParts() {
  await requireAdmin();
  const db = getDb();
  const [offices, social] = await Promise.all([
    db.select().from(contactOffices).orderBy(asc(contactOffices.sortOrder), asc(contactOffices.id)),
    db
      .select()
      .from(contactSocialLinks)
      .orderBy(asc(contactSocialLinks.sortOrder), asc(contactSocialLinks.id)),
  ]);
  return { offices, social };
}

// ---------------------------------------------------------------------------- public

/** Everything the page shows, or null before the settings are written. */
export async function getContactPage() {
  "use cache";
  cacheTag(CONTACT_TAG);
  cacheLife("hours");

  const db = getDb();
  const [row] = await db
    .select({
      settings: contactSettings,
      banner: { storageKey: media.storageKey, width: media.width, height: media.height },
    })
    .from(contactSettings)
    .leftJoin(media, eq(media.id, contactSettings.bannerImageId))
    .where(eq(contactSettings.id, SETTINGS_ID))
    .limit(1);
  if (!row) return null;
  const { settings, banner } = row;

  const [offices, social] = await Promise.all([
    db
      .select({
        id: contactOffices.id,
        name: contactOffices.name,
        email: contactOffices.email,
        phone: contactOffices.phone,
      })
      .from(contactOffices)
      .where(eq(contactOffices.status, "published"))
      .orderBy(asc(contactOffices.sortOrder), asc(contactOffices.id)),
    db
      .select({ label: contactSocialLinks.label, url: contactSocialLinks.url })
      .from(contactSocialLinks)
      .where(eq(contactSocialLinks.status, "published"))
      .orderBy(asc(contactSocialLinks.sortOrder), asc(contactSocialLinks.id)),
  ]);

  return {
    intro: settings.intro,
    banner: banner?.storageKey
      ? toPhoto(banner as typeof banner & { storageKey: string }, settings.bannerImageAlt)
      : null,
    address: settings.addressLines,
    postal: settings.postal,
    hours: {
      timezone: CONTACT_TIMEZONE,
      days: settings.openDays,
      open: settings.opensAt,
      close: settings.closesAt,
    },
    map: { link: settings.mapLink, embed: settings.mapEmbed },
    general: {
      phone: settings.phone,
      phoneNote: settings.phoneNote,
      email: settings.email,
      whatsapp: settings.whatsappUrl,
    },
    social,
    offices,
  };
}

export type ContactPage = NonNullable<Awaited<ReturnType<typeof getContactPage>>>;
