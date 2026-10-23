/**
 * The Vacancies page's recruitment categories: job recruitment notices only. (General college
 * announcements are a separate feature with their own categories.) Shared by the admin panel and
 * the public pages; `param` is the category in the listing's address (?category=shortlist).
 */
export const VACANCY_CATEGORIES = [
  { value: "job_vacancy", param: "vacancy", label: "Job vacancy", plural: "Job vacancies" },
  {
    value: "recruitment_notice",
    param: "notice",
    label: "Recruitment notice",
    plural: "Recruitment notices",
  },
  { value: "shortlist", param: "shortlist", label: "Shortlist", plural: "Shortlists" },
  {
    value: "interview_schedule",
    param: "interview",
    label: "Interview schedule",
    plural: "Interview schedules",
  },
  {
    value: "examination_result",
    param: "result",
    label: "Recruitment examination result",
    plural: "Examination results",
  },
  {
    value: "final_selection",
    param: "selection",
    label: "Final selection",
    plural: "Final selections",
  },
  { value: "other", param: "other", label: "Other recruitment notice", plural: "Other notices" },
] as const;

export type VacancyCategory = (typeof VACANCY_CATEGORIES)[number]["value"];

export const vacancyCategoryLabel = (value: string) =>
  VACANCY_CATEGORIES.find((c) => c.value === value)?.label ?? value;

/** "Lecturer (Civil) – Shortlist 2026" -> "lecturer-civil-shortlist-2026" */
export const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/, "");

/** A publication date as the pages show it: "23 Oct 2026" (Bhutan time). */
export const formatVacancyDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Thimphu",
  }).format(date);
