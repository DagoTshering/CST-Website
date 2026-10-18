import type { Metadata } from "next";
import { cacheLife } from "next/cache";

import { AdmissionContact } from "@/components/admission/AdmissionContact";
import { AdmissionFaq } from "@/components/admission/AdmissionFaq";
import { AdmissionHero } from "@/components/admission/AdmissionHero";
import { Documents } from "@/components/admission/Documents";
import { Eligibility } from "@/components/admission/Eligibility";
import { ImportantDates } from "@/components/admission/ImportantDates";
import { ProgrammeGrid } from "@/components/admission/ProgrammeGrid";
import { admission, admissionStatus, bhutanToday, stepStates } from "@/content/admission";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Admission for New Students",
  description: `How to apply for a bachelor's programme at the ${site.name}, ${site.university}: the ${admission.intake} intake dates, eligibility, the selection test, required documents and the admissions office.`,
};

/**
 * Admission for new students. The page is prerendered and cached for an hour at a time: its
 * state (upcoming, open or closed) follows today's date, so it is worked out again at most an
 * hour after a date in src/content/admission.ts passes.
 */
export default async function AdmissionsPage() {
  "use cache";
  cacheLife("hours");

  const today = bhutanToday();
  const status = admissionStatus(today);

  return (
    <div className="bg-white">
      <AdmissionHero status={status} />
      <ImportantDates states={stepStates(status, today)} />
      <ProgrammeGrid />
      <Eligibility />
      <Documents />
      <AdmissionFaq status={status} />
      <AdmissionContact />
    </div>
  );
}
