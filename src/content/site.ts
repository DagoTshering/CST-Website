/**
 * Site-wide content: identity, contact details, navigation and footer links.
 *
 * Values are transcribed from the previous website (docs/reference/old-cst-website.pdf).
 * Anything marked "VERIFY" was not readable or not present there.
 */

/**
 * Secondary pages are not built yet. Links that will point to them use this placeholder;
 * the intended route is noted next to each use so it can be filled in later.
 */
export const PENDING_HREF = "#";

export type NavLink = { label: string; href: string; external?: boolean };
export type NavItem = NavLink & { children?: NavLink[] };

export const site = {
  name: "College of Science and Technology",
  shortName: "CST",
  university: "Royal University of Bhutan",
  tagline: "In pursuit of preparing tomorrow's technologists",
  description:
    "Bhutan's premier institute for engineering education, offering internationally recognised bachelor's and master's degrees in engineering fields.",
  // VERIFY: the previous website shows "Copyright © 2025".
  copyrightYear: "2025",
};

export const contact = {
  location: "Rinchending, Phuentsholing",
  phone: "(+975) 17160538",
  phoneHref: "tel:+97517160538",
  email: "info.cst@rub.edu.bt",
  webManagerEmail: "ictunit.cst@rub.edu.bt",
  address: ["College of Science and Technology", "Rinchending, Phuentsholing", "Chukkha, Bhutan"],
  postBox: "Post Box No. 450",
  postalCode: "21101",
  hours: [
    { days: "Mon – Fri", time: "08:00 AM – 04:00 PM" },
    { days: "Sat – Sun", time: "Closed" },
  ],
};

export const mainNav: NavItem[] = [
  { label: "Home", href: "#top" },
  { label: "About Us", href: "#about" },
  { label: "Academic", href: "#programmes" },
  { label: "Research", href: "#facilities" }, // future: /research
  { label: "Student Life", href: "#events" }, // future: /student-life
  {
    label: "Others",
    href: PENDING_HREF,
    children: [
      { label: "Departments", href: "#programmes" }, // future: /departments
      { label: "Executives", href: "#leadership" }, // future: /leadership
      { label: "Hostel Booking", href: PENDING_HREF },
      { label: "Announcements", href: "#announcements" },
      { label: "E-Services", href: "#resources" },
    ],
  },
];

export const footerQuickLinks: NavLink[] = [
  { label: "Home", href: "#top" },
  { label: "About Us", href: "#about" },
  { label: "Academic Programmes", href: "#programmes" },
  { label: "Research", href: PENDING_HREF }, // future: /research
  { label: "Student Life", href: PENDING_HREF }, // future: /student-life
  { label: "Facilities", href: "#facilities" },
];

// E-services listed on the previous website. VERIFY: target URLs were not visible.
export const footerResources: NavLink[] = [
  { label: "Events", href: "#events" },
  { label: "Announcements", href: "#announcements" },
  { label: "RUB IMS", href: PENDING_HREF },
  { label: "VLE (Moodle)", href: PENDING_HREF },
  { label: "Library (OPAC)", href: PENDING_HREF },
  { label: "Downloads", href: PENDING_HREF },
  { label: "No Due System", href: PENDING_HREF },
  { label: "Feedback Portal", href: PENDING_HREF },
  { label: "Online Substitution Form", href: PENDING_HREF },
];

// Related government and university links from the previous website. VERIFY: URLs.
export const relatedLinks: NavLink[] = [
  { label: "Office of the Vice Chancellor", href: PENDING_HREF },
  { label: "Ministry of Education", href: PENDING_HREF },
  { label: "G2C Services", href: PENDING_HREF },
  { label: "Ministry of Industry, Commerce & Employment", href: PENDING_HREF },
  { label: "Royal Civil Service Commission", href: PENDING_HREF },
];
