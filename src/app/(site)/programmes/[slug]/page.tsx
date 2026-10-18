import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProgrammeFallback, ProgrammeHero } from "@/components/programmes/ProgrammeHero";
import { ProgrammeSections } from "@/components/programmes/ProgrammeSections";
import { site } from "@/content/site";
import { getAdmission, getPublishedProgramme } from "@/lib/cms/resources/programme-pages";

type Props = PageProps<"/programmes/[slug]">;

// Each programme's page is static: generated from the database (Admin › Academic Programmes) on
// its first request, then served from the cache, which the admin panel refreshes on every change.
// A request waits for that whole generation, Suspense included, so an unknown slug answers with a
// real 404 status.
export const ensureStatic = "navigation";

/**
 * The build has no database, so no programme is generated then. Next.js requires at least one
 * entry here; this placeholder is answered with a 404 without reading the database.
 */
const PLACEHOLDER = "_";

export function generateStaticParams() {
  return [{ slug: PLACEHOLDER }];
}

const load = async (params: Props["params"]) => {
  const { slug } = await params;
  return slug === PLACEHOLDER ? null : getPublishedProgramme(slug);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const programme = await load(params);
  if (!programme) return {};
  return {
    title: { absolute: `${programme.name} | ${site.name}` },
    description: programme.summary,
  };
}

/** The programme itself: it reads the URL's slug, so it sits in Suspense (see the page). */
async function Programme({ params }: Pick<Props, "params">) {
  const programme = await load(params);
  if (!programme) notFound();
  const admission = programme.level === "bachelor" ? await getAdmission() : null;

  return (
    <>
      <ProgrammeHero programme={programme} />
      <ProgrammeSections programme={programme} admission={admission} />
    </>
  );
}

// The slug is read inside Suspense, so a navigation here shows the page's frame at once (the
// shell links prefetch is shared by every programme). A direct visit never sees the fallback.
export default function ProgrammePage({ params }: Props) {
  return (
    <div className="bg-white">
      <Suspense fallback={<ProgrammeFallback />}>
        <Programme params={params} />
      </Suspense>
    </div>
  );
}
