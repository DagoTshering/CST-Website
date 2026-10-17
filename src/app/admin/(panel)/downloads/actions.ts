"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { categoryResource, downloadResource } from "@/lib/cms/resources/downloads";

/*
 * Every action authorises the session (requireAdmin), validates the id and the submitted
 * fields, writes through Drizzle and refreshes the Downloads page's cache; see lib/cms/crud.ts.
 */

export async function saveDownload(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(downloadResource, id, formData);
}

export async function deleteDownload(id: number) {
  return deleteResource(downloadResource, id);
}

export async function saveCategory(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(categoryResource, id, formData);
}

export async function deleteCategory(id: number) {
  return deleteResource(categoryResource, id);
}
