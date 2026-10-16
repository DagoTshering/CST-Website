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
  heading: "Bhutan’s premier institute for engineering education",
  /** The word in the heading shown in colour, with a gold underline. */
  emphasis: "engineering",
  // NEEDS REVIEW: added copy, not from the old site.
  subtitle: "Royal University of Bhutan · Rinchending",
  body: [
    "The nation’s leading institution offers internationally recognised bachelor’s and master’s degrees in various engineering fields. With over two decades of experience, CST has been shaping the future of engineering with a strong emphasis on hands-on learning, innovative research, and industry collaboration.",
    "CST currently offers master’s programmes in Renewable Energy and Construction Management, providing advanced education and research opportunities for aspiring engineers.",
  ],
  commitments: [
    "Stimulate entrepreneurial spirit and mindset among students by assisting them to put their creative ideas into action for solving real-life problems.",
    "Incubate and support innovative ideas to meet social obligations and enact wealth and employment generation.",
  ],
  // TODO: the About page is not built yet.
  link: { label: "More about CST", href: "/about" },
  photo: {
    src: "/images/home/campus-aerial-view.jpg",
    width: 1280,
    height: 1121,
    alt: "The CST campus from the air: teaching blocks, hostels and the football ground on the hillside at Rinchending",
    focus: "45% 55%",
  } satisfies Photo,
  caption: "Rinchending campus, from the air",
  jubilee: { title: "Silver Jubilee", detail: "25 years of CST" },
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
  // NEEDS REVIEW: these descriptions come from the old page's template and have not been
  // confirmed by the college (for example the 24-hour library access and the archery range).
  items: [
    {
      title: "Library & reading rooms",
      text: "Print and digital collections, group study rooms, and 24-hour access during examination weeks.",
      photo: {
        src: "/images/home/library-study.jpg",
        width: 2560,
        height: 1707,
        alt: "Two students working on laptops in the library",
        focus: "45% 50%",
      },
    },
    {
      title: "Laboratories & workshops",
      text: "Materials testing, surveying, electronics, fabrication and computing labs, supervised by lab technicians.",
      photo: {
        src: "/images/home/laboratory-workshop.jpg",
        width: 1780,
        height: 1737,
        alt: "Students working at a process-control rig in a laboratory",
        focus: "50% 45%",
      },
    },
    {
      title: "Hostels & dining",
      text: "Residential blocks for men and women, a central mess, and a booking desk for visiting students.",
      photo: {
        src: "/images/home/residential-blocks.jpg",
        width: 1431,
        height: 832,
        alt: "Residential blocks on campus at dusk",
        focus: "55% 60%",
      },
    },
    {
      title: "Sports & recreation",
      text: "Football ground, indoor courts, an archery range and a gym, with inter-department leagues each semester.",
      photo: {
        src: "/images/home/indoor-basketball.jpg",
        width: 1920,
        height: 1080,
        alt: "Students playing basketball on the indoor court",
        focus: "50% 40%",
      },
    },
    {
      title: "Research centres",
      text: "Applied groups working on hydropower, renewable energy, road safety and construction materials.",
      photo: {
        src: "/images/home/international-conference.jpg",
        width: 1563,
        height: 1365,
        alt: "Two speakers presenting at an international science and engineering conference at CST",
        focus: "50% 30%",
      },
    },
    {
      title: "Health & student support",
      text: "A campus clinic, counselling appointments, and a student services desk for accommodation and finance.",
      photo: {
        src: "/images/home/health-awareness-day.jpg",
        width: 2048,
        height: 1365,
        alt: "Students gathered for a health awareness day on campus",
        focus: "50% 40%",
      },
    },
  ] satisfies { title: string; text: string; photo: Photo }[],
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

/** A photograph cropped from the screenshot of the old site: low resolution, to be replaced. */
type TemporaryPhoto = Photo & { temporary: true };

export type CollegeEvent = {
  title: string;
  /** False when the source only showed a truncated title. */
  titleComplete: boolean;
  /** ISO dates (YYYY-MM-DD). */
  startDate: string;
  endDate?: string;
  summary?: string;
  photo: Photo | TemporaryPhoto;
  href: string;
};

export const eventsSection = {
  id: "events",
  label: "Campus life",
  heading: "Our latest events",
  text: "Explore our latest events and campus highlights.",
  link: { label: "View all events", href: "/events" },
  // VERIFY: titles were truncated on the previous website and no summaries were visible.
  items: [
    {
      title: "Empowering Future Engineers Through The…",
      titleComplete: false,
      startDate: "2026-05-28",
      photo: {
        src: "/images/temp/event-empowering-future-engineers.jpg",
        width: 277,
        height: 230,
        alt: "A speaker addressing students in a lecture hall",
        temporary: true,
      },
      href: "/events",
    },
    {
      title: "Consultative Stakeholder Workshop on New Module…",
      titleComplete: false,
      startDate: "2026-05-09",
      photo: {
        src: "/images/temp/event-stakeholder-workshop.jpg",
        width: 278,
        height: 230,
        alt: "Participants of a consultative stakeholder workshop standing before a banner",
        temporary: true,
      },
      href: "/events",
    },
    {
      title: "Bhutan Space Week 2026 Highlights Space Science A…",
      titleComplete: false,
      startDate: "2026-02-17",
      endDate: "2026-03-23",
      photo: {
        src: "/images/temp/event-bhutan-space-week.jpg",
        width: 279,
        height: 230,
        alt: "Guests on stage in front of a Bhutan Space Week screen",
        temporary: true,
      },
      href: "/events",
    },
  ] satisfies CollegeEvent[] as CollegeEvent[],
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
  name: "Dr. Tshewang Lhendup",
  designation: "President, College of Science and Technology",
  // VERIFY: no biography was present on the previous website.
  bio: null as string | null,
  photo: {
    src: "/images/temp/president-portrait.jpg",
    width: 294,
    height: 338,
    alt: "Portrait of Dr. Tshewang Lhendup, President of CST",
    temporary: true,
  } satisfies TemporaryPhoto,
  links: [
    { label: "Leadership & governance", href: "/about/governance" },
    { label: "Meet the executives", href: "/about/executives" },
  ],
};

export type Announcement = {
  title: string;
  /** ISO date; null when the publication date still needs confirming. */
  date: string | null;
  category: string;
  href: string;
  /** Set when the notice is a downloadable document (e.g. PDF). */
  documentType?: "PDF";
};

export const announcementsSection = {
  id: "announcements",
  label: "Notices",
  heading: "Announcements",
  link: { label: "View all announcements", href: "/announcements" },
  items: [
    {
      title:
        "Provisional Selection Results: Student Exchange Programme at UPV, Spain – Spring Semester 2027",
      date: "2026-10-08",
      category: "Exchange",
      href: "/announcements",
    },
    {
      title: "Application Call: Student Exchange Programme at UPV, Spain – Spring Semester 2027",
      date: "2026-09-17",
      category: "Exchange",
      href: "/announcements",
    },
    {
      // VERIFY: publication date was not shown.
      title: "Call for Admission — MSc. Eng (By Research), February 2027 Intake",
      date: null,
      category: "Admission",
      href: "/announcements",
    },
  ] satisfies Announcement[] as Announcement[],
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
