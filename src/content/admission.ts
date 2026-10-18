/**
 * The "Admission for new students" page (/admissions): every date, programme, requirement and
 * answer on it, in one place so the admin panel can edit it later. Nothing on the page is
 * written anywhere else; in particular the FAQ's "When can I apply?" is built from `steps`, so it
 * can never contradict the dates section.
 *
 * The page's state (upcoming, open or closed) follows today's date in Bhutan against the
 * application window (the steps marked `opens` and `closes`). Set `statusOverride` to pin it,
 * e.g. to close applications early or keep them open past the published date.
 *
 * Content from the old page (cst.edu.bt/admission-for-new-students), retyped, not copied.
 */
import { site } from "./site";

export type AdmissionStatus = "upcoming" | "open" | "closed";

export type AdmissionStep = {
  title: string;
  /** As shown, e.g. "18–19 Apr 2026". */
  dateLabel: string;
  /** ISO dates (YYYY-MM-DD), both inclusive; the same date for a one-day step. */
  start: string;
  end: string;
  /** The steps that bound the application window. */
  marks?: "opens" | "closes";
};

export type AdmissionProgramme = {
  name: string;
  /** Its page is /programmes/[slug] (src/content/programmes.json). */
  slug: string;
  testType: "Aptitude test" | "Entrance test";
};

export type EligibilityTrack = {
  title: string;
  testType: AdmissionProgramme["testType"];
  groups: { title: string; rows: { label: string; value: string }[] }[];
};

export type AdmissionPhoto = {
  src: string;
  width: number;
  height: number;
  /** Describe the photograph actually supplied. */
  alt: string;
  /** The plate's figure caption. */
  caption: string;
};

export type FaqItem = {
  question: string;
  /**
   * Plain text. {email}, {phone}, {hours}, {intake} and {nextIntake} are filled in from this
   * file; {applyWindow} becomes a sentence about the application dates for today's state.
   */
  answer: string;
  link?: { label: string; href: string };
};

export const admission = {
  intake: "2026",
  nextIntakeNote: "Expected March 2027, to be confirmed",
  /** The online application form (the 2026 form from the old page). Replace for each intake. */
  applyUrl: "https://forms.gle/96thtAbzopkmi9bP9",
  /** Pins the page's state; null follows the dates. */
  statusOverride: null as AdmissionStatus | null,

  intro:
    "The college admits Class XII graduates to its bachelor's programmes in architecture, engineering and information technology. Below are the dates, entry requirements and documents for each intake.",

  steps: [
    {
      title: "Applications open",
      dateLabel: "1 Mar 2026",
      start: "2026-03-01",
      end: "2026-03-01",
      marks: "opens",
    },
    {
      title: "Applications close",
      dateLabel: "15 Mar 2026",
      start: "2026-03-15",
      end: "2026-03-15",
      marks: "closes",
    },
    {
      title: "Online entrance test",
      dateLabel: "18–19 Apr 2026",
      start: "2026-04-18",
      end: "2026-04-19",
    },
    {
      title: "Selection and confirmation",
      dateLabel: "26–27 Apr 2026",
      start: "2026-04-26",
      end: "2026-04-27",
    },
    {
      title: "Result declaration",
      dateLabel: "27 Apr 2026",
      start: "2026-04-27",
      end: "2026-04-27",
    },
  ] satisfies AdmissionStep[] as AdmissionStep[],

  programmes: [
    { name: "Architecture", slug: "architecture", testType: "Aptitude test" },
    { name: "Civil Engineering", slug: "civil-engineering", testType: "Entrance test" },
    { name: "Electrical Engineering", slug: "electrical-engineering", testType: "Entrance test" },
    {
      name: "Electronics and Communication Engineering",
      slug: "electronics-and-communication",
      testType: "Entrance test",
    },
    {
      name: "Instrumentation and Control Engineering",
      slug: "instrumentation-and-control-engineering",
      testType: "Entrance test",
    },
    { name: "Engineering Geology", slug: "engineering-geology", testType: "Entrance test" },
    { name: "Mechanical Engineering", slug: "mechanical-engineering", testType: "Entrance test" },
    { name: "Information Technology", slug: "information-technology", testType: "Entrance test" },
    {
      name: "Water Resource Engineering",
      slug: "water-resource-engineering",
      testType: "Entrance test",
    },
    { name: "Software Engineering", slug: "software-engineering", testType: "Entrance test" },
  ] satisfies AdmissionProgramme[] as AdmissionProgramme[],

  eligibility: {
    checklist: [
      "A Class XII pass, with at least 50% in each of Physics, Chemistry, Mathematics and English",
      "A pass in Dzongkha",
      "The selection test: an aptitude test for Architecture, an entrance test for every other programme",
      "A Citizenship Identity Card (CID)",
    ],
    /**
     * The requirements in full, one table per kind of programme. `testType` picks the
     * programmes each table covers from `programmes` above.
     */
    tracks: [
      {
        title: "Architecture",
        testType: "Aptitude test",
        groups: [
          {
            title: "Minimum marks in Class XII",
            rows: [
              { label: "Physics", value: "50%" },
              { label: "Chemistry", value: "50%" },
              { label: "Mathematics", value: "50%" },
              { label: "English", value: "50%" },
              { label: "Dzongkha", value: "Pass" },
            ],
          },
          {
            title: "Selection",
            rows: [{ label: "Selection test", value: "Aptitude test, minimum 50%" }],
          },
          {
            title: "Ability ratings",
            rows: [
              { label: "Mathematics", value: "5" },
              { label: "Physics", value: "5" },
              { label: "Chemistry", value: "2" },
              { label: "English", value: "3" },
              { label: "One other subject", value: "Not required" },
            ],
          },
        ],
      },
      {
        title: "Engineering",
        testType: "Entrance test",
        groups: [
          {
            title: "Minimum marks in Class XII",
            rows: [
              { label: "Physics", value: "50%" },
              { label: "Chemistry", value: "50%" },
              { label: "Mathematics", value: "50%" },
              { label: "English", value: "50%" },
              { label: "Dzongkha", value: "Pass" },
            ],
          },
          {
            title: "Selection",
            rows: [{ label: "Selection test", value: "Entrance test" }],
          },
          {
            title: "Ability ratings",
            rows: [
              { label: "Mathematics", value: "5" },
              { label: "Physics", value: "5" },
              { label: "Chemistry", value: "4" },
              { label: "English", value: "3" },
              { label: "One other subject", value: "1" },
            ],
          },
        ],
      },
    ] satisfies EligibilityTrack[] as EligibilityTrack[],
  },

  documents: {
    intro: "Every eligible applicant presents these documents for admission to RUB programmes.",
    checklist: [
      "Citizenship Identity Card (CID)",
      "Class XII mark sheet",
      "Class XII pass certificate",
    ],
    /** RUB's page (the one the old page linked to; it names the 2024 academic year). */
    rubCriteria: {
      label: "RUB admission criteria and tuition fees",
      href: "https://www.rub.edu.bt/index.php/admission-criteria-and-tuition-fee-for-the-academic-year-2024/",
    },
  },

  faq: [
    {
      question: "Is there a test for admission?",
      answer:
        "Yes. Every applicant sits a selection test: an aptitude test for Architecture, where the minimum score is 50%, and an entrance test for every engineering and information technology programme.",
      link: { label: "See the important dates", href: "#dates" },
    },
    { question: "When can I apply?", answer: "{applyWindow}" },
    {
      question: "Can I apply without a CID?",
      answer:
        "No. Applicants without a Citizenship Identity Card (CID) are not eligible for admission.",
    },
    {
      question: "Where do I find programme details?",
      answer:
        "Each programme has its own page, with its structure, entry requirements, career paths and facilities.",
      link: { label: "View all programmes", href: "/programmes" },
    },
    {
      question: "Who do I contact?",
      answer: "Email the admissions office at {email} or call {phone}. The office is open {hours}.",
      link: { label: "Contact details", href: "#contact" },
    },
  ] satisfies FaqItem[] as FaqItem[],

  contact: {
    email: "admission.cst@rub.edu.bt",
    phone: site.contact.phone,
    hours: "Mon–Fri, 8:00 AM–4:00 PM",
    address: "Rinchending, Phuentsholing, Chukha, Bhutan",
  },

  photos: {
    hero: {
      src: "/images/admission/hero.jpg",
      width: 1600,
      height: 2000,
      alt: "Students walking across the CST campus in Rinchending",
      caption: "",
    },
    lab: {
      src: "/images/admission/lab.jpg",
      width: 1600,
      height: 1200,
      alt: "Students at work in a CST laboratory",
      caption: "A laboratory class at CST",
    },
    office: {
      src: "/images/admission/office.jpg",
      width: 1600,
      height: 1200,
      alt: "The CST admissions office",
      caption: "The admissions office",
    },
  } satisfies Record<string, AdmissionPhoto>,
};

/* ------------------------------------------------------------------------------------------
   State, from today's date
   ------------------------------------------------------------------------------------------ */

export type StepState = "done" | "current" | "pending";

/** Today in Bhutan (UTC+6), as YYYY-MM-DD, so ISO dates compare as strings. */
export function bhutanToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Thimphu" }).format(now);
}

const opening = () => admission.steps.find((s) => s.marks === "opens") ?? admission.steps[0];
const closing = () => admission.steps.find((s) => s.marks === "closes") ?? admission.steps[0];

/** Upcoming before the window opens, open while it lasts, closed after it. */
export function admissionStatus(today: string): AdmissionStatus {
  if (admission.statusOverride) return admission.statusOverride;
  if (today < opening().start) return "upcoming";
  if (today <= closing().end) return "open";
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
export function stepStates(status: AdmissionStatus, today: string): StepState[] {
  const { steps, statusOverride } = admission;
  if (status === "upcoming") return steps.map(() => "pending");
  if (status === "closed" && statusOverride === "closed") return steps.map(() => "done");

  const states = steps.map((s): StepState =>
    s.end < today ? "done" : s.start <= today ? "current" : "pending",
  );
  if (status === "open" && !states.includes("current")) {
    const at = steps.indexOf(closing());
    return steps.map((_, i) => (i < at ? "done" : i === at ? "current" : "pending"));
  }
  return states;
}

/** The FAQ's sentence about when to apply, for today's state. */
function applyWindow(status: AdmissionStatus) {
  const { intake } = admission;
  const opens = opening().dateLabel;
  const closes = closing().dateLabel;
  if (status === "upcoming")
    return `Applications for the ${intake} intake open on ${opens} and close on ${closes}. You apply online.`;
  if (status === "open")
    return `Applications for the ${intake} intake are open now and close on ${closes}. You apply online, through the link at the top of this page.`;
  return `Applications for the ${intake} intake ran from ${opens} to ${closes} and have closed. Next intake: ${nextIntakeInline()}.`;
}

/** The next-intake note inside a sentence: "expected March 2027, to be confirmed". */
export function nextIntakeInline() {
  const note = admission.nextIntakeNote;
  return note.charAt(0).toLowerCase() + note.slice(1);
}

/** An FAQ answer with its {placeholders} filled in. */
export function faqAnswer(answer: string, status: AdmissionStatus) {
  const { contact, intake, nextIntakeNote } = admission;
  const values: Record<string, string> = {
    email: contact.email,
    phone: contact.phone.label,
    hours: contact.hours,
    intake,
    nextIntake: nextIntakeNote,
    applyWindow: applyWindow(status),
  };
  return answer.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

export const opensLabel = () => opening().dateLabel;
export const closesLabel = () => closing().dateLabel;
