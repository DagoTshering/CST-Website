"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { vacancyResource } from "@/lib/cms/resources/vacancies";

/*
 * Every action authorises the session (requireAdmin), validates the id and the submitted
 * fields (the content is sanitised: src/lib/rich-text.ts), writes through Drizzle and refreshes
 * the Vacancies page's cache; see lib/cms/crud.ts. The form's button says what to do with the
 * post (`intent`: draft, publish, update or unpublish).
 */

const SAVED: Record<string, string> = {
  draft: "Saved as a draft. It is not on the Vacancies page.",
  publish: "Published. It is now on the Vacancies page.",
  update: "Changes saved and published.",
  unpublish: "Unpublished: it is a draft again, and no longer on the Vacancies page.",
};

/** A new post: saved, then back to the list. */
export async function createVacancy(_state: FormState, formData: FormData) {
  return saveResource(vacancyResource, null, formData);
}

/** An existing post: saved, staying on its page with a message saying what changed. */
export async function updateVacancy(id: number, _state: FormState, formData: FormData) {
  const result = await saveResource(vacancyResource, id, formData, { stay: true });
  if (result.status !== "saved") return result;
  return { ...result, message: SAVED[String(formData.get("intent"))] ?? result.message };
}

export async function deleteVacancy(id: number) {
  return deleteResource(vacancyResource, id);
}
