import Image from "next/image";
import type { CSSProperties } from "react";

import { Button, ButtonLink } from "@/components/ui/Button";
import { applicationWindow, dateRangeLabel, type AdmissionStatus } from "@/lib/admission";
import type { AdmissionPage } from "@/lib/cms/resources/admission";

import s from "./Admission.module.css";

type Copy = {
  label: string;
  blockLabel: string;
  blockValue: string;
  /** The state's colour: closed red, open green, upcoming amber (text, rule, block edge). */
  tone: { text: string; rule: string; edge: string };
};

/** The hero's wording and colour for each state. */
function copyFor(status: AdmissionStatus, page: AdmissionPage): Copy {
  const window = applicationWindow(page.steps);
  const label = (step: { start: string; end: string } | undefined) =>
    step ? dateRangeLabel(step.start, step.end) : "To be announced";
  if (status === "closed")
    return {
      label: `Admission closed for ${page.intake}`,
      blockLabel: "Next intake",
      blockValue: page.nextIntakeNote ?? "To be announced",
      tone: { text: "text-danger", rule: "bg-danger", edge: "border-l-danger" },
    };
  if (status === "open")
    return {
      label: "Applications open",
      blockLabel: "Applications close",
      blockValue: label(window?.closing),
      tone: { text: "text-success", rule: "bg-success", edge: "border-l-success" },
    };
  return {
    label: "Opening soon",
    blockLabel: "Applications open",
    blockValue: label(window?.opening),
    tone: { text: "text-warning", rule: "bg-warning", edge: "border-l-warning" },
  };
}

/**
 * The one action: contact (closed), apply (open), or apply greyed out until the opening date.
 * While open without an application form set, contact.
 */
function Action({ status, applyUrl }: { status: AdmissionStatus; applyUrl: string | null }) {
  const fit = "shrink-0 whitespace-nowrap";
  if (status === "closed" || (status === "open" && !applyUrl))
    return (
      <ButtonLink href="#contact" className={fit}>
        Contact admissions
      </ButtonLink>
    );
  if (status === "open")
    return (
      <ButtonLink href={applyUrl!} className={fit}>
        Apply online
      </ButtonLink>
    );
  return (
    <Button disabled aria-describedby="admission-opens" className={fit}>
      Apply online
    </Button>
  );
}

/**
 * The top of the page: the state of admission as a plain label after a short drafting rule,
 * the h1, a two-line introduction and a hairline block with the next date and one action; on
 * the right, a photograph filling the column (when there is one), its bottom edge cut at an angle,
 * over a dot grid.
 */
export function AdmissionHero({ status, page }: { status: AdmissionStatus; page: AdmissionPage }) {
  const copy = copyFor(status, page);
  const hero = page.heroPhoto;

  return (
    <header className="container-page pt-[clamp(2rem,1.25rem+2vw,3.25rem)]">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-stretch lg:gap-16">
        <div className="lg:col-span-6 lg:py-10">
          <p
            data-reveal
            suppressHydrationWarning
            className={`eyebrow flex items-center gap-3 ${copy.tone.text}`}
          >
            <span
              aria-hidden="true"
              data-reveal="rule"
              suppressHydrationWarning
              className={`block h-0.5 w-10 shrink-0 ${copy.tone.rule}`}
            />
            {copy.label}
          </p>
          <h1
            data-reveal
            suppressHydrationWarning
            style={{ "--reveal-delay": "80ms" } as CSSProperties}
            className="mt-5 heading-serif text-ink"
          >
            Admission for new students
          </h1>
          <p
            data-reveal
            suppressHydrationWarning
            style={{ "--reveal-delay": "160ms" } as CSSProperties}
            className="mt-6 max-w-[34em] text-lead text-copy"
          >
            {page.intro}
          </p>

          <div
            data-reveal
            suppressHydrationWarning
            style={{ "--reveal-delay": "240ms" } as CSSProperties}
            className={`mt-10 flex max-w-xl flex-col gap-5 rounded-sm border border-l-[3px] border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6 ${copy.tone.edge}`}
          >
            <div>
              <p className="eyebrow text-muted">{copy.blockLabel}</p>
              <p className="mt-1.5 font-display text-h4 font-semibold text-ink">
                {copy.blockValue}
              </p>
              {status === "upcoming" && (
                <p id="admission-opens" className="mt-1 text-small text-muted">
                  The online form becomes available on that day.
                </p>
              )}
            </div>
            <Action status={status} applyUrl={page.applyUrl} />
          </div>
        </div>

        {hero && (
          <div className="lg:col-span-6">
            <div className={s.figure}>
              <span className={s.dots} aria-hidden="true" />
              <div data-reveal="photo" suppressHydrationWarning className={s.photo}>
                <Image
                  src={hero.src}
                  alt={hero.alt}
                  fill
                  preload
                  sizes="(min-width: 1440px) 560px, (min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
