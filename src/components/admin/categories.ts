import {
  Building2,
  CalendarDays,
  GraduationCap,
  Landmark,
  Megaphone,
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
  leadership: {
    label: "Leadership & Governance",
    href: "/admin/leadership",
    icon: Users,
    description: "Leadership profiles; the first is featured on the homepage.",
    unit: "profiles",
  },
  about: {
    label: "About CST",
    href: "/admin/about",
    icon: Landmark,
    description: "The About CST section: title, introduction and photograph.",
    unit: "section",
  },
};

/** Where to edit a record of a category. */
export function editHref(category: CategoryKey, id: number) {
  return category === "about" ? categories.about.href : `${categories[category].href}/${id}`;
}
