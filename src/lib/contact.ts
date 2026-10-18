/**
 * The Contact page (/contact).
 *
 * The content lives in data/contact.json, started from docs/reference/contact.json (the old page's
 * extract) and the single source of truth. Its `meta` is notes for the web team and is never
 * rendered.
 *
 * Settled with the web team (18 Oct 2026): no LinkedIn link (the old page linked another
 * institution's); the President's and Deans' phone numbers stay public; the feedback portal (a
 * Google Form whose responses go to the President) is linked from the footer only. Open: whether messages should reach a
 * mailbox (the page only opens the visitor's email app); whether the open-now line should know
 * about public holidays.
 */
import data from "../../data/contact.json";

export type Office = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  phoneLabel: string | null;
};

export type Hours = {
  label: string;
  /** An IANA time zone; the open-now line is worked out in it, not the visitor's. */
  timezone: string;
  /** Days open, 0 = Sunday. */
  days: number[];
  /** "HH:MM", 24-hour. */
  open: string;
  close: string;
};

export type Contact = {
  college: string;
  university: string;
  address: string[];
  postal: string;
  hours: Hours;
  map: { link: string; embed: string };
  general: { phone: string; phoneLabel: string; email: string; whatsapp: string };
  social: { label: string; url: string }[];
  offices: Office[];
};

// Everything but `meta`, the web team's notes.
export const contact: Contact = {
  college: data.college,
  university: data.university,
  address: data.address,
  postal: data.postal,
  hours: data.hours,
  map: data.map,
  general: data.general,
  social: data.social,
  offices: data.offices,
};

/** The offices a message can be written to. */
export const emailOffices = contact.offices.filter(
  (o): o is Office & { email: string } => o.email !== null,
);
