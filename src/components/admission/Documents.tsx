import { ButtonLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { AdmissionPage } from "@/lib/cms/resources/admission";

import { Checklist } from "./Checklist";

/** What to bring: the checklist beside a photograph (Eligibility's layout, mirrored). */
export function Documents({
  documents,
  fig,
}: {
  documents: AdmissionPage["documents"];
  /** Its photo's figure number: the page's captioned photos are numbered in order. */
  fig: number;
}) {
  const { intro, checklist, criteria, photo, caption } = documents;
  if (checklist.length === 0 && !intro) return null;

  return (
    <section
      id="documents"
      aria-labelledby="documents-title"
      className="container-page section-top"
    >
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="lg:col-span-6">
          <SectionHeading id="documents-title" label="What to bring">
            Documents
          </SectionHeading>
          {intro && <p className="mt-6 max-w-[34em] text-copy">{intro}</p>}
          {checklist.length > 0 && <Checklist items={checklist} className="mt-6" />}
          {criteria && (
            <ButtonLink href={criteria.href} variant="secondary" className="mt-8">
              {criteria.label}
            </ButtonLink>
          )}
        </div>
        {photo && (
          <Plate
            photo={photo}
            fig={fig}
            caption={caption ?? ""}
            sizes="(min-width: 1440px) 560px, (min-width: 1024px) 45vw, 100vw"
            className="lg:col-span-6"
          />
        )}
      </div>
    </section>
  );
}
