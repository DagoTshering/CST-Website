"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { importantLinkResource } from "@/lib/cms/resources/important-links";

/*
 * Every action authorises the session (requireAdmin), validates the id and the submitted
 * fields, writes through Drizzle and refreshes the menu's cached links; see lib/cms/crud.ts.
 */

export async function saveImportantLink(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(importantLinkResource, id, formData);
}

export async function deleteImportantLink(id: number) {
  return deleteResource(importantLinkResource, id);
}
