import { Suspense } from "react";

import { About } from "@/components/home/About";
import { Announcements } from "@/components/home/Announcements";
import { Events } from "@/components/home/Events";
import { Facilities } from "@/components/home/Facilities";
import { HeroCampus } from "@/components/home/hero/HeroCampus";
import { Leadership } from "@/components/home/Leadership";
import { MissionVision } from "@/components/home/MissionVision";
import { Programmes } from "@/components/home/Programmes";

/*
 * The sections in Suspense read published content from the database at request time (see
 * lib/cms/public.ts); the rest of the page is static and served instantly.
 */
export default function HomePage() {
  return (
    <>
      <HeroCampus />
      <Suspense>
        <About />
      </Suspense>
      <MissionVision />
      <Suspense>
        <Facilities />
      </Suspense>
      {/* from the homepage on main, in its order */}
      <Suspense>
        <Programmes />
      </Suspense>
      <Suspense>
        <Events />
      </Suspense>
      <Suspense>
        <Leadership />
      </Suspense>
      <Suspense>
        <Announcements />
      </Suspense>
    </>
  );
}
