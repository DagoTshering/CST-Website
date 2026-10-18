import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ClubDetail } from "@/components/clubs/ClubDetail";
import s from "@/components/clubs/StudentHub.module.css";
import { clubMetadata, clubs, getClub } from "@/lib/clubs";

type Props = { params: Promise<{ slug: string }> };

// Every club is in data/clubs.json, so every page is prerendered at build time. An unknown slug
// waits for the whole page too, so it answers with a real 404 status.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return clubs.map((club) => ({ slug: club.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return clubMetadata((await params).slug);
}

/** The club itself: it reads the URL's slug, so it sits in Suspense (see the page). */
async function Club({ params }: Props) {
  const club = getClub((await params).slug);
  if (!club) notFound();
  return <ClubDetail club={club} heading="h1" />;
}

/**
 * A club's own page: what a shared link, a bookmark or a refresh opens. Followed from the
 * Student Hub's list, the same URL opens as a pop-up instead (@modal/(.)[slug]). Every page is
 * prerendered whole, so a direct visit never sees the Suspense fallback.
 */
export default function ClubPage({ params }: Props) {
  return (
    <div className="bg-white">
      <div className={`container-page ${s.clubPage}`}>
        <Link href="/student-hub" className={s.backLink}>
          <span aria-hidden="true">←</span> All clubs
        </Link>
        <Suspense fallback={null}>
          <Club params={params} />
        </Suspense>
      </div>
    </div>
  );
}
