/**
 * The title band of an inner page, on the homepage's graph paper fading into white above and
 * below (the page under it is white): the page's h1 in the sections' Cormorant italic over the
 * two-tone drafting rule (ink, then gold). Kept short, so the page's content starts close under it.
 */
export function PageHeader({ title }: { title: string }) {
  return (
    <header className="relative isolate bg-white">
      {/* the graph paper, fading into the white above and below it */}
      <div
        aria-hidden="true"
        className="graph-paper absolute inset-0 -z-10 bg-paper-soft [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
      />
      <div className="container-page pt-[clamp(2rem,1.25rem+2vw,3.25rem)] pb-[clamp(1.25rem,1rem+1vw,2rem)] text-center">
        <h1 className="heading-serif text-ink">{title}</h1>
        <span
          aria-hidden="true"
          className="mx-auto mt-5 block h-0.5 w-12 bg-linear-to-r from-sheet-tick from-60% to-sheet-gold to-60%"
        />
      </div>
    </header>
  );
}
