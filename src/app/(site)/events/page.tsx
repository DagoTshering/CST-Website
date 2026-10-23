import type { Metadata } from "next";
import { Suspense } from "react";

import { EventsList, EventsListSkeleton } from "@/components/events/EventsList";
import { PageHeader } from "@/components/ui/PageHeader";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: "Events",
  description: `Upcoming and past events, celebrations and campus highlights at the ${site.name}.`,
};

/**
 * The Events page: a static heading, then the published events, which are read from the
 * database at request time (managed in the admin panel under Events).
 */
export default function EventsPage() {
  return (
    <div className="bg-white">
      <PageHeader
        eyebrow="Campus life"
        title="Events"
        intro="Celebrations, competitions, talks and campus highlights at the college, coming up and in years past."
      />
      <Suspense fallback={<EventsListSkeleton />}>
        <EventsList />
      </Suspense>
    </div>
  );
}
