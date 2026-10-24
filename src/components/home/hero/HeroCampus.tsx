"use client";

import dynamic from "next/dynamic";
import { preload } from "react-dom";

import { ButtonLink } from "@/components/ui/Button";
import { cx } from "@/lib/cx";

import campusAerial from "../../../../public/images/home/campus-aerial.jpg";
import { TechBackground } from "./TechBackground";

// WebGL only runs in the browser: load the 3D campus on the client, after the page paints.
const CampusSite3D = dynamic(() => import("./CampusSite3D").then((m) => m.CampusSite3D), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

/**
 * The drone photo the model is coloured from. Its pixel positions match the model, and the trees
 * are placed by its exact colours: never resize or re-encode it. Imported rather than linked so
 * it is served, byte for byte, from a content-hashed address that browsers keep for a year
 * (files linked from public/ are re-checked with the server on every visit).
 */
const AERIAL = campusAerial.src;

/**
 * The two calls to action. On a phone they sit under the model, elsewhere under the tagline, so
 * the hero renders them in both places and shows one (the other is display: none, so screen
 * readers and the keyboard meet them once).
 */
function Actions({ className }: { className: string }) {
  return (
    <div
      className={cx(
        "pointer-events-auto flex flex-col gap-3 min-[420px]:flex-row sm:gap-4",
        className,
      )}
    >
      <ButtonLink href="/programmes" className="flex-1 sm:flex-none sm:px-7 sm:text-[16px]">
        Explore programmes
      </ButtonLink>
      <ButtonLink
        href="/contact"
        variant="secondary"
        className="flex-1 sm:flex-none sm:px-7 sm:text-[16px]"
      >
        Visit the campus
      </ButtonLink>
    </div>
  );
}

/**
 * Homepage hero: the college name on the left, the 3D campus site model on the right.
 * Below lg the copy comes first and the model sits underneath it; on a phone (below md) the
 * buttons come last, under the model.
 * On desktop the hero fills the screen below the header (--header-h: the utility bar and the
 * main row, 116px at the top of the page).
 */
export function HeroCampus() {
  // Fetch the photo alongside the model's code rather than after it (low priority: the copy first).
  preload(AERIAL, { as: "image", fetchPriority: "low" });

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-white lg:block lg:h-[calc(100svh-var(--header-h))] lg:min-h-[600px]">
      {/* live blueprint: grid that bends to the pointer, graph traces, crosshair; both grids fade
          out before the section ends, so nothing runs on into the next one */}
      <TechBackground className="-z-20 [mask-composite:intersect] [mask-image:radial-gradient(ellipse_95%_95%_at_50%_45%,#000_45%,transparent_95%),linear-gradient(to_top,transparent,#000_6rem)]" />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(rgba(46,125,143,.04)_1px,transparent_1px),linear-gradient(90deg,rgba(46,125,143,.04)_1px,transparent_1px)] bg-size-[12px_12px] [mask-composite:intersect] [mask-image:radial-gradient(ellipse_60%_70%_at_68%_50%,#000_10%,transparent_75%),linear-gradient(to_top,transparent,#000_6rem)]" />

      {/* copy: first on small screens, overlaid on the left from lg up */}
      <div className="pointer-events-none relative z-10 mx-auto flex w-full max-w-[1320px] items-center px-4 pt-10 pb-2 sm:px-5 sm:pt-14 lg:h-full lg:py-0">
        <div className="w-full max-w-[640px] lg:max-w-[50%]">
          <p className="text-[12px] font-medium tracking-[0.24em] text-hero-teal uppercase sm:text-[14px] sm:tracking-[0.28em]">
            Royal University of Bhutan
          </p>
          <span className="mt-3 block h-px w-14 bg-hero-gold sm:mt-4" />
          <h1 className="mt-4 font-serif text-[clamp(38px,9.5vw,56px)] leading-[1.04] font-semibold text-balance text-ink sm:mt-5 lg:text-[clamp(44px,4.2vw,72px)]">
            College of
            <br />
            <span className="text-hero-teal">Science &amp; Technology</span>
          </h1>
          <p className="mt-4 text-[16px] text-slate-700 sm:mt-5 sm:text-[19px]">
            In pursuit of preparing for tomorrow’s Technologist
          </p>
          <Actions className="mt-8 max-md:hidden" />
        </div>
      </div>

      {/* the 3D campus: below the copy on small screens, filling the hero from lg up. The survey
          compass under it is wider than the box: its foot fades out (--fade, kept clear of the
          campus at each size) instead of being cut off by the section's edge. */}
      <div className="relative h-[340px] w-full [--fade:3rem] sm:h-[460px] md:h-[520px] md:[--fade:2.5rem] lg:absolute lg:inset-0 lg:h-auto lg:[--fade:9rem] [&_canvas]:[mask-image:linear-gradient(to_top,transparent,#000_var(--fade))]">
        <CampusSite3D embed height="100%" aerialSrc={AERIAL} />
      </div>

      {/* on a phone the buttons come after the model */}
      <Actions className="relative z-10 px-4 pt-2 pb-8 sm:px-5 md:hidden" />
    </section>
  );
}
