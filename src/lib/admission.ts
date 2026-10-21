/**
 * The Admission for new students page's state, worked out from its content (Admin › Admissions):
 * upcoming before the application window, open while it lasts, closed after it, unless an
 * administrator pins it. The window is the step marked as opening applications and the one
 * marked as closing them. Pure functions: the page passes in today's date in Bhutan.
 */

export type AdmissionStatus = "upcoming" | "open" | "closed";

export type StepState = "done" | "current" | "pending";

export type AdmissionStep = {
  title: string;
  /** ISO dates (YYYY-MM-DD), both inclusive; the same date for a one-day step. */
  start: string;
  end: string;
  mark: "opens" | "closes" | null;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Today in Bhutan (UTC+6), as YYYY-MM-DD, so ISO dates compare as strings. */
export function bhutanToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Thimphu" }).format(now);
}

/** "2026-04-18", "2026-04-19" -> "18–19 Apr 2026"; across months or years, both in full. */
export function dateRangeLabel(start: string, end: string) {
  const [y1, m1, d1] = start.split("-").map(Number);
  const [y2, m2, d2] = end.split("-").map(Number);
  const day = (d: number, m: number) => `${d} ${MONTHS[m - 1]}`;
  if (start === end) return `${day(d1, m1)} ${y1}`;
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MONTHS[m1 - 1]} ${y1}`;
  if (y1 === y2) return `${day(d1, m1)} – ${day(d2, m2)} ${y1}`;
  return `${day(d1, m1)} ${y1} – ${day(d2, m2)} ${y2}`;
}

/** The steps that bound the application window (the first step stands in for a missing one). */
export function applicationWindow(steps: AdmissionStep[]) {
  if (steps.length === 0) return null;
  return {
    opening: steps.find((s) => s.mark === "opens") ?? steps[0],
    closing: steps.find((s) => s.mark === "closes") ?? steps[0],
  };
}

/** Upcoming before the window opens, open while it lasts, closed after it (or with no dates). */
export function admissionStatus(
  steps: AdmissionStep[],
  override: AdmissionStatus | null,
  today: string,
): AdmissionStatus {
  if (override) return override;
  const window = applicationWindow(steps);
  if (!window) return "closed";
  if (today < window.opening.start) return "upcoming";
  if (today <= window.closing.end) return "open";
  return "closed";
}

/**
 * Each step's state for the timeline: done once its last day has passed, current on its days,
 * pending before. Upcoming shows every step pending. Closed follows the dates, so between the
 * window closing and the results the later steps still show as ahead, and once the results are
 * out every step is done (a manual close marks them all done at once). While applications are
 * open and no step falls on today (between the opening and closing days, or a manual "open"
 * outside the dates), the closing step is the one highlighted.
 */
export function stepStates(
  steps: AdmissionStep[],
  status: AdmissionStatus,
  override: AdmissionStatus | null,
  today: string,
): StepState[] {
  if (status === "upcoming") return steps.map(() => "pending");
  if (status === "closed" && override === "closed") return steps.map(() => "done");

  const states = steps.map((s): StepState =>
    s.end < today ? "done" : s.start <= today ? "current" : "pending",
  );
  const window = applicationWindow(steps);
  if (status === "open" && window && !states.includes("current")) {
    const at = steps.indexOf(window.closing);
    return steps.map((_, i) => (i < at ? "done" : i === at ? "current" : "pending"));
  }
  return states;
}

/** The next-intake note inside a sentence: "expected March 2027, to be confirmed". */
export function inSentence(note: string) {
  return note.charAt(0).toLowerCase() + note.slice(1);
}

/** The sentence about when to apply, for the page's state ({applyWindow} in an FAQ answer). */
export function applyWindowSentence(
  status: AdmissionStatus,
  steps: AdmissionStep[],
  intake: string,
  nextIntakeNote: string | null,
) {
  const window = applicationWindow(steps);
  const opens = window && dateRangeLabel(window.opening.start, window.opening.end);
  const closes = window && dateRangeLabel(window.closing.start, window.closing.end);
  if (status === "upcoming") {
    return opens
      ? `Applications for the ${intake} intake open on ${opens} and close on ${closes}. You apply online.`
      : `Applications for the ${intake} intake open soon. You apply online.`;
  }
  if (status === "open") {
    return `Applications for the ${intake} intake are open now${closes ? ` and close on ${closes}` : ""}. You apply online, through the link at the top of this page.`;
  }
  const next = nextIntakeNote ? ` Next intake: ${inSentence(nextIntakeNote)}.` : "";
  return opens
    ? `Applications for the ${intake} intake ran from ${opens} to ${closes} and have closed.${next}`
    : `Applications for the ${intake} intake have closed.${next}`;
}

/** The placeholders an FAQ answer may use, as the admin form lists them. */
export const FAQ_PLACEHOLDERS = [
  "{email}",
  "{phone}",
  "{hours}",
  "{intake}",
  "{nextIntake}",
  "{applyWindow}",
] as const;

/** An FAQ answer with its {placeholders} filled in; an unknown one is left as written. */
export function fillPlaceholders(answer: string, values: Record<string, string | null>) {
  return answer.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** A phone number as a tel: link ("+975 5 252 207" -> "tel:+9755252207"). */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
