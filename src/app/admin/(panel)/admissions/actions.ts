"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import {
  faqResource,
  settingsResource,
  stepResource,
  stepTypeResource,
  trackResource,
} from "@/lib/cms/resources/admission";

/*
 * Every action authorises the session (requireAdmin), validates the id and the submitted
 * fields, writes through Drizzle and refreshes the Admissions page's cache; see lib/cms/crud.ts.
 */

const DATES = "/admin/admissions?part=date#dates";
const REQUIREMENTS = "/admin/admissions?part=requirements#requirements";
const FAQ = "/admin/admissions?part=question#faq";

/** Creates the page's settings the first time, updates them after that, and stays on the page. */
export async function saveAdmissionSettings(_state: FormState, formData: FormData) {
  return saveResource(settingsResource, null, formData, { stay: true });
}

export async function saveAdmissionStep(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(stepResource, id, formData, { returnTo: DATES });
}

export async function deleteAdmissionStep(id: number) {
  return deleteResource(stepResource, id, { returnTo: DATES });
}

export async function saveAdmissionTrack(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(trackResource, id, formData, { returnTo: REQUIREMENTS });
}

export async function deleteAdmissionTrack(id: number) {
  return deleteResource(trackResource, id, { returnTo: REQUIREMENTS });
}

export async function saveAdmissionFaq(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(faqResource, id, formData, { returnTo: FAQ });
}

export async function deleteAdmissionFaq(id: number) {
  return deleteResource(faqResource, id, { returnTo: FAQ });
}

export async function saveAdmissionStepType(
  id: number | null,
  _state: FormState,
  formData: FormData,
) {
  return saveResource(stepTypeResource, id, formData);
}

export async function deleteAdmissionStepType(id: number) {
  return deleteResource(stepTypeResource, id);
}
