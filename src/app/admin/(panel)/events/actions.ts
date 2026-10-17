"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { eventResource } from "@/lib/cms/resources/events";

/*
 * Both actions authorise the session (requireAdmin), validate the id and the submitted fields,
 * write through Drizzle and refresh the homepage's cached events; see lib/cms/crud.ts.
 */

export async function saveEvent(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(eventResource, id, formData);
}

export async function deleteEvent(id: number) {
  return deleteResource(eventResource, id);
}
