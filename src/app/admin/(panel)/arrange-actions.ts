"use server";

import { saveArrangement, type OrderingKey } from "@/lib/cms/ordering";

/**
 * Saves the order set on an Arrange screen. The list and group are bound by the page, but come
 * back from the browser, so saveArrangement checks the session, the list, the group and the ids.
 */
export async function arrange(list: OrderingKey, group: string, ids: number[]) {
  return saveArrangement(list, group, ids);
}
