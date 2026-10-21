import { ChevronDownIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SmartLink } from "@/components/ui/SmartLink";
import { fillPlaceholders } from "@/lib/admission";
import type { AdmissionPage } from "@/lib/cms/resources/admission";

/**
 * Questions and answers as native disclosures (<details>): keyboard and screen-reader support
 * come with the element, and no client JavaScript is needed. The answers' {placeholders} are
 * filled in from `values` (the contact details, and {applyWindow} from the dates and the state),
 * so "When can I apply?" always matches the dates above.
 */
export function AdmissionFaq({
  faqs,
  values,
}: {
  faqs: AdmissionPage["faqs"];
  values: Record<string, string | null>;
}) {
  if (faqs.length === 0) return null;
  return (
    <section id="faq" aria-labelledby="faq-title" className="container-page section-top">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <SectionHeading id="faq-title" label="Questions" className="lg:col-span-4">
          Frequently asked questions
        </SectionHeading>

        <div className="border-t border-line lg:col-span-8">
          {faqs.map((item) => (
            <details key={item.id} className="group border-b border-line">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 py-4 [&::-webkit-details-marker]:hidden [&:hover_h3]:text-primary-strong">
                <h3 className="text-h4 transition-colors">{item.question}</h3>
                <ChevronDownIcon className="size-5 shrink-0 text-muted transition-transform duration-300 ease-out-soft group-open:rotate-180" />
              </summary>
              <div className="max-w-[40em] pb-6 text-copy">
                <p>{fillPlaceholders(item.answer, values)}</p>
                {item.link && (
                  <SmartLink
                    href={item.link.href}
                    className="mt-3 inline-block font-display text-[0.9375rem] font-semibold text-primary-strong underline-offset-4 hover:text-primary-deep hover:underline"
                  >
                    {item.link.label}
                  </SmartLink>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
