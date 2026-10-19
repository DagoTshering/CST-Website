import { ArrowRight } from "lucide-react";

import { about } from "@/lib/about";

import s from "./About.module.css";
import { CountUp } from "./CountUp";
import { SectionHead } from "./SectionHead";

/** Programmes (counting up), the planned PhD, and the college's services. */
export function Offer() {
  const { undergraduate, postgraduate, planned } = about.numbers;
  // "PhD in Engineering": the degree as the figure, the rest under it
  const [degree, ...field] = planned.split(" ");
  return (
    <section className="container-page section-top" aria-labelledby="offer-title">
      <SectionHead
        id="offer-title"
        eyebrow="What we offer"
        title="Programmes, training and research"
      >
        {about.paragraphs[2]}
      </SectionHead>

      <ul className={s.figures} data-reveal suppressHydrationWarning>
        <li className={s.figure}>
          <span className={s.figureValue}>
            <CountUp value={undergraduate} />
          </span>
          <span className={s.figureLabel}>Undergraduate programmes</span>
        </li>
        <li className={s.figure}>
          <span className={s.figureValue}>
            <CountUp value={postgraduate} />
          </span>
          <span className={s.figureLabel}>Postgraduate programmes</span>
        </li>
        <li className={s.figure}>
          <span className={s.figureValue}>{degree}</span>
          <span className={s.figureLabel}>
            {field.length ? `${field.join(" ")}, planned` : "Planned"}
          </span>
        </li>
      </ul>

      <ul className={s.services} aria-label="Services" data-reveal suppressHydrationWarning>
        {about.services.map((service) => (
          <li key={service} className={s.service}>
            {service}
            <ArrowRight strokeWidth={1.5} aria-hidden="true" />
          </li>
        ))}
      </ul>
    </section>
  );
}
