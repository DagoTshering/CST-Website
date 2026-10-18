"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { executiveResource } from "@/lib/cms/resources/executives";

/*
 * Both actions authorise the session (requireAdmin), validate the id and the submitted fields,
 * write through Drizzle and refresh the Executives page and the homepage; see lib/cms/crud.ts.
 */

export async function saveExecutive(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(executiveResource, id, formData);
}

export async function deleteExecutive(id: number) {
  return deleteResource(executiveResource, id);
}
