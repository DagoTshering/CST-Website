"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { departmentResource, designationResource, staffResource } from "@/lib/cms/resources/staff";

/*
 * Every action authorises the session (requireAdmin), validates the id and the submitted
 * fields, writes through Drizzle and refreshes the staff directory's cache; see lib/cms/crud.ts.
 */

export async function saveStaff(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(staffResource, id, formData);
}

export async function deleteStaff(id: number) {
  return deleteResource(staffResource, id);
}

export async function saveDepartment(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(departmentResource, id, formData);
}

export async function deleteDepartment(id: number) {
  return deleteResource(departmentResource, id);
}

export async function saveDesignation(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(designationResource, id, formData);
}

export async function deleteDesignation(id: number) {
  return deleteResource(designationResource, id);
}
