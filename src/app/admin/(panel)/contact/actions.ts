"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import {
  contactSettingsResource,
  officeResource,
  socialResource,
} from "@/lib/cms/resources/contact";

/*
 * Every action authorises the session (requireAdmin), validates the id and the submitted
 * fields, writes through Drizzle and refreshes the Contact page's cache; see lib/cms/crud.ts.
 */

const OFFICES = "/admin/contact?part=office#offices";
const ONLINE = "/admin/contact?part=link#online";

/** Creates the page's settings the first time, updates them after that, and stays on the page. */
export async function saveContactSettings(_state: FormState, formData: FormData) {
  return saveResource(contactSettingsResource, null, formData, { stay: true });
}

export async function saveContactOffice(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(officeResource, id, formData, { returnTo: OFFICES });
}

export async function deleteContactOffice(id: number) {
  return deleteResource(officeResource, id, { returnTo: OFFICES });
}

export async function saveContactSocial(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(socialResource, id, formData, { returnTo: ONLINE });
}

export async function deleteContactSocial(id: number) {
  return deleteResource(socialResource, id, { returnTo: ONLINE });
}
