import { SectionHeading } from "@/components/ui/SectionHeading";
import { telHref, type Office } from "@/lib/contact";

import s from "./Contact.module.css";
import { WriteToButton } from "./WriteToButton";

/**
 * Every office with its email and phone, as rows of a list. "Write" addresses the message box
 * below to that office. Without an email or a phone the row says so.
 */
export function Directory({ offices }: { offices: Office[] }) {
  return (
    <section aria-labelledby="directory-title" className="section-top">
      <SectionHeading id="directory-title" label="Directory">
        Who to contact
      </SectionHeading>
      <p className={s.sectionIntro}>
        Choose the office closest to your question. &ldquo;Write&rdquo; fills in the message box
        below.
      </p>

      <ul className={s.offices}>
        {offices.map((office) => (
          <li key={office.id} className={s.office}>
            <p className={s.officeName}>{office.name}</p>
            <p>
              {office.email ? (
                <a href={`mailto:${office.email}`} className={s.link}>
                  {office.email}
                </a>
              ) : (
                <span className={s.muted}>No email listed</span>
              )}
            </p>
            <p>
              {office.phone ? (
                <a href={telHref(office.phone)} className={s.link}>
                  {office.phone}
                </a>
              ) : (
                <span className={s.muted}>No phone listed</span>
              )}
            </p>
            <p className={s.officeAction}>
              {office.email && (
                <WriteToButton officeId={String(office.id)} officeName={office.name} />
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
