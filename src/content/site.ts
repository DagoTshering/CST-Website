/**
 * Site-wide content: names, contact details, navigation and footer links.
 *
 * Paths marked TODO point at pages that do not exist yet in the new site; they are listed in
 * src/content/todo-links.md. Keep the two in step when a page is added.
 */

export type NavLink = {
  label: string;
  href: string;
};

/** A top-level item without a page of its own: it only opens its submenu. */
export type NavGroup = {
  label: string;
  items: NavLink[];
};

export type NavItem = NavLink | NavGroup;

export function isNavGroup(item: NavItem): item is NavGroup {
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
    address: ["College of Science and Technology", "Rinchending, Chhukha", "Bhutan"],
    // PROVISIONAL: the old site only had placeholder hours. Confirm the real office hours (and
    // whether they differ by day) with the college before launch.
    hours: "8:00 AM – 4:00 PM",
  },

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

/** Main menu ("CST Main Menu" in WordPress). Every path except "/" is TODO. */
export const mainNav: NavItem[] = [
  { label: "Home", href: "/" },
  {
    label: "About Us",
    items: [
      { label: "About Us", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
      { label: "Executives", href: "/about/executives" },
      { label: "Staff Directory", href: "/about/staff-directory" },
    ],
  },
  {
    label: "Academics",
    items: [
      { label: "Programmes", href: "/academics/programmes" },
      { label: "Academic Calendar", href: "/academics/calendar" },
      { label: "Examination", href: "/academics/examination" },
      { label: "Library", href: "/library" },
    ],
  },
  {
    label: "Department",
    items: [
      { label: "Architecture", href: "/departments/architecture" },
      {
        label: "Civil & Environmental Engineering",
        href: "/departments/civil-environmental-engineering",
      },
      { label: "Computing Technologies", href: "/departments/computing-technologies" },
      {
        label: "Electrical & Electronic Engineering",
        href: "/departments/electrical-electronic-engineering",
      },
      { label: "Mechanical Engineering", href: "/departments/mechanical-engineering" },
      { label: "Science & Humanities", href: "/departments/science-humanities" },
    ],
  },
  { label: "Research", href: "/research" },
];

/** Footer link columns. Every path is TODO. */
export const footerNav: { title: string; links: NavLink[] }[] = [
  {
    title: "Quick links",
    links: [
      { label: "About us", href: "/about" },
      { label: "Academics", href: "/academics/programmes" },
      { label: "Admission", href: "/admissions" },
      { label: "Research", href: "/research" },
      { label: "Student life", href: "/student-life" },
    ],
  },
  {
    // These are probably separate systems (portal, library catalogue, payments) whose real URLs
    // replace these paths once known.
    title: "E-services",
    links: [
      { label: "Student portal", href: "/e-services/student-portal" },
      { label: "Online library", href: "/e-services/online-library" },
      { label: "Hostel booking", href: "/e-services/hostel-booking" },
      { label: "Fee payment", href: "/e-services/fee-payment" },
      { label: "Downloads", href: "/downloads" },
    ],
  },
];
