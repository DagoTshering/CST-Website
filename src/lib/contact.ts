/**
 * The Contact page (/contact): its shapes and helpers. The content is managed under
 * Admin → Contact (src/lib/cms/resources/contact.ts); data/contact.json, the old page's extract,
 * only seeds it.
 *
 * Settled with the web team (18 Oct 2026): no LinkedIn link (the old page linked another
 * institution's); the President's and Deans' phone numbers stay public; the feedback portal (a
 * Google Form whose responses go to the President) is linked from the footer only. Open: whether messages should reach a
 * mailbox (the page only opens the visitor's email app); whether the open-now line should know
 * about public holidays.
 */

/** The office's hours are always in Bhutan time, whatever the visitor's own. */
export const CONTACT_TIMEZONE = "Asia/Thimphu";

export type Hours = {
  /** An IANA time zone; the open-now line is worked out in it, not the visitor's. */
  timezone: string;
  /** Days open, 0 = Sunday. */
  days: number[];
  /** "HH:MM", 24-hour. */
  open: string;
  close: string;
};

export type Office = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
};

/** "(+975) 17160538" -> "tel:+97517160538". */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// The week as people read it here: Monday first.
const WEEK = [1, 2, 3, 4, 5, 6, 0];

/** Days as short ranges, Monday first: [1,2,3,4,5] -> "Mon to Fri", [6,0] -> "Sat and Sun". */
export function dayRanges(days: number[]): string {
  const runs: number[][] = [];
  for (const day of WEEK.filter((d) => days.includes(d))) {
    const run = runs.at(-1);
    if (run && WEEK.indexOf(run.at(-1)!) + 1 === WEEK.indexOf(day)) run.push(day);
    else runs.push([day]);
  }
  return runs
    .map((run) => {
      const [first, last] = [SHORT_DAYS[run[0]], SHORT_DAYS[run.at(-1)!]];
      if (run.length === 1) return first;
      return run.length === 2 ? `${first} and ${last}` : `${first} to ${last}`;
    })
    .join(", ");
}

/** The days the office is closed. */
export const closedDays = (days: number[]) => WEEK.filter((d) => !days.includes(d));
