/**
 * Site-wide content: names, contact details, navigation and the footer.
 *
 * Paths marked TODO point at pages that do not exist yet in the new site; they are listed in
 * src/content/todo-links.md. Keep the two in step when a page is added.
 */

export type NavLink = {
  label: string;
  href: string;
};

/** A titled set of links inside a submenu, such as "Important links" under "Others". */
export type NavSubgroup = {
  label: string;
  items: NavLink[];
};

/** A top-level item without a page of its own: it only opens its submenu. */
export type NavGroup = {
  label: string;
  items: (NavLink | NavSubgroup)[];
};

export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup;
export function isNavGroup(item: NavLink | NavSubgroup): item is NavSubgroup;
export function isNavGroup(item: NavItem | NavSubgroup): boolean {
  return "items" in item;
}

export type SocialNetwork = "facebook" | "instagram" | "youtube";

export const site = {
  name: "College of Science and Technology",
  shortName: "CST",
  university: "Royal University of Bhutan",
  tagline: "Royal University of Bhutan · Rinchending, Phuentsholing",
  description:
    "The College of Science and Technology, Royal University of Bhutan, offers internationally recognised engineering and architecture programmes in Rinchending, Phuentsholing.",

  logos: {
    silverJubilee: {
      src: "/images/brand/silver-jubilee-logo.jpg",
      width: 2048,
      height: 1448,
      alt: "CST Silver Jubilee, 25 years",
    },
    crest: {
      src: "/images/brand/cst-crest.png",
      width: 512,
      height: 512,
      alt: "College of Science and Technology crest",
    },
  },

  contact: {
    location: "Rinchending, Phuentsholing",
    phone: { label: "(+975) 17160538", href: "tel:+97517160538" },
    email: { label: "info.cst@rub.edu.bt", href: "mailto:info.cst@rub.edu.bt" },
  },

  // TODO: CST's LinkedIn page. The live site links to an unrelated institution's page, so it
  // is left out until the real one is found.
  social: [
    {
      network: "facebook",
      label: "CST on Facebook",
      href: "https://www.facebook.com/CST.University/",
    },
    { network: "instagram", label: "CST on Instagram", href: "https://www.instagram.com/cst_rub/" },
    { network: "youtube", label: "CST on YouTube", href: "https://www.youtube.com/@CSTMultimedia" },
  ] satisfies { network: SocialNetwork; label: string; href: string }[],
} as const;

/** The header's one button. */
export const headerAction = { label: "Contact us", href: "/contact" };

/**
 * Main menu, as agreed by the team in October 2026. The "Important Links" go to other CST
 * sites and open in a new tab; every other path except "/" is TODO.
 */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About Us",
    items: [
      { label: "About CST", href: "/about" },
      { label: "Executives", href: "/about/executives" },
      { label: "Staff Directory", href: "/about/staff-directory" },
    ],
  },
  { label: "Academics", href: "/programmes" },
  { label: "Announcements", href: "/announcements" },
  { label: "Admissions", href: "/admissions" },
  {
    label: "Others",
    items: [
      { label: "Vacancies", href: "/vacancies" },
      { label: "Student Hub", href: "/student-hub" },
      { label: "Events", href: "/events" },
      { label: "EU Projects", href: "/eu-projects" },
      { label: "Downloads", href: "/downloads" },
      { label: "Live Campus Air & Climate Data", href: "/air-quality" },
      {
        label: "Important Links",
        items: [
          { label: "Research", href: "https://ril.cst.edu.bt/" },
          { label: "Student Life", href: "https://sa.cst.edu.bt/" },
          { label: "Hostel Booking", href: "https://hostel.cst.edu.bt/login" },
          { label: "CST-25", href: "https://cst25.cst.edu.bt/" },
        ],
      },
    ],
  },
];

/**
 * The footer, with the content of the live site's footer (cst.edu.bt). Links to other sites
 * open in a new tab; "Downloads" is a page of our own.
 */
export const footer = {
  quickLinks: {
    title: "Quick Links",
    links: [
      { label: "About CST", href: "/about" },
      { label: "Office of the Vice Chancellor", href: "https://www.rub.edu.bt/" },
      { label: "Ministry of Education", href: "https://education.gov.bt/" },
      {
        label: "G2C Services",
        href: "https://www.citizenservices.gov.bt/g2cportal/ListOfLifeEventComponent",
      },
      { label: "Ministry of Industry, Commerce & Employment", href: "https://www.moice.gov.bt/" },
      { label: "Royal Civil Service Commission", href: "https://rcsc.gov.bt/" },
    ],
  },
  eServices: {
    title: "E-Services",
    links: [
      { label: "RUB IMS", href: "https://ims.rub.edu.bt/public/auth/view-login" },
      { label: "VLE (Moodle)", href: "https://vle.cst.edu.bt/" },
      { label: "Library (OPAC)", href: "https://lib.cst.edu.bt/" },
      { label: "Downloads", href: "/downloads" },
      { label: "No Due System", href: "https://nds.cst.edu.bt/login" },
    ],
  },
  hours: {
    title: "Work Hours",
    schedule: [
      { days: "Mon–Fri", time: "08:00 AM – 04:00 PM" },
      { days: "Sat–Sun", time: "Closed" },
    ],
    actions: [
      // A short link (tinyurl.com) to a Google Form whose responses go to the President.
      { label: "Feedback Portal", href: "https://tinyurl.com/4hvsat4m" },
      // A Google Sheets *edit* link, kept public at the web team's request (18 Oct 2026).
      {
        label: "Online Substitution Form",
        href: "https://docs.google.com/spreadsheets/d/1vH0HqfIbmSP_P_EXR_eTwJLVPMeCJE3jqSa1srS-QDI/edit?gid=450603648#gid=450603648",
      },
    ],
  },
  address: {
    title: "Address",
    lines: [
      "College of Science and Technology",
      "Rinchending, Phuentsholing",
      "Chukkha: Bhutan",
      "Post-Box No: 450",
      "Postal Code: 21101",
    ],
    contacts: [
      { label: "Email", value: "info.cst@rub.edu.bt", href: "mailto:info.cst@rub.edu.bt" },
      {
        label: "Web Manager",
        value: "ictunit.cst@rub.edu.bt",
        href: "mailto:ictunit.cst@rub.edu.bt",
      },
    ],
  },
  /** Under the address: every office, the map and the message box. */
  contactPage: { label: "All contacts and offices", href: "/contact" },
  bottomLine: "College of Science and Technology, RUB",
};
