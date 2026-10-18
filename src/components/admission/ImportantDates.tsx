import type { CSSProperties } from "react";

import { SectionHeading } from "@/components/ui/SectionHeading";
import { admission, type StepState } from "@/content/admission";

import s from "./Admission.module.css";

/** What a screen reader hears for each step's state (the markers say it visually). */
const STATE_TEXT: Record<StepState, string> = {
  done: "Completed",
  current: "In progress",
  pending: "Upcoming",
};

/** The intake's five steps on one track, across on wide screens and down on phones. */
export function ImportantDates({ states }: { states: StepState[] }) {
  return (
    <section id="dates" aria-labelledby="dates-title" className="container-page section-top">
      <SectionHeading id="dates-title" label={`${admission.intake} intake`}>
        Important dates
      </SectionHeading>

      <ol
        className={`mt-12 ${s.timeline}`}
        style={{ "--steps": admission.steps.length } as CSSProperties}
      >
        {admission.steps.map((step, i) => {
          const state = states[i];
          return (
            <li
              key={step.title}
              className={s.step}
              data-state={state}
              // two steps can share a day; only the first is announced as the current one
              aria-current={i === states.indexOf("current") ? "step" : undefined}
            >
              <span className={s.marker} aria-hidden="true" />
              <time dateTime={step.start} className={s.date}>
                {step.dateLabel}
              </time>
              <span className={s.title}>{step.title}</span>
              {state === "current" ? (
                <span className={s.now}>{STATE_TEXT.current}</span>
              ) : (
                <span className="sr-only">, {STATE_TEXT[state]}</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
