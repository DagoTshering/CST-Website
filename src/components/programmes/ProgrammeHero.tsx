import { Building2, Clock, GraduationCap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { degreeShort, type Programme } from "@/content/programmes";

import s from "./Programmes.module.css";

/** What each placeholder frame stands in for, until the programme's photos are added. */
const PLACEHOLDERS = ["campus", "lab or studio", "students"];

/** A visible arrow for links that open another site (SmartLink says so to screen readers). */
const Out = () => <span aria-hidden="true">↗</span>;

/**
 * The photo collage: up to three overlapping framed photographs. With no images yet, three
 * placeholder frames; with one, two or three images, that many photographs. Adding a programme's
 * photos is done in its Photos (Admin › Academic Programmes).
 */
function Collage({ images }: { images: string[] }) {
  const frames = images.length ? images.slice(0, 3) : PLACEHOLDERS.map(() => null);
  return (
    <div
      className={s.collage}
      data-frames={frames.length}
      aria-hidden={images.length ? undefined : true}
    >
      {frames.map((src, i) => (
        <div key={i} className={`${s.photoFrame} ${s[`f${i + 1}`]}`}>
          {src ? (
            <div className={s.photoBox}>
              <Image
                src={src}
                alt=""
                fill
                sizes="(min-width: 900px) 310px, 230px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className={s.placeholder}>Photo · {PLACEHOLDERS[i]}</div>
          )}
        </div>
      ))}
      <span className={s.square} aria-hidden="true" />
    </div>
  );
}

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
      <div className={`${s.hero} ${s.heroPending}`} aria-busy="true" />
    </>
  );
}

/** The top of a programme's page: what it is, two ways on, three facts, and photographs. */
export function ProgrammeHero({ programme: p }: { programme: Programme }) {
  return (
    <>
      <Crumb name={p.name} />

      <section className={s.hero} aria-labelledby="programme-title">
        <div className={`container-page ${s.heroGrid}`}>
          <div>
            <p className={s.eyebrow}>
              {p.level === "bachelor" ? "Bachelor's programme" : "Master's programme"}
              {p.since && ` · since ${p.since}`}
            </p>
            <h1 id="programme-title" className={s.title}>
              {p.name}
            </h1>
            <span className={s.rule} aria-hidden="true" />
            <p className={s.lede}>{p.summary}</p>

            <div className={s.buttons}>
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
            </div>

            <dl className={s.stats}>
              <div className={s.stat}>
                <span className={s.icon}>
                  <Clock strokeWidth={1.5} />
                </span>
                <div>
                  <dt className="sr-only">Duration</dt>
                  <dd className={s.statValue}>{p.duration}</dd>
                  <dd className={s.statLabel} aria-hidden="true">
                    Duration
                  </dd>
                </div>
              </div>
              <div className={s.stat}>
                <span className={s.icon}>
                  <GraduationCap strokeWidth={1.5} />
                </span>
                <div>
                  <dt className="sr-only">Degree</dt>
                  <dd className={s.statValue}>{degreeShort(p)}</dd>
                  <dd className={s.statLabel}>{p.degree}</dd>
                </div>
              </div>
              <div className={s.stat}>
                <span className={s.icon}>
                  <Building2 strokeWidth={1.5} />
                </span>
                <div>
                  <dt className="sr-only">Department</dt>
                  <dd className={`${s.statValue} ${s.statValueSmall}`}>
                    {p.departmentName ?? "College of Science and Technology"}
                  </dd>
                  <dd className={s.statLabel}>
                    {p.departmentKey ? `Department · ${p.departmentKey}` : "College level"}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <Collage images={p.images} />
        </div>
      </section>
    </>
  );
}
