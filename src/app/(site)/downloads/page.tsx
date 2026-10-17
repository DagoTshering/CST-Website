import type { Metadata } from "next";
import { Suspense } from "react";

import { DownloadsList, DownloadsListSkeleton } from "@/components/downloads/DownloadsList";

export const metadata: Metadata = {
  title: "Downloads",
  description:
    "Forms, guidelines, regulations, reports and publications of the College of Science and Technology.",
};

/**
 * The Downloads page: a static heading, then the published downloads, which are read from the
 * database at request time (managed in the admin panel under Downloads).
 */
export default function DownloadsPage() {
  return (
    <>
      <header className="graph-paper border-b border-line bg-paper-soft">
        <div className="container-page py-[clamp(3rem,2rem+4vw,5.5rem)]">
          <p className="eyebrow flex items-center gap-3 text-primary-strong">
            <span
              aria-hidden="true"
              className="block h-px w-10 shrink-0 bg-linear-to-r from-sheet-tick from-60% to-sheet-gold to-60%"
            />
            Resources
          </p>
          <h1 className="mt-4 heading-serif text-ink">Downloads</h1>
          <p className="mt-5 max-w-2xl text-lead text-copy">
            Forms, guidelines, regulations, project reports and publications for students and staff
            of the College of Science and Technology.
          </p>
        </div>
      </header>
      <Suspense fallback={<DownloadsListSkeleton />}>
        <DownloadsList />
      </Suspense>
    </>
  );
}
