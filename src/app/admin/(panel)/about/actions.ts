"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { aboutResource } from "@/lib/cms/resources/about";

/*
 * Both actions authorise the session (requireAdmin), validate the submitted fields, write
 * through Drizzle and refresh the homepage's cached About section; see lib/cms/crud.ts.
 */

/** Creates the section the first time, updates it after that, and stays on the page. */
export async function saveAbout(_state: FormState, formData: FormData) {
  return saveResource(aboutResource, null, formData, { stay: true });
}

export async function deleteAbout() {
  return deleteResource(aboutResource, 1);
}
