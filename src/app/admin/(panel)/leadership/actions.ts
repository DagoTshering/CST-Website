"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { leaderResource } from "@/lib/cms/resources/leaders";

/*
 * Both actions authorise the session (requireAdmin), validate the id and the submitted fields,
 * write through Drizzle and refresh the homepage's cached leadership & governance; see lib/cms/crud.ts.
 */

export async function saveLeader(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(leaderResource, id, formData);
}

export async function deleteLeader(id: number) {
  return deleteResource(leaderResource, id);
}
