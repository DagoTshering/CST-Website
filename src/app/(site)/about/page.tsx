import type { Metadata } from "next";
import { Suspense } from "react";

import { Centres } from "@/components/about/Centres";
import { Intro } from "@/components/about/Intro";
import { NameTimeline } from "@/components/about/NameTimeline";
import { Offer } from "@/components/about/Offer";
import { Vision } from "@/components/about/Vision";
import { ButtonLink } from "@/components/ui/Button";
import { ClosingBlock } from "@/components/ui/ClosingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import { loadPublished } from "@/lib/cms/public";
import { getPublishedAboutPage } from "@/lib/cms/resources/about-page";

const INTRO =
  "One of the constituent colleges of the Royal University of Bhutan, at Rinchending, Phuentsholing.";

export const metadata: Metadata = {
  title: { absolute: `About | ${site.name}` },
  description: `The ${site.name} is one of the constituent colleges of the ${site.university}, at Rinchending, Phuentsholing: its history, vision, programmes and research and innovation centres.`,
};

/**
 * The page's content: read from the database at request time (Admin › About Page), through a
 * cached query the admin panel refreshes on every change.
 */
async function Content() {
  const result = await loadPublished("About page", getPublishedAboutPage);
  if (!result.ok || !result.data) {
    return (
      <p className="container-page py-16 text-copy">
        {result.ok
          ? "This page is being written. Please check back soon."
          : "This page cannot be shown at the moment. Please try again later."}
      </p>
    );
  }
  const about = result.data;
  return (
    <>
      <Intro content={about.intro} />
      <NameTimeline content={about.names} />
      <Vision content={about.vision} />
      <Offer content={about.offer} />
      <Centres content={about.centres} />
    </>
  );
}

/**
 * About CST (replacing cst.edu.bt/about-us, which redirects here): the title band shared by the
 * inner pages, the college, its names on a scroll-driven timeline, the vision, what it offers,
 * the research and innovation centres, and ways on.
 */
export default function AboutPage() {
  return (
    <div className="bg-white">
      <PageHeader title="About the college" intro={INTRO} />
      <Suspense fallback={<div aria-busy="true" className="container-page min-h-[80vh]" />}>
        <Content />
      </Suspense>
      {/* flow-root keeps the block's bottom margin inside the white page */}
      <div className="container-page flow-root">
        <ClosingBlock
          reveal
          // the space of the sections above it (section-top)
          style={{ marginTop: "clamp(4rem, 3rem + 3vw, 6.5rem)" }}
          eyebrow="Explore further"
          title="See what is taught, and who studies here"
          text="Browse the programmes, meet the student clubs, or get in touch with the right office."
        >
          <ButtonLink href="/programmes">Programmes</ButtonLink>
          <ButtonLink href="/student-hub" variant="secondary">
            Student Hub
          </ButtonLink>
          <ButtonLink href="/contact" variant="secondary">
            Contact
          </ButtonLink>
        </ClosingBlock>
      </div>
    </div>
  );
}
