import type { Metadata } from "next";
import { Suspense } from "react";

import s from "@/components/partners/Partners.module.css";
import { PartnersDirectory } from "@/components/partners/PartnersDirectory";
import { PageHeader } from "@/components/ui/PageHeader";
import { partnerFigures } from "@/content/partners";
import { site } from "@/content/site";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedPartners } from "@/lib/cms/resources/partners";

export const metadata: Metadata = {
  title: "Partners & Linkages",
  description: `The universities, agencies, companies and foundations in Bhutan and around the world that the ${site.name}, ${site.university}, works with on research, teaching and student exchange.`,
};

/** The figures and the partners: read from the database at request time (Admin › Partners). */
async function Partners() {
  const result = await loadPublished("partners", getPublishedPartners);
  if (!result.ok) {
    return (
      <p className="py-16 text-copy">
        The partners cannot be shown at the moment. Please try again later.
      </p>
    );
  }
  if (result.data.length === 0) {
    return <p className="py-16 text-copy">No partners are listed at the moment.</p>;
  }
  const figures = partnerFigures(result.data);
  return (
    <>
      <ul className={s.figures} aria-label="Partners in figures">
        {[
          { value: figures.international, label: "International partners" },
          { value: figures.national, label: "National partners" },
          { value: figures.countries, label: figures.countries === 1 ? "Country" : "Countries" },
          {
            value: figures.universities,
            label: figures.universities === 1 ? "University" : "Universities",
          },
        ].map((figure) => (
          <li key={figure.label} className={s.figure}>
            <span className={s.figureValue}>{figure.value}</span>
            <span className={s.figureLabel}>{figure.label}</span>
          </li>
        ))}
      </ul>
      <PartnersDirectory partners={result.data} />
    </>
  );
}

export default function PartnersPage() {
  return (
    <div className="bg-white">
      <PageHeader
        title="Partners & Linkages"
        intro="Universities, agencies and industry in Bhutan and around the world that CST works with on research, teaching and student exchange."
      />
      <div className="container-page pb-[clamp(3rem,2rem+3vw,5rem)]">
        <Suspense fallback={<div aria-busy="true" className="min-h-[60vh]" />}>
          <Partners />
        </Suspense>
      </div>
    </div>
  );
}
