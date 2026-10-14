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
  heading: "Mission & Vision",
  items: [
    {
      title: "Mission",
      statement: "To offer internationally recognised programmes in science and technology.",
      photo: {
        src: "/images/home/surveying-practical.jpg",
        width: 2560,
        height: 1707,
        alt: "Students in uniform setting up a surveying instrument with their lecturer",
        focus: "50% 35%",
      } satisfies Photo,
    },
    {
      title: "Vision",
      statement: "A centre of excellence in science and technology enriched with GNH values.",
      photo: {
        src: "/images/home/students-walking-on-campus.jpg",
        width: 2560,
        height: 1707,
        alt: "Students in gho walking together along a campus road",
        focus: "50% 55%",
      } satisfies Photo,
    },
  ],
};

export const facilities = {
  id: "facilities",
  label: "Facilities",
  heading: "What we provide",
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
