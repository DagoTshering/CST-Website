"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { centreResource, nameResource, pageResource } from "@/lib/cms/resources/about-page";

/*
 * Every action authorises the session (requireAdmin), validates the id and the submitted
 * fields, writes through Drizzle and refreshes the About page's cache; see lib/cms/crud.ts.
 */

const NAMES = "/admin/about-page?part=name#names";
const CENTRES = "/admin/about-page?part=centre#centres";

/** Creates the page's text the first time, updates it after that, and stays on the page. */
export async function saveAboutPage(_state: FormState, formData: FormData) {
  return saveResource(pageResource, null, formData, { stay: true });
}

export async function saveCollegeName(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(nameResource, id, formData, { returnTo: NAMES });
}

export async function deleteCollegeName(id: number) {
  return deleteResource(nameResource, id, { returnTo: NAMES });
}

export async function saveCentre(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(centreResource, id, formData, { returnTo: CENTRES });
}

export async function deleteCentre(id: number) {
  return deleteResource(centreResource, id, { returnTo: CENTRES });
}
