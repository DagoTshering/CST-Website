import type { ReactNode } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { telHref } from "@/lib/admission";
import type { AdmissionPage } from "@/lib/cms/resources/admission";
import { cx } from "@/lib/cx";

const link = "transition-colors hover:text-primary-strong";

/**
 * The admissions office in one row of up to four hairline-separated cells (two by two, then
 * stacked); details not given are left out.
 */
export function AdmissionContact({ contact }: { contact: AdmissionPage["contact"] }) {
  const { email, phone, hours, address } = contact;
  const cells: { label: string; value: ReactNode }[] = [];
  if (email)
    cells.push({
      label: "Email",
      value: (
        <a href={`mailto:${email}`} className={`break-all ${link}`}>
          {email}
        </a>
      ),
    });
  if (phone)
    cells.push({
      label: "Phone",
      value: (
        <a href={telHref(phone)} className={link}>
          {phone}
        </a>
      ),
    });
  if (hours) cells.push({ label: "Office hours", value: hours });
  if (address) cells.push({ label: "Address", value: address });
  if (cells.length === 0) return null;

  return (
    <section
      id="contact"
      aria-labelledby="contact-title"
      className="container-page section-top pb-[clamp(4rem,3rem+3vw,6.5rem)]"
    >
      <SectionHeading id="contact-title" label="Admissions office">
        Contact admissions
      </SectionHeading>

      <dl className="mt-12 grid border-y border-line md:grid-cols-2 lg:grid-cols-4">
        {cells.map((cell, i) => (
          <div
            key={cell.label}
            className={cx(
              "border-line py-6 md:pr-6",
              // stacked: a rule above every cell but the first
              i > 0 && "border-t",
              // two by two: the right-hand column gets a rule on its left, the top row none above
              i % 2 === 1 && "md:border-l md:pl-6",
              i < 2 && "md:border-t-0",
              // one row: a rule between cells, none above
              "lg:border-t-0",
              i > 0 && "lg:border-l lg:pl-6",
            )}
          >
            <dt className="eyebrow text-muted">{cell.label}</dt>
            <dd className="mt-2 font-display text-[1.0625rem] leading-snug font-semibold text-ink">
              {cell.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
