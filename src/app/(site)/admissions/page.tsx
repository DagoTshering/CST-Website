import type { Metadata } from "next";
import { Suspense } from "react";

import { AdmissionContact } from "@/components/admission/AdmissionContact";
import { AdmissionFaq } from "@/components/admission/AdmissionFaq";
import { AdmissionHero } from "@/components/admission/AdmissionHero";
import { Documents } from "@/components/admission/Documents";
import { Eligibility } from "@/components/admission/Eligibility";
import { ImportantDates } from "@/components/admission/ImportantDates";
import { ProgrammeGrid } from "@/components/admission/ProgrammeGrid";
import { site } from "@/content/site";
import { admissionStatus, applyWindowSentence, bhutanToday, stepStates } from "@/lib/admission";
import { loadPublished } from "@/lib/cms/public";
import { getAdmissionPage } from "@/lib/cms/resources/admission";

export const metadata: Metadata = {
  title: "Admission for New Students",
  description: `How to apply for a bachelor's programme at the ${site.name}, ${site.university}: the intake's dates, eligibility, the selection test, required documents and the admissions office.`,
};

/**
 * The page's content (Admin › Admissions), read through a cached query the admin panel refreshes
 * on every change. Its state (upcoming, open or closed) is worked out for each request from
 * today's date in Bhutan, so it changes on the day a date passes.
 */
async function Content() {
  const result = await loadPublished("Admissions page", getAdmissionPage);
  if (!result.ok || !result.data) {
    return (
      <div className="container-page py-16">
        <h1 className="heading-serif text-ink">Admission for new students</h1>
        <p className="mt-6 text-copy">
          {result.ok
            ? "Admission details for the next intake are being prepared. Please check back soon."
            : "This page cannot be shown at the moment. Please try again later."}
        </p>
      </div>
    );
  }
  const page = result.data;
  const today = bhutanToday();
  const status = admissionStatus(page.steps, page.statusOverride, today);
  const values = {
    email: page.contact.email,
    phone: page.contact.phone,
    hours: page.contact.hours,
    intake: page.intake,
    nextIntake: page.nextIntakeNote,
    applyWindow: applyWindowSentence(status, page.steps, page.intake, page.nextIntakeNote),
  };

  return (
    <>
      <AdmissionHero status={status} page={page} />
      <ImportantDates
        intake={page.intake}
        steps={page.steps}
        states={stepStates(page.steps, status, page.statusOverride, today)}
      />
      <ProgrammeGrid programmes={page.programmes} />
      <Eligibility eligibility={page.eligibility} />
      {/* the captioned photos are numbered in order: Eligibility's (Fig. 01), then this one */}
      <Documents documents={page.documents} fig={page.eligibility.photo ? 2 : 1} />
      <AdmissionFaq faqs={page.faqs} values={values} />
      <AdmissionContact contact={page.contact} />
    </>
  );
}

/** Admission for new students (replacing cst.edu.bt/admission-for-new-students). */
export default function AdmissionsPage() {
  return (
    <div className="bg-white">
      <Suspense fallback={<div aria-busy="true" className="container-page min-h-[90vh]" />}>
        <Content />
      </Suspense>
    </div>
  );
}
