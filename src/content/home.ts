/**
 * Homepage content.
 *
 * Text is transcribed from the previous website (docs/reference/old-cst-website.pdf) unless a
 * field is marked `verify` / commented "VERIFY". The shapes here are intended to map onto
 * database rows in a later phase, so the section components only depend on these types.
 */
import { images, type SiteImage } from "./images";
import { PENDING_HREF } from "./site";

export const hero = {
  eyebrow: "College of Science and Technology",
  headline: ["Engineering Ideas.", "Shaping Tomorrow."],
  intro:
    "Discover a community of future engineers, innovators, and researchers committed to applying science and technology to real-world challenges.",
  primaryCta: { label: "Explore Our Programmes", href: "#programmes" },
  secondaryCta: { label: "Discover CST", href: "#about" },
  image: images.heroCampus,
  inset: images.heroClassroom,
};

export const about = {
  heading: "Where Science Meets Innovation",
  lead: "CST is Bhutan's premier institute for engineering education. The nation's leading institution offers internationally recognised bachelor's and master's degrees in various engineering fields.",
  body: "With over two decades of experience, CST has been shaping the future of engineering with a strong emphasis on hands-on learning, innovative research, and industry collaboration. CST currently offers master's programmes in Renewable Energy and Construction Management, providing advanced education and research opportunities for aspiring engineers.",
  objectives: [
    "Stimulate entrepreneurial spirit and mindset among students by assisting them to put their creative ideas into action for solving real-life problems.",
    "Incubate and support innovative ideas to meet social obligations and enact wealth and employment generation.",
  ],
  vision: "A centre of excellence in science and technology enriched with GNH values.",
  mission: "To offer internationally recognised programmes in science and technology.",
  link: { label: "Discover Our College", href: PENDING_HREF }, // future: /about
  image: images.aboutAerial,
  secondaryImage: images.studentsWalk,
};

export type Facility = {
  title: string;
  description: string;
  image: SiteImage;
  href?: string;
};

export const facilitiesIntro = {
  heading: "Where Curiosity Meets Care",
  text: "Explore passions, build skills, and stay balanced with tech clubs, community service, health-care and counselling designed for your success.",
};

export const facilities: Facility[] = [
  {
    title: "Academic Programmes & Laboratories",
    description:
      "From Civil and Electrical to IT and Architecture, our programmes are backed by practical lab work.",
    image: images.facilityLab,
    href: PENDING_HREF, // future: /facilities/laboratories
  },
  {
    title: "Research & Innovation",
    description:
      "Bridging ideas to impact: CST connects academia and industry through final-year projects, internships, and workshops that bring ideas to life.",
    image: images.facilityResearch,
    href: PENDING_HREF, // future: /research
  },
  {
    title: "Sports & Fitness",
    description:
      "With open grounds, indoor sports, and annual tournaments, CST encourages a healthy balance of academics and fitness.",
    image: images.facilitySports,
    href: PENDING_HREF, // future: /student-life
  },
];

export const studentSupport = ["Tech clubs", "Community service", "Health care", "Counselling"];

export type Programme = {
  name: string;
  level: "Undergraduate" | "Postgraduate";
  /** True when the official programme title still needs confirming. */
  verify: boolean;
  href: string;
};

export const programmesIntro = {
  heading: "Find Your Path in Engineering and Technology",
  text: "CST offers internationally recognised engineering and management programmes focused on hands-on learning, innovation, and global relevance, ensuring students are well prepared for successful careers.",
  image: images.graduation,
  link: { label: "View All Programmes", href: PENDING_HREF }, // future: /programmes
};

// VERIFY: Undergraduate names are the fields/departments named on the previous website
// (exchange-programme notice and facilities text), not confirmed official programme titles.
export const programmes: Programme[] = [
  { name: "Civil Engineering", level: "Undergraduate", verify: true, href: PENDING_HREF },
  { name: "Electrical Engineering", level: "Undergraduate", verify: true, href: PENDING_HREF },
  {
    name: "Electronics and Communication Engineering",
    level: "Undergraduate",
    verify: true,
    href: PENDING_HREF,
  },
  {
    name: "Instrumentation and Control Engineering",
    level: "Undergraduate",
    verify: true,
    href: PENDING_HREF,
  },
  { name: "Engineering Geology", level: "Undergraduate", verify: true, href: PENDING_HREF },
  { name: "Water Resources Engineering", level: "Undergraduate", verify: true, href: PENDING_HREF },
  { name: "Information Technology", level: "Undergraduate", verify: true, href: PENDING_HREF },
  { name: "Architecture", level: "Undergraduate", verify: true, href: PENDING_HREF },
  { name: "Renewable Energy", level: "Postgraduate", verify: false, href: PENDING_HREF },
  { name: "Construction Management", level: "Postgraduate", verify: false, href: PENDING_HREF },
  { name: "MSc. Eng (By Research)", level: "Postgraduate", verify: false, href: PENDING_HREF },
];

// VERIFY: figures shown on the previous website; confirm they are current before launch.
export const keyFigures = [
  { value: "12", label: "Bachelor's & Master's programmes" },
  { value: "1K+", label: "Students" },
  { value: "77", label: "Lecturers" },
  { value: "2,775", label: "Graduates" },
];

export type CollegeEvent = {
  title: string;
  /** False when the source only showed a truncated title. */
  titleComplete: boolean;
  startDate: string; // ISO date
  endDate?: string;
  summary?: string;
  image: SiteImage;
  href: string;
};

export const eventsIntro = {
  heading: "Our Latest Events",
  text: "Explore our latest events and campus highlights.",
  link: { label: "View All Events", href: PENDING_HREF }, // future: /events
};

// VERIFY: titles were truncated on the previous website and no summaries were visible.
export const events: CollegeEvent[] = [
  {
    title: "Empowering Future Engineers Through The…",
    titleComplete: false,
    startDate: "2026-05-28",
    image: images.eventEngineers,
    href: PENDING_HREF,
  },
  {
    title: "Consultative Stakeholder Workshop on New Module…",
    titleComplete: false,
    startDate: "2026-05-09",
    image: images.eventWorkshop,
    href: PENDING_HREF,
  },
  {
    title: "Bhutan Space Week 2026 Highlights Space Science A…",
    titleComplete: false,
    startDate: "2026-02-17",
    endDate: "2026-03-23",
    image: images.eventSpaceWeek,
    href: PENDING_HREF,
  },
];

export const leadership = {
  heading: "Leadership with Vision and Purpose",
  statement:
    "At CST, our executive leadership led by the Vice Chancellor and President guides the institution with a strong commitment to academic excellence, innovation, and student success.",
  name: "Dr. Tshewang Lhendup",
  designation: "President, College of Science and Technology",
  // VERIFY: no biography was present on the previous website.
  bio: null as string | null,
  image: images.president,
  links: [
    { label: "Leadership & Governance", href: PENDING_HREF }, // future: /leadership
    { label: "Meet the Executives", href: PENDING_HREF }, // future: /leadership/executives
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

export const announcementsIntro = {
  heading: "Announcements",
  link: { label: "View All Announcements", href: PENDING_HREF }, // future: /announcements
};

export const announcements: Announcement[] = [
  {
    title:
      "Provisional Selection Results: Student Exchange Programme at UPV, Spain – Spring Semester 2027",
    date: "2026-10-08",
    category: "Exchange",
    href: PENDING_HREF,
  },
  {
    title: "Application Call: Student Exchange Programme at UPV, Spain – Spring Semester 2027",
    date: "2026-09-17",
    category: "Exchange",
    href: PENDING_HREF,
  },
  {
    // VERIFY: publication date was not shown.
    title: "Call for Admission — MSc. Eng (By Research), February 2027 Intake",
    date: null,
    category: "Admission",
    href: PENDING_HREF,
  },
];

export const opportunities = {
  image: images.exchange,
  items: [
    {
      title: "Exchange Programmes",
      text: "Learn globally, grow personally.",
      href: PENDING_HREF,
    },
    {
      title: "Career Opportunities",
      text: "Unlock pathways to rewarding careers after graduation.",
      href: PENDING_HREF,
    },
  ],
};
