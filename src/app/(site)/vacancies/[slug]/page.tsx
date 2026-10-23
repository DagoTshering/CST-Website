import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { VacancyArticle } from "@/components/vacancy/VacancyArticle";
import { site } from "@/content/site";
import { getPublishedVacancy } from "@/lib/cms/resources/vacancies";
import { vacancyCategoryLabel } from "@/lib/vacancies";

type Props = PageProps<"/vacancies/[slug]">;

// Each post's page is static: generated from the database (Admin › Vacancies) on its first
// request, then served from the cache, which the admin panel refreshes on every change. A
// request waits for that whole generation, so an unknown or unpublished address is a real 404
// (src/proxy.ts answers addresses that are not a published post before anything is generated).
export const ensureStatic = "navigation";

/** The build has no database; Next.js needs one entry here, answered with a 404. */
const PLACEHOLDER = "_";

export function generateStaticParams() {
  return [{ slug: PLACEHOLDER }];
}

const load = async (params: Props["params"]) => {
  const { slug } = await params;
  return slug === PLACEHOLDER ? null : getPublishedVacancy(slug);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await load(params);
  if (!post) return {};
  return {
    title: { absolute: `${post.title} | Vacancies | ${site.name}` },
    description: post.excerpt || `${vacancyCategoryLabel(post.category)}, ${site.name}.`,
  };
}

/** The post itself: it reads the address, so it sits in Suspense (see the page). */
async function Post({ params }: Pick<Props, "params">) {
  const post = await load(params);
  if (!post) notFound();
  return <VacancyArticle post={post} />;
}

// The address is read inside Suspense, so a navigation here can show the frame at once; a
// direct visit never sees the fallback.
export default function VacancyPage({ params }: Props) {
  return (
    <div className="bg-white">
      <Suspense fallback={<div aria-busy="true" className="container-page min-h-[80vh]" />}>
        <Post params={params} />
      </Suspense>
    </div>
  );
}
