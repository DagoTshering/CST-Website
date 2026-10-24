"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { partnerResource } from "@/lib/cms/resources/partners";

/*
 * Both actions authorise the session (requireAdmin), validate the id and the submitted fields,
 * write through Drizzle and refresh the Partners page's cache; see lib/cms/crud.ts.
 */

export async function savePartner(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(partnerResource, id, formData);
}

export async function deletePartner(id: number) {
  return deleteResource(partnerResource, id);
}
