import { ArrowRight } from "lucide-react";

import { Emphasised } from "@/components/ui/Emphasis";
import type { AboutPageContent } from "@/lib/cms/resources/about-page";

import s from "./About.module.css";
import { CountUp } from "./CountUp";
import { SectionHead } from "./SectionHead";

/**
 * The programmes (counting up; counted from Academic Programmes), a planned programme, and the
 * college's services.
 */
export function Offer({ content }: { content: AboutPageContent["offer"] }) {
  const { undergraduate, postgraduate, planned } = content;
  // "PhD in Engineering": the degree as the figure, the rest under it
  const [degree, ...field] = planned?.split(" ") ?? [];
  return (
    <section className="container-page section-top" aria-labelledby="offer-title">
      <SectionHead
        id="offer-title"
        eyebrow="What we offer"
        title={<Emphasised text={content.heading} word={content.emphasis ?? ""} />}
      >
        {content.text}
      </SectionHead>

      <ul className={s.figures} data-reveal suppressHydrationWarning>
        <li className={s.figure}>
          <span className={s.figureValue}>
            <CountUp value={undergraduate} />
          </span>
          <span className={s.figureLabel}>
            Undergraduate programme{undergraduate === 1 ? "" : "s"}
          </span>
        </li>
        <li className={s.figure}>
          <span className={s.figureValue}>
            <CountUp value={postgraduate} />
          </span>
          <span className={s.figureLabel}>
            Postgraduate programme{postgraduate === 1 ? "" : "s"}
          </span>
        </li>
        {degree && (
          <li className={s.figure}>
            <span className={s.figureValue}>{degree}</span>
            <span className={s.figureLabel}>
              {field.length ? `${field.join(" ")}, planned` : "Planned"}
            </span>
          </li>
        )}
      </ul>

      {content.services.length > 0 && (
        <ul className={s.services} aria-label="Services" data-reveal suppressHydrationWarning>
          {content.services.map((service) => (
            <li key={service} className={s.service}>
              {service}
              <ArrowRight strokeWidth={1.5} aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
