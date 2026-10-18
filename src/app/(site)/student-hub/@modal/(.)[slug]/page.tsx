import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ClubDetail } from "@/components/clubs/ClubDetail";
import { ClubModal } from "@/components/clubs/ClubModal";
import { clubMetadata, clubs, getClub } from "@/lib/clubs";

type Props = { params: Promise<{ slug: string }> };

const TITLE_ID = "club-popup-title";

/**
 * The club's slug. Under `next dev` (Next.js 16.4) an intercepted route's param arrives with the
 * interception marker in front, once per rebuild ("(.)rovers", "(.)(.)rovers", ...); the
 * production build passes "rovers". Stripping it makes both work.
 */
async function slugOf(params: Props["params"]) {
  return (await params).slug.replace(/^(?:\(\.{1,3}\))+/, "");
}

export function generateStaticParams() {
  return clubs.map((club) => ({ slug: club.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return clubMetadata(await slugOf(params));
}

/** The club itself: it reads the URL's slug, so it sits in Suspense (see below). */
async function Club({ params }: Props) {
  const club = getClub(await slugOf(params));
  if (!club) notFound();
  return <ClubDetail club={club} titleId={TITLE_ID} />;
}

/**
 * A club followed from the list: its page's content in a pop-up over the list. The pop-up opens
 * at once; every club is prerendered, so its content is normally already there.
 */
export default function ClubPopup({ params }: Props) {
  return (
    <ClubModal titleId={TITLE_ID}>
      <Suspense fallback={null}>
        <Club params={params} />
      </Suspense>
    </ClubModal>
  );
}
