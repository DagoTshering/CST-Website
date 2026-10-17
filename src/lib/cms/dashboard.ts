import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { requireAdmin } from "@/lib/auth/dal";
import { getDb, schema } from "@/lib/db";

const { aboutSection, announcements, downloads, events, facilities, leaders, programmes } = schema;

export type CategoryKey =
  "programmes" | "facilities" | "events" | "announcements" | "leadership" | "downloads" | "about";

/** Total and published counts per content category, straight from the database. */
export async function getContentCounts() {
  await requireAdmin();
  const db = getDb();
  type ContentTable =
    | typeof facilities
    | typeof programmes
    | typeof events
    | typeof leaders
    | typeof announcements
    | typeof downloads
    | typeof aboutSection;
  const tally = (table: ContentTable) =>
    db
      .select({
        total: count(),
        published: sql<number>`count(*) filter (where ${table.status} = 'published')`.mapWith(
          Number,
        ),
      })
      .from(table)
      .then(([row]) => row);

  const [prog, fac, ev, ann, lead, down, about] = await Promise.all([
    tally(programmes),
    tally(facilities),
    tally(events),
    tally(announcements),
    tally(leaders),
    tally(downloads),
    tally(aboutSection),
  ]);
  return {
    programmes: prog,
    facilities: fac,
    events: ev,
    announcements: ann,
    leadership: lead,
    downloads: down,
    about,
  } satisfies Record<CategoryKey, { total: number; published: number }>;
}

export type RecentItem = {
  category: CategoryKey;
  id: number;
  title: string;
  status: "draft" | "published";
  updatedAt: Date;
};

/** The most recently changed content across all categories, from each row's updated_at. */
export async function getRecentlyUpdated(limit = 8): Promise<RecentItem[]> {
  await requireAdmin();
  const db = getDb();
  const latest = <C extends CategoryKey>(
    category: C,
    query: Promise<{ id: number; title: string; status: "draft" | "published"; updatedAt: Date }[]>,
  ) => query.then((rows) => rows.map((row) => ({ category, ...row })));

  const groups = await Promise.all([
    latest(
      "programmes",
      db
        .select({
          id: programmes.id,
          title: programmes.name,
          status: programmes.status,
          updatedAt: programmes.updatedAt,
        })
        .from(programmes)
        .orderBy(desc(programmes.updatedAt))
        .limit(limit),
    ),
    latest(
      "facilities",
      db
        .select({
          id: facilities.id,
          title: facilities.name,
          status: facilities.status,
          updatedAt: facilities.updatedAt,
        })
        .from(facilities)
        .orderBy(desc(facilities.updatedAt))
        .limit(limit),
    ),
    latest(
      "events",
      db
        .select({
          id: events.id,
          title: events.title,
          status: events.status,
          updatedAt: events.updatedAt,
        })
        .from(events)
        .orderBy(desc(events.updatedAt))
        .limit(limit),
    ),
    latest(
      "announcements",
      db
        .select({
          id: announcements.id,
          title: announcements.title,
          status: announcements.status,
          updatedAt: announcements.updatedAt,
        })
        .from(announcements)
        .orderBy(desc(announcements.updatedAt))
        .limit(limit),
    ),
    latest(
      "leadership",
      db
        .select({
          id: leaders.id,
          title: leaders.name,
          status: leaders.status,
          updatedAt: leaders.updatedAt,
        })
        .from(leaders)
        .orderBy(desc(leaders.updatedAt))
        .limit(limit),
    ),
    latest(
      "downloads",
      db
        .select({
          id: downloads.id,
          title: downloads.title,
          status: downloads.status,
          updatedAt: downloads.updatedAt,
        })
        .from(downloads)
        .orderBy(desc(downloads.updatedAt))
        .limit(limit),
    ),
    latest(
      "about",
      db
        .select({
          id: aboutSection.id,
          title: aboutSection.heading,
          status: aboutSection.status,
          updatedAt: aboutSection.updatedAt,
        })
        .from(aboutSection)
        .where(eq(aboutSection.id, 1)),
    ),
  ]);

  return groups
    .flat()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}
