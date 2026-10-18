import { ButtonLink } from "@/components/ui/Button";
import { Plate } from "@/components/ui/Plate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { admission } from "@/content/admission";

import { Checklist } from "./Checklist";

/** What to bring: the checklist beside a photograph (Eligibility's layout, mirrored). */
export function Documents() {
  const { intro, checklist, rubCriteria } = admission.documents;

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
          <p className="mt-6 max-w-[34em] text-copy">{intro}</p>
          <Checklist items={checklist} className="mt-6" />
          <ButtonLink href={rubCriteria.href} variant="secondary" className="mt-8">
            {rubCriteria.label}
          </ButtonLink>
        </div>
        <Plate
          photo={admission.photos.office}
          fig={3}
          caption={admission.photos.office.caption}
          sizes="(min-width: 1440px) 560px, (min-width: 1024px) 45vw, 100vw"
          className="lg:col-span-6"
        />
      </div>
    </section>
  );
}
