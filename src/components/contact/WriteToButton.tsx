"use client";

import { ArrowRightIcon } from "@/components/ui/icons";

import s from "./Contact.module.css";

/** Asks the message box to address its message to this office (see WriteToUs). */
export const WRITE_EVENT = "contact:write";

export function WriteToButton({ officeId, officeName }: { officeId: string; officeName: string }) {
  return (
    <button
      type="button"
      className={s.write}
      aria-label={`Write to the ${officeName}`}
      onClick={() => window.dispatchEvent(new CustomEvent(WRITE_EVENT, { detail: officeId }))}
    >
      Write <ArrowRightIcon className="size-4" aria-hidden="true" />
    </button>
  );
}
