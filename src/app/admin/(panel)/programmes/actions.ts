"use server";

import { deleteResource, saveResource } from "@/lib/cms/crud";
import type { FormState } from "@/lib/cms/form";
import { moduleResource, programmeFacilityResource } from "@/lib/cms/resources/programme-pages";
import { programmeResource } from "@/lib/cms/resources/programmes";
import { recordId } from "@/lib/cms/validation";

/*
 * Both actions authorise the session (requireAdmin), validate the id and the submitted fields,
 * write through Drizzle and refresh the cached programmes (the homepage's list and the programme
 * pages); see lib/cms/crud.ts. A module or facility is changed only within its own programme.
 */

export async function saveProgramme(id: number | null, _state: FormState, formData: FormData) {
  return saveResource(programmeResource, id, formData);
}

export async function deleteProgramme(id: number) {
  return deleteResource(programmeResource, id);
}

// ---------------------------------------------------------------- a programme's page parts

const modulesOf = (programmeId: number) => `/admin/programmes/${programmeId}?part=module#modules`;
const facilitiesOf = (programmeId: number) =>
  `/admin/programmes/${programmeId}?part=facility#facilities`;

export async function saveModule(
  programmeId: number,
  id: number | null,
  _state: FormState,
  formData: FormData,
) {
  const programme = recordId.parse(programmeId);
  return saveResource(moduleResource(programme), id, formData, { returnTo: modulesOf(programme) });
}

export async function deleteModule(programmeId: number, id: number) {
  const programme = recordId.parse(programmeId);
  return deleteResource(moduleResource(programme), id, { returnTo: modulesOf(programme) });
}

export async function saveProgrammeFacility(
  programmeId: number,
  id: number | null,
  _state: FormState,
  formData: FormData,
) {
  const programme = recordId.parse(programmeId);
  return saveResource(programmeFacilityResource(programme), id, formData, {
    returnTo: facilitiesOf(programme),
  });
}

export async function deleteProgrammeFacility(programmeId: number, id: number) {
  const programme = recordId.parse(programmeId);
  return deleteResource(programmeFacilityResource(programme), id, {
    returnTo: facilitiesOf(programme),
  });
}
