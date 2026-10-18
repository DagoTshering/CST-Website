import { pgEnum } from "drizzle-orm/pg-core";

/*
 * Enums shared by several schema files. Kept apart so those files can refer to each other's
 * tables (always lazily, in references) without depending on each other at load time.
 */

/** Every piece of website content is a draft or published; the public site reads published. */
export const contentStatus = pgEnum("content_status", ["draft", "published"]);
export const programmeLevel = pgEnum("programme_level", ["undergraduate", "postgraduate"]);

export type ContentStatus = (typeof contentStatus.enumValues)[number];
export type ProgrammeLevel = (typeof programmeLevel.enumValues)[number];
