import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { InteractiveAccordion } from "@/components/ui/InteractiveAccordion";
import { SmartLink } from "@/components/ui/SmartLink";
import { site } from "@/content/site";
import { ADMISSION_URL, requiredDocuments, type Programme } from "@/content/programmes";

import s from "./Programmes.module.css";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "structure", label: "Programme structure" },
  { id: "entry-requirements", label: "Entry requirements" },
  { id: "careers", label: "Careers" },
  { id: "facilities", label: "Facilities" },
  { id: "learn-more", label: "Learn more" },
] as const;

const Out = () => <span aria-hidden="true">↗</span>;

/** A plain list with hairlines between items and a short brass dash before each. */
const List = ({ items }: { items: string[] }) => (
  <ul className={s.plainList}>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

/** Said plainly where the data is not there yet, rather than filled with plausible text. */
const Pending = ({ children }: { children: ReactNode }) => <p className={s.pending}>{children}</p>;

function Section({
  id,
  number,
  title,
  children,
}: {
  id: string;
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={s.section} aria-labelledby={`${id}-title`}>
      <p className={s.sectionNumber}>{number}</p>
      <h2 id={`${id}-title`} className={s.sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Structure({ programme: p }: { programme: Programme }) {
  const st = p.structure;
  return (
    <>
      {st.kind === "none" ? (
        <Pending>
          The module list for this programme is published only in the programme document
          {p.documentUrl ? " below" : ""}.
        </Pending>
      ) : (
        <>
          <p className={s.paragraph}>{st.intro ?? "Selected core modules."}</p>
          <InteractiveAccordion
            items={st.modules.map((m, i) => ({
              id: `module-${i + 1}`,
              title: m.name,
              content: (
                <p>
                  {m.description ?? "Details are in the programme document."}
                  {m.code && <span className={s.moduleCode}>{m.code}</span>}
                </p>
              ),
            }))}
          />
          {st.note && <p className={s.note}>{st.note}</p>}
        </>
      )}
      {p.documentUrl && (
        <div className={s.docBlock}>
          <div>
            <p className={s.smallCaps}>Programme document</p>
            <p className={s.docTitle}>Full curriculum and programme details</p>
          </div>
          <ButtonLink href={p.documentUrl} variant="secondary">
            Open document <Out />
          </ButtonLink>
        </div>
      )}
    </>
  );
}

/**
 * A programme's page below the hero: a sticky list of the sections (desktop), then Overview,
 * Programme structure, Entry requirements, Careers, Facilities, and a closing block pointing to
 * the department's website.
 */
export function ProgrammeSections({ programme: p }: { programme: Programme }) {
  const contact = site.contact.email;
  return (
    <div className={`container-page ${s.layout}`}>
      <nav className={s.toc} aria-label="On this page">
        <ol>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <div className={s.sections}>
        <Section id="overview" number="01" title="Overview">
          <p className={s.paragraph}>{p.summary}</p>
          <p className={s.subhead}>On completion, graduates can</p>
          <List items={p.outcomes} />
        </Section>

        <Section id="structure" number="02" title="Programme structure">
          <Structure programme={p} />
        </Section>

        <Section id="entry-requirements" number="03" title="Entry requirements">
          {p.requirements ? (
            <>
              <List items={p.requirements} />
              {p.selectionNote && <p className={s.note}>{p.selectionNote}</p>}
              {p.level === "bachelor" && (
                <p className={s.note}>
                  Documents required: {requiredDocuments}{" "}
                  <SmartLink href={ADMISSION_URL} className={s.inlineLink}>
                    Admission details and dates <Out />
                  </SmartLink>
                </p>
              )}
            </>
          ) : (
            <Pending>
              Entry requirements for this programme are not yet published. Contact the college at{" "}
              <a href={contact.href} className={s.inlineLink}>
                {contact.label}
              </a>
              .
            </Pending>
          )}
        </Section>

        <Section id="careers" number="04" title="Career opportunities">
          {p.careers ? (
            <List items={p.careers} />
          ) : (
            <Pending>Career information for this programme will be added.</Pending>
          )}
        </Section>

        <Section id="facilities" number="05" title="Main facilities">
          {p.facilities ? (
            <>
              <ul className={s.facilities}>
                {p.facilities.map((f) => (
                  <li key={f.name} className={s.facility}>
                    <span className={s.facilityName}>{f.name}</span>
                    <span className={s.facilityText}>{f.description}</span>
                  </li>
                ))}
              </ul>
              {p.departmentKey === "CEED" && (
                <p className={s.note}>
                  Shared laboratories of the Civil and Environmental Engineering Department.
                </p>
              )}
            </>
          ) : (
            <Pending>Laboratory details for this programme will be added.</Pending>
          )}
        </Section>

        <div id="learn-more" className={s.learnMore}>
          <div>
            <p className={s.smallCaps}>Learn more</p>
            <h2 className={s.learnTitle}>
              To learn more, visit the {p.departmentKey ? "departmental website" : "programme page"}
            </h2>
            <p className={s.learnText}>
              {p.departmentName
                ? `${p.departmentName}: faculty, news, research and further programme details.`
                : "Further details on the college website."}
            </p>
          </div>
          <ButtonLink href={p.departmentUrl}>
            {p.departmentKey ? "Departmental website" : "Programme page"} <Out />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
