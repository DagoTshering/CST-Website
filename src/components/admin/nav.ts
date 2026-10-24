import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ClipboardList,
  FileDown,
  GraduationCap,
  Info,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  Network,
  Megaphone,
  Handshake,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

/*
 * The admin panel's navigation. To add a content category: add its pages under
 * src/app/admin/(panel)/<key>/ and an entry here.
 */

export type AdminNavItem = { href: string; label: string; icon: LucideIcon };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

export const adminNav: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/content", label: "Website Content", icon: LayoutGrid },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/about", label: "Homepage About", icon: Landmark },
      { href: "/admin/about-page", label: "About Page", icon: Info },
      { href: "/admin/facilities", label: "Facilities", icon: Building2 },
      { href: "/admin/programmes", label: "Academic Programmes", icon: GraduationCap },
      { href: "/admin/admissions", label: "Admissions", icon: ClipboardList },
      { href: "/admin/events", label: "Events", icon: CalendarDays },
      { href: "/admin/executives", label: "Executives", icon: Network },
      { href: "/admin/staff", label: "Staff Directory", icon: Users },
      { href: "/admin/partners", label: "Partners", icon: Handshake },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/vacancies", label: "Vacancies", icon: BriefcaseBusiness },
      { href: "/admin/downloads", label: "Downloads", icon: FileDown },
    ],
  },
  {
    label: "System",
    items: [{ href: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

const labels = new Map([
  ...adminNav.flatMap((group) => group.items).map((i) => [i.href, i.label] as const),
  ["/admin/downloads/categories", "Categories"] as const,
  ["/admin/staff/departments", "Departments"] as const,
  ["/admin/staff/designations", "Designations"] as const,
  ["/admin/about-page/names", "Names"] as const,
  ["/admin/about-page/centres", "Centres"] as const,
  ["/admin/admissions/dates", "Dates"] as const,
  ["/admin/admissions/steps", "Steps"] as const,
  ["/admin/admissions/requirements", "Requirements"] as const,
  ["/admin/admissions/faq", "Questions"] as const,
]);

/** Path segments shared by several sections, as the breadcrumbs name them. */
const PATH_WORDS: Record<string, string> = {
  new: "New",
  arrange: "Arrange",
  modules: "Modules",
  facilities: "Facilities",
};

/** Breadcrumb trail for an admin path: /admin/events/12 -> Dashboard › Events › Edit. */
export function breadcrumbsFor(pathname: string) {
  const parts = pathname.split("/").filter(Boolean).slice(1); // drop "admin"
  const trail = [{ href: "/admin", label: "Dashboard" }];
  let href = "/admin";
  for (const part of parts) {
    href += `/${part}`;
    const label = labels.get(href) ?? (/^\d+$/.test(part) ? "Edit" : (PATH_WORDS[part] ?? part));
    trail.push({ href, label });
  }
  return trail;
}

export function isActive(pathname: string, href: string) {
  return href === "/admin"
    ? pathname === "/admin"
    : pathname === href || pathname.startsWith(`${href}/`);
}
