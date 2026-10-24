"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { announcementResource } from "@/lib/cms/resources/announcements";

/*
 * Every action authorises the session (requireAdmin), validates the id and the submitted
 * fields (the content is sanitised: src/lib/rich-text.ts), writes through Drizzle and refreshes
 * the cached announcements (the homepage's and the Announcements page's); see lib/cms/crud.ts.
 * The form's button says what to do with the notice (`intent`).
 */

const SAVED: Record<string, string> = {
  draft: "Saved as a draft. It is not on the website.",
  publish: "Published. It is now on the homepage and the Announcements page.",
  update: "Changes saved and published.",
  unpublish: "Unpublished: it is a draft again, and no longer on the website.",
};

/** A new notice: saved, then back to the list. */
export async function createAnnouncement(_state: FormState, formData: FormData) {
  return saveResource(announcementResource, null, formData);
}

/** An existing notice: saved, staying on its page with a message saying what changed. */
export async function updateAnnouncement(id: number, _state: FormState, formData: FormData) {
  const result = await saveResource(announcementResource, id, formData, { stay: true });
  if (result.status !== "saved") return result;
  return { ...result, message: SAVED[String(formData.get("intent"))] ?? result.message };
}

export async function deleteAnnouncement(id: number) {
  return deleteResource(announcementResource, id);
}
