import { AboutEmblem } from "@/components/home/AboutEmblem";
import { Plate } from "@/components/ui/Plate";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { admission, type EligibilityTrack } from "@/content/admission";

import s from "./Admission.module.css";
import { Checklist } from "./Checklist";

type Group = EligibilityTrack["groups"][number];

/**
 * A bordered table of requirement groups, set in the drawing sheet's lettering: mono column
 * heads and values, Cormorant italic group titles, plain labels.
 */
function RequirementsTable({ caption, groups }: { caption: string; groups: Group[] }) {
  return (
    <div className="overflow-hidden rounded-sm border border-line bg-white/85">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-accent-soft">
          <tr className="border-b border-line">
            <th
              scope="col"
              className="w-1/2 px-4 py-3.5 font-mono text-[11px] font-medium tracking-[0.12em] text-primary-deep uppercase sm:px-5"
            >
              Requirement
            </th>
            <th
              scope="col"
              className="border-l border-line px-4 py-3.5 font-mono text-[11px] font-medium tracking-[0.12em] text-primary-deep uppercase sm:px-5"
            >
              Required
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.title}>
            <tr className="border-t border-line bg-paper-soft/70">
              <th
                scope="rowgroup"
                colSpan={2}
                className="serif-italic px-4 pt-4 pb-3 text-[1.3125rem] leading-snug text-primary-deep sm:px-5"
              >
                {group.title}
              </th>
            </tr>
            {group.rows.map((row) => (
              <tr key={row.label} className="border-t border-line-soft">
                <th scope="row" className="px-4 py-3.5 font-normal text-ink sm:px-5">
                  {row.label}
                </th>
                <td className="border-l border-line-soft px-4 py-3.5 font-mono text-[0.9375rem] text-ink tabular-nums sm:px-5">
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

/**
 * One kind of programme's requirements: its name, the programmes it covers, and two tables side
 * by side on a desktop, so the whole of it fits one screen: the first group (the minimum marks)
 * on the left, the rest (selection and ability ratings) on the right.
 */
function Requirements({ track }: { track: EligibilityTrack }) {
  const id = `requirements-${track.title.toLowerCase()}`;
  const covers = admission.programmes
    .filter((p) => p.testType === track.testType)
    .map((p) => p.name);
  const [first, ...rest] = track.groups;

  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="serif-italic text-[2rem] leading-tight text-ink">
        {track.title}
      </h3>
      <p className="mt-2 max-w-[48em] text-small leading-relaxed text-muted">
        Applies to {new Intl.ListFormat("en-GB").format(covers)}.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
        <RequirementsTable caption={`${track.title}: ${first.title}`} groups={[first]} />
        <RequirementsTable
          caption={`${track.title}: ${rest.map((g) => g.title.toLowerCase()).join(" and ")}`}
          groups={rest}
        />
      </div>
    </section>
  );
}

/**
 * Who can apply: a photograph beside the short checklist, then the full requirements,
 * Architecture and then Engineering, in the left two thirds on a desktop. The right third holds
 * the CST emblem drawing from About, its gear slowly turning, on graph paper fading into the
 * white all round; it stays in view while the tables scroll past.
 */
export function Eligibility() {
  const { checklist, tracks } = admission.eligibility;

  return (
    <section id="eligibility" aria-labelledby="eligibility-title" className="section-top">
      <div className="container-page grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="lg:order-last lg:col-span-6">
          <SectionHeading id="eligibility-title" label="Who can apply">
            Eligibility
          </SectionHeading>
          <p className="mt-6 max-w-[34em] text-copy">
            To apply for any of the programmes above, you need:
          </p>
          <Checklist items={checklist} className="mt-6" />
        </div>
        <Plate
          photo={admission.photos.lab}
          fig={1}
          caption={admission.photos.lab.caption}
          sizes="(min-width: 1440px) 560px, (min-width: 1024px) 45vw, 100vw"
          className="lg:col-span-6"
        />
      </div>

      <div className={`mt-4 py-16 lg:py-24 ${s.band}`}>
        <div className="container-page grid gap-20 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-x-10">
          <div className="relative z-10 grid gap-20 lg:gap-24">
            {tracks.map((track) => (
              <Requirements key={track.title} track={track} />
            ))}
          </div>
          <div aria-hidden="true" className="hidden lg:block">
            <div className={s.drawing}>
              <div className={`graph-paper bg-paper-soft ${s.paper}`} />
              <div data-reveal suppressHydrationWarning className={s.emblem}>
                <AboutEmblem caption="Ø 976 · SCALE 1:1 · FIG. 02" halo="#ffffff" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
