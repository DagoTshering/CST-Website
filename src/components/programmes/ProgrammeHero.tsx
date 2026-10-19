import { Building2, Clock, GraduationCap } from "lucide-react";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { HeroFacts, PageHero, PhotoCollage } from "@/components/ui/PageHero";
import h from "@/components/ui/PageHero.module.css";
import { degreeShort, type Programme } from "@/content/programmes";

import s from "./Programmes.module.css";

/** What each placeholder frame stands in for, until the programme's photos are added. */
const PLACEHOLDERS = ["campus", "lab or studio", "students"];

/** A visible arrow for links that open another site (SmartLink says so to screen readers). */
const Out = () => <span aria-hidden="true">↗</span>;

/**
 * The photo collage: with no images yet, three placeholder frames; with one, two or three
 * images, that many photographs. Adding a programme's photos is done in its Photos (Admin ›
 * Academic Programmes).
 */
const collage = (images: string[]) =>
  images.length
    ? images.map((src) => ({ src, label: "" }))
    : PLACEHOLDERS.map((label) => ({ label }));

/** The breadcrumb back to the listing; the programme's own name follows once it is known. */
function Crumb({ name }: { name?: string }) {
  return (
    <nav className={`container-page ${s.crumb}`} aria-label="Breadcrumb">
      <ol>
        <li>
          <Link href="/programmes">Programmes</Link>
        </li>
        {name && <li aria-current="page">{name}</li>}
      </ol>
    </nav>
  );
}

/**
 * Shown for a moment while a navigation fetches a programme's content: the breadcrumb and an
 * empty hero of the same height, so the page does not jump when the content arrives.
 */
export function ProgrammeFallback() {
  return (
    <>
      <Crumb />
      <div className={`${h.hero} ${s.heroPending}`} aria-busy="true" />
    </>
  );
}

/** The top of a programme's page: what it is, two ways on, three facts, and photographs. */
export function ProgrammeHero({ programme: p }: { programme: Programme }) {
  return (
    <>
      <Crumb name={p.name} />

      <PageHero
        id="programme-title"
        eyebrow={
          <>
            {p.level === "bachelor" ? "Bachelor's programme" : "Master's programme"}
            {p.since && ` · since ${p.since}`}
          </>
        }
        title={p.name}
        lede={p.summary}
        actions={
          <>
            {p.documentFile || p.documentUrl ? (
              // the PDF when there is one, else the link; the structure section offers both
              <ButtonLink href={(p.documentFile ?? p.documentUrl)!}>
                Programme document <Out />
              </ButtonLink>
            ) : (
              <ButtonLink href="#entry-requirements">Entry requirements</ButtonLink>
            )}
            {p.departmentUrl && (
              <ButtonLink href={p.departmentUrl} variant="secondary">
                Departmental website <Out />
              </ButtonLink>
            )}
          </>
        }
        facts={
          <HeroFacts
            facts={[
              { icon: <Clock strokeWidth={1.5} />, value: p.duration, term: "Duration" },
              {
                icon: <GraduationCap strokeWidth={1.5} />,
                value: degreeShort(p),
                term: "Degree",
                label: p.degree,
              },
              {
                icon: <Building2 strokeWidth={1.5} />,
                value: p.departmentName ?? "College of Science and Technology",
                term: "Department",
                label: p.departmentKey ? `Department · ${p.departmentKey}` : "College level",
                small: true,
              },
            ]}
          />
        }
        aside={<PhotoCollage photos={collage(p.images)} />}
      />
    </>
  );
}
