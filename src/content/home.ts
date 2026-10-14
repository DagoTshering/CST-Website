/**
 * Homepage content. Components read everything they display from here, so text can be edited
 * in one place, and the news and events lists can later come from the database instead.
 */

/** Programme keys; each has its own drawing on the hero sheet. */
export type ProgrammeKey =
  | "civil"
  | "elec"
  | "ece"
  | "it"
  | "arch"
  | "renew"
  | "geo"
  | "inst"
  | "constr"
  | "water"
  | "mech"
  | "soft"
  | "resrch";

export type Programme = {
  key: ProgrammeKey;
  /** Short name on the drawing sheet. */
  label: string;
  /** Full title, used for accessible names and the legend label. */
  title: string;
  /** Year the programme was first offered. */
  year: number;
  postgraduate?: boolean;
};

export const hero = {
  eyebrow: "Royal University of Bhutan · Rinchending, Phuentsholing",
  title: { lead: "College of", emphasis: "Science & Technology" },
  tagline: "In pursuit of preparing for tomorrow’s Technologist",
  actions: [
    { label: "Explore programmes", href: "#programmes", variant: "primary" },
    { label: "Visit the campus", href: "#campus", variant: "secondary" },
  ],
  stripLabel: "Programmes offered at CST, by the year each began",
  /** In the order they were first offered, which is the order the sheet tours them in. */
  programmes: [
    {
      key: "civil",
      label: "BE Civil",
      title: "Bachelor of Engineering in Civil Engineering",
      year: 2001,
    },
    {
      key: "elec",
      label: "BE Electrical",
      title: "Bachelor of Engineering in Electrical Engineering",
      year: 2001,
    },
    {
      key: "ece",
      label: "BE Electronics & Comm.",
      title: "Bachelor of Engineering in Electronics and Communication Engineering",
      year: 2009,
    },
    {
      key: "it",
      label: "BE Information Technology",
      title: "Bachelor of Engineering in Information Technology",
      year: 2010,
    },
    { key: "arch", label: "B. Arch", title: "Bachelor of Architecture", year: 2014 },
    {
      key: "renew",
      label: "ME Renewable Energy",
      title: "Master of Engineering in Renewable Energy",
      year: 2018,
      postgraduate: true,
    },
    {
      key: "geo",
      label: "BE Engineering Geology",
      title: "Bachelor of Engineering in Engineering Geology",
      year: 2019,
    },
    {
      key: "inst",
      label: "BE Instrumentation & Control",
      title: "Bachelor of Engineering in Instrumentation and Control Engineering",
      year: 2019,
    },
    {
      key: "constr",
      label: "ME Construction Mgmt.",
      title: "Master of Engineering in Construction Management",
      year: 2021,
      postgraduate: true,
    },
    {
      key: "water",
      label: "BE Water Resources",
      title: "Bachelor of Engineering in Water Resources Engineering",
      year: 2023,
    },
    {
      key: "mech",
      label: "BE Mechanical",
      title: "Bachelor of Engineering in Mechanical Engineering",
      year: 2023,
    },
    {
      key: "soft",
      label: "BE Software",
      title: "Bachelor of Engineering in Software Engineering",
      year: 2023,
    },
    {
      key: "resrch",
      label: "M by Research",
      title: "Master by Research in Engineering",
      year: 2027,
      postgraduate: true,
    },
  ] satisfies Programme[] as Programme[],
};
