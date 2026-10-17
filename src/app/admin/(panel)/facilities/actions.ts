"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { facilityResource } from "@/lib/cms/resources/facilities";

/*
 * Both actions authorise the session (requireAdmin), validate the id and the submitted fields,
 * write through Drizzle and refresh the homepage's cached facilities; see lib/cms/crud.ts.
 */

export async function saveFacility(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(facilityResource, id, formData);
}

export async function deleteFacility(id: number) {
  return deleteResource(facilityResource, id);
}
