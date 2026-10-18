import type { Metadata } from "next";

import { ClubIndex } from "@/components/clubs/ClubIndex";
import s from "@/components/clubs/StudentHub.module.css";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import { clubHref, clubs } from "@/lib/clubs";

export const metadata: Metadata = {
  title: { absolute: `Student Hub | ${site.name}` },
  description: `The ${clubs.length} student clubs of the ${site.name}, ${site.university}: what each one does and photos from its activities.`,
};

/**
 * The Student Hub: every student club in an index that fits one laptop screen. A club opens as a
 * pop-up over it (@modal), or as a page of its own when its link is visited directly ([slug]).
 * All from data/clubs.json and the photo script's manifest (see src/lib/clubs.ts).
 */
export default function StudentHubPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Student life"
        title="Student Hub"
        intro="The clubs of the College of Science and Technology: what each one is about, what it does, and the people behind it."
      >
        <p className={s.count}>{clubs.length} clubs</p>
      </PageHeader>
      <div className={`container-page ${s.page}`}>
        <ClubIndex
          items={clubs.map((club) => ({
            href: clubHref(club.slug),
            name: club.name,
            thumbs: club.thumbs,
          }))}
        />
      </div>
    </div>
  );
}
