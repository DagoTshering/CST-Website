/**
 * Fills in the Contact page (/contact) from data/contact.json, the content the static page was
 * built from.
 *
 * - The page's settings (introduction, banner photo, address, hours, main phone and email, map)
 *   are added while there are none; the photo is copied from public/images into the upload store.
 * - The offices and the links under "Find us online" are each added while there are none.
 * - Nothing an administrator has written or changed is replaced.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

import { count } from "drizzle-orm";

import type { getDb, schema as Schema } from "../src/lib/db";
import { imageCopier } from "./seed-images";

type Db = ReturnType<typeof getDb>;

type ContactData = {
  intro: string;
  banner: { image: string; alt: string };
  address: string[];
  postal: string;
  hours: { days: number[]; open: string; close: string };
  map: { link: string; embed: string };
  general: { phoneLabel: string; email: string; whatsapp: string };
  social: { label: string; url: string }[];
  offices: { name: string; email: string | null; phoneLabel: string | null }[];
};

export async function seedContact(db: Db, schema: typeof Schema) {
  const { contactOffices, contactSettings, contactSocialLinks } = schema;
  const data = JSON.parse(
    await readFile(path.join(process.cwd(), "data/contact.json"), "utf8"),
  ) as ContactData;
  const isEmpty = async (
    table: typeof contactSettings | typeof contactOffices | typeof contactSocialLinks,
  ) => (await db.select({ n: count() }).from(table))[0].n === 0;

  if (await isEmpty(contactSettings)) {
    const images = imageCopier(schema);
    try {
      await db.transaction(async (tx) => {
        await tx.insert(contactSettings).values({
          intro: data.intro,
          bannerImageId: await images.copy(tx, data.banner.image),
          bannerImageAlt: data.banner.alt,
          addressLines: data.address,
          postal: data.postal,
          openDays: data.hours.days,
          opensAt: data.hours.open,
          closesAt: data.hours.close,
          phone: data.general.phoneLabel,
          phoneNote: "Administration Office",
          email: data.general.email,
          whatsappUrl: data.general.whatsapp,
          mapLink: data.map.link,
          mapEmbed: data.map.embed,
        });
      });
      console.log("Contact page: seeded.");
    } catch (error) {
      await images.discard(); // the transaction rolled back; remove the copied photo
      throw error;
    }
  } else {
    console.log("Contact page: already has content; left unchanged.");
  }

  if (await isEmpty(contactOffices)) {
    await db.insert(contactOffices).values(
      data.offices.map((o, i) => ({
        name: o.name,
        email: o.email,
        phone: o.phoneLabel,
        sortOrder: (i + 1) * 10,
        status: "published" as const,
      })),
    );
    console.log(`Contact offices: seeded ${data.offices.length}.`);
  }

  if (await isEmpty(contactSocialLinks)) {
    await db.insert(contactSocialLinks).values(
      data.social.map((s, i) => ({
        label: s.label,
        url: s.url,
        sortOrder: (i + 1) * 10,
        status: "published" as const,
      })),
    );
    console.log(`Contact links: seeded ${data.social.length}.`);
  }
}
