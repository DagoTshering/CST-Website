/**
 * Central image map for the homepage.
 *
 * To swap in an original photograph, replace the file at `src` (keeping the name) or point
 * `src` at the new file and update `width`/`height` to its intrinsic size.
 *
 * `temporary: true` marks images cropped from the screenshot of the previous website
 * (docs/reference/old-cst-website.pdf). They are low resolution and should be replaced
 * with original college photographs before launch.
 */
export type SiteImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  temporary: boolean;
};

export const images = {
  logo: {
    src: "/cst_logo.png",
    alt: "College of Science and Technology logo",
    width: 181,
    height: 176,
    temporary: false,
  },
  heroCampus: {
    src: "/images/temp/hero-campus-building.jpg",
    alt: "A glass-fronted academic building on the CST campus beside a tree-lined road",
    width: 932,
    height: 535,
    temporary: true,
  },
  heroClassroom: {
    src: "/images/temp/classroom-lecture.jpg",
    alt: "A lecturer in a gho speaking to a class of CST students",
    width: 951,
    height: 620,
    temporary: true,
  },
  aboutAerial: {
    src: "/about_cst.jpg",
    alt: "Aerial view of the CST campus on the hillside above Phuentsholing",
    width: 1024,
    height: 767,
    temporary: false,
  },
  studentsWalk: {
    src: "/images/temp/students-campus-walk.jpg",
    alt: "CST students in national dress walking together on campus",
    width: 370,
    height: 500,
    temporary: true,
  },
  facilityLab: {
    src: "/images/facilities_1.jpg",
    alt: "Students and an instructor working on an electro-pneumatic training panel in a laboratory",
    width: 1780,
    height: 1737,
    temporary: false,
  },
  facilityResearch: {
    src: "/images/facilities_2.jpg",
    alt: "Students seated at long tables during a research presentation in a conference hall",
    width: 2048,
    height: 1365,
    temporary: false,
  },
  facilitySports: {
    src: "/images/facilities_3.jpeg",
    alt: "A student running on a treadmill in the college fitness centre",
    width: 768,
    height: 1024,
    temporary: false,
  },
  studentsLearning: {
    src: "/images/temp/students-learning.jpg",
    alt: "Two students working together on a project at a table",
    width: 370,
    height: 245,
    temporary: true,
  },
  graduation: {
    src: "/images/temp/graduation.jpg",
    alt: "Graduates in academic gowns celebrating at a convocation ceremony",
    width: 476,
    height: 384,
    temporary: true,
  },
  eventEngineers: {
    src: "/images/temp/event-empowering-future-engineers.jpg",
    alt: "A speaker addressing students in a lecture hall",
    width: 277,
    height: 230,
    temporary: true,
  },
  eventWorkshop: {
    src: "/images/temp/event-stakeholder-workshop.jpg",
    alt: "Participants of a consultative stakeholder workshop standing before a banner",
    width: 278,
    height: 230,
    temporary: true,
  },
  eventSpaceWeek: {
    src: "/images/temp/event-bhutan-space-week.jpg",
    alt: "Guests on stage in front of a Bhutan Space Week screen",
    width: 279,
    height: 230,
    temporary: true,
  },
  exchange: {
    src: "/images/temp/exchange-conference.jpg",
    alt: "International students speaking at a science and technology conference",
    width: 475,
    height: 384,
    temporary: true,
  },
  president: {
    src: "/images/temp/president-portrait.jpg",
    alt: "Portrait of Dr. Tshewang Lhendup, President of CST",
    width: 294,
    height: 338,
    temporary: true,
  },
} satisfies Record<string, SiteImage>;
