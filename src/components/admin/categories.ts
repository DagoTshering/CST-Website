import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileDown,
  GraduationCap,
  Handshake,
  Landmark,
  Megaphone,
  Network,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { CategoryKey } from "@/lib/cms/dashboard";

/** The content categories as the dashboard and the Website Content page present them. */
export const categories: Record<
  CategoryKey,
  { label: string; href: string; icon: LucideIcon; description: string; unit: string }
> = {
  programmes: {
    label: "Academic Programmes",
    href: "/admin/programmes",
    icon: GraduationCap,
    description: "Undergraduate and postgraduate programmes in the Academic section.",
    unit: "programmes",
  },
  facilities: {
    label: "Facilities",
    href: "/admin/facilities",
    icon: Building2,
    description: "The campus facilities carousel.",
    unit: "facilities",
  },
  events: {
    label: "Events",
    href: "/admin/events",
    icon: CalendarDays,
    description: "Campus events, newest first.",
    unit: "events",
  },
  announcements: {
    label: "Announcements",
    href: "/admin/announcements",
    icon: Megaphone,
    description: "Notices, with optional PDF documents.",
    unit: "announcements",
  },
  executives: {
    label: "Executives",
    href: "/admin/executives",
    icon: Network,
    description: "The President and the Deans; the President is also on the homepage.",
    unit: "executives",
  },
  staff: {
    label: "Staff Directory",
    href: "/admin/staff",
    icon: Users,
    description: "Academic and support staff, by department.",
    unit: "staff",
  },
  partners: {
    label: "Partners",
    href: "/admin/partners",
    icon: Handshake,
    description: "International and national partners on the Partners page.",
    unit: "partners",
  },
  downloads: {
    label: "Downloads",
    href: "/admin/downloads",
    icon: FileDown,
    description: "Forms, guidelines and publications on the Downloads page.",
    unit: "downloads",
  },
  vacancies: {
    label: "Vacancies",
    href: "/admin/vacancies",
    icon: BriefcaseBusiness,
    description: "Job vacancies and recruitment notices on the Vacancies page.",
    unit: "posts",
  },
  about: {
    label: "Homepage About",
    href: "/admin/about",
    icon: Landmark,
    description: "The About section on the homepage: title, introduction and photograph.",
    unit: "section",
  },
};

/** Where to edit a record of a category. */
export function editHref(category: CategoryKey, id: number) {
  return category === "about" ? categories.about.href : `${categories[category].href}/${id}`;
}
