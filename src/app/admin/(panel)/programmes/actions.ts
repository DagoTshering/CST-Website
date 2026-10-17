"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { programmeResource } from "@/lib/cms/resources/programmes";

/*
 * Both actions authorise the session (requireAdmin), validate the id and the submitted fields,
 * write through Drizzle and refresh the homepage's cached academic programmes; see lib/cms/crud.ts.
 */

export async function saveProgramme(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(programmeResource, id, formData);
}

export async function deleteProgramme(id: number) {
  return deleteResource(programmeResource, id);
}
