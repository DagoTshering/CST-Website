import type { Metadata } from "next";

import { Centres } from "@/components/about/Centres";
import { Intro } from "@/components/about/Intro";
import { NameTimeline } from "@/components/about/NameTimeline";
import { Offer } from "@/components/about/Offer";
import { Vision } from "@/components/about/Vision";
import { ButtonLink } from "@/components/ui/Button";
import { ClosingBlock } from "@/components/ui/ClosingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";
import { about } from "@/lib/about";

export async function generateMetadata(): Promise<Metadata> {
  // the first paragraph's opening sentence: what and where the college is
  const [description] = about.paragraphs[0].split(/(?<=\.)\s/);
  return {
    title: { absolute: `About | ${site.name}` },
    description,
  };
}

/**
 * About CST (replacing cst.edu.bt/about-us, which redirects here): the title band shared by the
 * inner pages, the college, its three names on a scroll-driven timeline, the vision, what it
 * offers, the research and innovation centres, and ways on. All from data/about.json
 * (src/lib/about.ts).
 */
export default function AboutPage() {
  return (
    <div className="bg-white">
      <PageHeader
        title={about.title}
        intro="One of the constituent colleges of the Royal University of Bhutan, at Rinchending, Phuentsholing."
      />
      <Intro />
      <NameTimeline />
      <Vision />
      <Offer />
      <Centres />
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
