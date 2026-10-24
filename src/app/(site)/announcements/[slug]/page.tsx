import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import s from "@/components/announcements/NoticeBoard.module.css";
import { NoticeSheet } from "@/components/announcements/NoticeSheet";
import { site } from "@/content/site";
import { getPublishedAnnouncement } from "@/lib/cms/resources/announcements";

type Props = PageProps<"/announcements/[slug]">;

// Each notice's page is static: generated from the database (Admin › Announcements) on its first
// request, then served from the cache, which the admin panel refreshes on every change. A
// request waits for that whole generation, so an unknown or unpublished address is a real 404
// (src/proxy.ts answers addresses that are not a published notice before anything is generated).
export const ensureStatic = "navigation";

/** The build has no database; Next.js needs one entry here, answered with a 404. */
const PLACEHOLDER = "_";

export function generateStaticParams() {
  return [{ slug: PLACEHOLDER }];
}

const load = async (params: Props["params"]) => {
  const { slug } = await params;
  return slug === PLACEHOLDER ? null : getPublishedAnnouncement(slug);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const notice = await load(params);
  if (!notice) return {};
  return {
    title: { absolute: `${notice.title} | Announcements | ${site.name}` },
    description: notice.summary ?? `A notice from the ${site.name}.`,
  };
}

/** The notice itself: it reads the address, so it sits in Suspense (see the page). */
async function Notice({ params }: Pick<Props, "params">) {
  const notice = await load(params);
  if (!notice) notFound();
  return <NoticeSheet notice={notice} />;
}

export default function AnnouncementPage({ params }: Props) {
  return (
    <div className={`graph-paper bg-paper-soft ${s.page}`}>
      <Suspense fallback={<div aria-busy="true" className="container-page min-h-[80vh]" />}>
        <Notice params={params} />
      </Suspense>
    </div>
  );
}
