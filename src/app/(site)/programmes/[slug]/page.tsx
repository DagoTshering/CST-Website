import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProgrammeFallback, ProgrammeHero } from "@/components/programmes/ProgrammeHero";
import { ProgrammeSections } from "@/components/programmes/ProgrammeSections";
import { site } from "@/content/site";
import { getAllProgrammes, getProgramme } from "@/content/programmes";

type Props = { params: Promise<{ slug: string }> };

// Every programme is in src/content/programmes.json, so every page is prerendered at build time.
// An unknown slug waits for the whole page too, so it answers with a real 404 status.
export const ensureStatic = "navigation";

export function generateStaticParams() {
  return getAllProgrammes().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const programme = getProgramme((await params).slug);
  if (!programme) return {};
  return {
    title: { absolute: `${programme.name} | ${site.name}` },
    description: programme.summary,
  };
}

/** The programme itself: it reads the URL's slug, so it sits in Suspense (see the page). */
async function Programme({ params }: Props) {
  const programme = getProgramme((await params).slug);
  if (!programme) notFound();

  return (
    <>
      <ProgrammeHero programme={programme} />
      <ProgrammeSections programme={programme} />
    </>
  );
}

// The params are read inside Suspense, so a navigation here can show the page's frame at once.
// Every page is prerendered whole, so a direct visit never sees the fallback.
export default function ProgrammePage({ params }: Props) {
  return (
    <div className="bg-white">
      <Suspense fallback={<ProgrammeFallback />}>
        <Programme params={params} />
      </Suspense>
    </div>
  );
}
