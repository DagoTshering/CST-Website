"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { announcementResource } from "@/lib/cms/resources/announcements";

/*
 * Both actions authorise the session (requireAdmin), validate the id and the submitted fields,
 * write through Drizzle and refresh the homepage's cached announcements; see lib/cms/crud.ts.
 */

export async function saveAnnouncement(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(announcementResource, id, formData);
}

export async function deleteAnnouncement(id: number) {
  return deleteResource(announcementResource, id);
}
