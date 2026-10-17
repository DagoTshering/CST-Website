/**
 * Homepage content that is fixed in code: the hero, section labels, headings and links. The
 * content administrators manage (About CST, facilities, programmes, events, leadership and
 * announcements) comes from the database, through src/lib/cms/resources/.
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
  /** Short name, used in the caption under the phone dial. */
  label: string;
  /** Full title, shown on the clock and used for accessible names. */
  title: string;
  /** Year the programme was first offered. */
  year: number;
  postgraduate?: boolean;
};

export const hero = {
  eyebrow: "Royal University of Bhutan",
  title: { lead: "College of", emphasis: "Science & Technology" },
  tagline: "In pursuit of preparing for tomorrow’s Technologist",
  actions: [
    { label: "Explore programmes", href: "#programmes", variant: "primary" },
    { label: "Visit the campus", href: "#campus", variant: "secondary" },
  ],
  /** Accessible name of the group of programmes round the clock. */
  clockLabel: "Programmes offered at CST, by the year each began",
  /** In the order they were first offered, which is the order the clock tours them in. */
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

/** A photograph with its intrinsic size, alt text and focal point (for object-position). */
export type Photo = {
  src: string;
  width: number;
  height: number;
  alt: string;
  focus?: string;
};

export const about = {
  id: "about",
  label: "About CST",
  // TODO: the About page is not built yet.
  link: { label: "More about CST", href: "/about" },
};

export const missionVision = {
  heading: "Vision & Mission",
  /** Vision first, then mission. */
  items: [
    {
      title: "Vision",
      statement: "A centre of excellence in science and technology enriched with GNH values.",
      /** The phrase set in colour, with the gold underline. */
      emphasis: "GNH values",
      // TODO(copy): caption added for the redesign; confirm wording.
      caption: "Solar panels on the campus roofs",
      photo: {
        src: "/images/home/solar-rooftops.jpg",
        width: 1950,
        height: 1098,
        alt: "Rows of solar panels on the teal roofs of campus buildings, with flowering bougainvillea and the hills behind",
        focus: "50% 50%",
      } satisfies Photo,
    },
    {
      title: "Mission",
      statement: "To offer internationally recognised programmes in science and technology.",
      emphasis: "internationally recognised",
      // TODO(copy): caption added for the redesign; confirm wording.
      caption: "A lecture on solar energy",
      photo: {
        src: "/images/home/whiteboard-lecture.jpg",
        width: 2688,
        height: 1792,
        alt: "A lecturer in gho sketching a solar power curve on the whiteboard for a class",
        focus: "55% 35%",
      } satisfies Photo,
    },
  ],
};

export const facilities = {
  id: "facilities",
  label: "Facilities",
  heading: "What we provide",
  /** The heading's word set in colour, with the gold underline. */
  emphasis: "provide",
  quote: "Where curiosity meets care",
  intro:
    "Explore passions, build skills, and stay balanced with tech clubs, community service, health-care and counselling designed for your success.",
};

/*
 * The sections below came over from the homepage on main (commit 2695bb3), where the text was
 * transcribed from the previous website. Their "To verify" notes are kept.
 */

export const programmesSection = {
  id: "programmes",
  label: "Academic",
  heading: "Find your path in engineering and technology",
  emphasis: "path",
  text: "CST offers internationally recognised engineering and management programmes focused on hands-on learning, innovation, and global relevance, ensuring students are well prepared for successful careers.",
  photo: {
    src: "/images/home/graduation-ceremony.jpg",
    width: 1827,
    height: 1219,
    alt: "Graduates in academic gowns throwing their caps at a convocation ceremony",
    focus: "50% 40%",
  } satisfies Photo,
  // TODO(copy): caption added for the restyle; confirm wording.
  caption: "Convocation at CST",
  link: { label: "View all programmes", href: "/academics/programmes" },
  /** The programmes themselves are the hero's list, grouped by level. */
  groups: [
    { postgraduate: false, title: "Undergraduate", note: "Bachelor’s degrees" },
    { postgraduate: true, title: "Postgraduate", note: "Master’s degrees" },
  ],
  // VERIFY: figures shown on the previous website; confirm they are current before launch.
  figures: [
    { value: "12", label: "Bachelor’s & Master’s programmes" },
    { value: "1K+", label: "Students" },
    { value: "77", label: "Lecturers" },
    { value: "2,775", label: "Graduates" },
  ],
};

export const eventsSection = {
  id: "events",
  label: "Campus life",
  heading: "Our latest events",
  text: "Explore our latest events and campus highlights.",
  link: { label: "View all events", href: "/events" },
};

export const leadership = {
  id: "leadership",
  label: "Leadership and governance",
  heading: "Leadership with vision and purpose",
  emphasis: "vision",
  // TODO(copy): caption added for the restyle; confirm wording.
  caption: "Office of the President",
  statement:
    "At CST, our executive leadership led by the Vice Chancellor and President guides the institution with a strong commitment to academic excellence, innovation, and student success.",
  links: [
    { label: "Leadership & governance", href: "/about/governance" },
    { label: "Meet the executives", href: "/about/executives" },
  ],
};

export const announcementsSection = {
  id: "announcements",
  label: "Notices",
  heading: "Announcements",
  link: { label: "View all announcements", href: "/announcements" },
  opportunities: {
    label: "Opportunities",
    // TODO(copy): caption added for the restyle; confirm wording.
    caption: "Students on the campus road",
    photo: {
      src: "/images/home/students-walking-on-campus.jpg",
      width: 2560,
      height: 1707,
      alt: "Students in gho walking together along a campus road",
      focus: "50% 55%",
    } satisfies Photo,
    items: [
      {
        title: "Exchange programmes",
        text: "Learn globally, grow personally.",
        href: "/exchange-programmes",
      },
      {
        title: "Career opportunities",
        text: "Unlock pathways to rewarding careers after graduation.",
        href: "/careers",
      },
    ],
  },
};
