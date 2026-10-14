import Image from "next/image";

import { facilities, facilitiesIntro, studentSupport, type Facility } from "@/content/home";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/ui/SectionHeading";

function FacilityLink({ facility }: { facility: Facility }) {
  if (!facility.href) return null;
  return (
    <a
      href={facility.href}
      aria-label={`Learn more about ${facility.title}`}
      className="absolute inset-0 z-10 rounded-card focus-visible:outline-offset-4"
    />
  );
}

/** Featured facility: tall image with an overlapping caption panel. */
function FeaturedFacility({ facility }: { facility: Facility }) {
  return (
    <article className="group relative lg:h-full">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card sm:aspect-[16/11] lg:aspect-auto lg:h-full lg:min-h-[38rem]">
        <Image
          src={facility.image.src}
          alt={facility.image.alt}
          fill
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="object-cover object-[50%_60%] transition-transform duration-700 group-hover:scale-[1.03]"
        />
      </div>
      <div className="relative -mt-16 mr-6 ml-0 bg-white p-7 shadow-lift sm:mr-24 sm:p-9 lg:absolute lg:bottom-0 lg:left-0 lg:mt-0 lg:mr-0 lg:max-w-md">
        <span className="font-mono text-xs text-brand-strong">01</span>
        <h3 className="mt-2 text-2xl font-bold text-navy">{facility.title}</h3>
        <p className="mt-3 leading-relaxed text-muted">{facility.description}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-navy group-hover:text-brand-strong">
          Learn more
          <Icon
            name="arrow"
            className="text-brand transition-transform group-hover:translate-x-1"
          />
        </span>
      </div>
      <FacilityLink facility={facility} />
    </article>
  );
}

/** Supporting facility: compact image beside its text. */
function CompactFacility({ facility, index }: { facility: Facility; index: number }) {
  return (
    <article className="group relative grid gap-6 border-t border-border pt-8 sm:grid-cols-[minmax(0,15rem)_1fr] lg:grid-cols-1 xl:grid-cols-[minmax(0,13rem)_1fr]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-card sm:aspect-square lg:aspect-[16/9] xl:aspect-square">
        <Image
          src={facility.image.src}
          alt={facility.image.alt}
          fill
          sizes="(min-width: 1280px) 13rem, (min-width: 1024px) 40vw, (min-width: 640px) 15rem, 100vw"
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      </div>
      <div>
        <span className="font-mono text-xs text-brand-strong">
          {String(index + 2).padStart(2, "0")}
        </span>
        <h3 className="mt-2 text-xl font-bold text-navy group-hover:text-brand-strong">
          {facility.title}
        </h3>
        <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">{facility.description}</p>
      </div>
      <FacilityLink facility={facility} />
    </article>
  );
}

/** Asymmetric, image-led facilities showcase. */
export function FacilitiesSection() {
  const [featured, ...rest] = facilities;
  return (
    <section
      id="facilities"
      aria-labelledby="facilities-title"
      className="bg-surface py-20 sm:py-24 lg:py-32"
    >
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-16">
          <SectionHeading
            eyebrow="Facilities"
            title={facilitiesIntro.heading}
            id="facilities-title"
            className="lg:col-span-6"
          />
          <p className="text-lg leading-relaxed text-muted lg:col-span-6 lg:pb-1">
            {facilitiesIntro.text}
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <FeaturedFacility facility={featured} />
          </div>
          <div className="flex flex-col gap-10 lg:col-span-5">
            {rest.map((facility, index) => (
              <CompactFacility key={facility.title} facility={facility} index={index} />
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:gap-10">
          <p className="text-xs font-semibold tracking-[0.18em] text-navy uppercase">
            Beyond the classroom
          </p>
          <ul className="flex flex-wrap gap-x-8 gap-y-2 text-[0.95rem] text-muted">
            {studentSupport.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <span aria-hidden="true" className="size-1.5 rotate-45 bg-brand" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
