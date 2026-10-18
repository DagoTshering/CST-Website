import { ArrowRightIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartLink } from "@/components/ui/SmartLink";
import { admission } from "@/content/admission";

/**
 * The programme's page. This page is cached whole and built without the database, so the slugs
 * are not checked here; one that is not (or no longer) a published programme is a 404.
 */
const programmeHref = (slug: string) => `/programmes/${slug}`;

/** The bachelor's programmes open to new students, each a hairline card linking to its page. */
export function ProgrammeGrid() {
  return (
    <section
      id="programmes"
      aria-labelledby="programmes-title"
      className="container-page section-top"
    >
      <SectionHeading id="programmes-title" label="Undergraduate">
        Programmes
      </SectionHeading>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {admission.programmes.map((p) => (
          <li key={p.slug}>
            <SmartLink
              href={programmeHref(p.slug)}
              className="group flex h-full flex-col rounded-sm border border-line bg-white p-6 transition-colors duration-200 hover:border-primary-strong"
            >
              <span className="eyebrow text-muted">Bachelor</span>
              <span className="mt-3 font-serif text-[1.375rem] leading-snug font-semibold text-ink transition-colors duration-200 group-hover:text-primary-strong sm:text-[1.5rem]">
                {p.name}
              </span>
              <span className="mt-2 text-small text-copy">{p.testType}</span>
              <span className="mt-auto inline-flex items-center gap-2 pt-6 font-display text-[0.9375rem] font-semibold text-primary-strong">
                View programme
                <ArrowRightIcon className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-1" />
              </span>
            </SmartLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
