"use client";

import type { FormState } from "@/lib/cms/form";
import { VACANCY_CATEGORIES } from "@/lib/vacancies";

import { RichPostForm, type PostField, type PostFormInitial } from "./RichPostForm";

export type VacancyFormInitial = PostFormInitial;

const FIELDS: PostField[] = [
  {
    kind: "text",
    name: "title",
    label: "Title",
    required: true,
    maxLength: 300,
    placeholder: "Shortlist for the Post of Assistant Professor",
  },
  {
    kind: "select",
    name: "category",
    label: "Recruitment category",
    required: true,
    width: "half",
    options: VACANCY_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
  },
  {
    kind: "text",
    name: "slug",
    label: "Web address",
    maxLength: 160,
    width: "half",
    placeholder: "made from the title",
    help: "The page is /vacancies/<this>. Left empty, it is made from the title. If you change it, the old address keeps working: it redirects to the new one.",
  },
];

const LABELS = Object.fromEntries(VACANCY_CATEGORIES.map((c) => [c.value, c.label]));

/** Creating or editing a vacancy post (job recruitment notices only); see RichPostForm. */
export function VacancyForm(props: {
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  initial: VacancyFormInitial;
  cancelHref: string;
}) {
  return (
    <RichPostForm
      {...props}
      fields={FIELDS}
      section={{
        kind: "vacancy post",
        pageName: "Vacancies page",
        publicBase: "/vacancies",
        adminBase: "/admin/vacancies",
      }}
      pdf={{
        label: "Official notice (PDF)",
        help: "Optional. The signed notice, for visitors to download. PDF, up to 100 MB.",
      }}
      categoryLabels={LABELS}
    />
  );
}
