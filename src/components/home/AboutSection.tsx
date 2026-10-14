import Image from "next/image";

import { about } from "@/content/home";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

/** Editorial introduction with campus imagery, followed by the vision and mission. */
export function AboutSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="py-20 sm:py-24 lg:py-32">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="relative lg:col-span-6 lg:pb-16">
            <figure>
              <Image
                src={about.image.src}
                alt={about.image.alt}
                width={about.image.width}
                height={about.image.height}
                sizes="(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw"
                className="aspect-[4/3] w-full rounded-card object-cover"
              />
              <figcaption className="mt-3 text-xs text-muted">
                The CST campus at Rinchending, above Phuentsholing.
              </figcaption>
            </figure>
            <Image
              src={about.secondaryImage.src}
              alt={about.secondaryImage.alt}
              width={about.secondaryImage.width}
              height={about.secondaryImage.height}
              sizes="13rem"
              className="absolute -right-6 bottom-0 hidden aspect-[3/4] w-48 rounded-card border-8 border-white object-cover shadow-lift sm:block xl:-right-10 xl:w-52"
            />
          </div>

          <div className="lg:col-span-6 lg:pt-4">
            <SectionHeading eyebrow="About CST" title={about.heading} id="about-title" />
            <p className="mt-7 font-display text-xl leading-relaxed font-medium text-navy">
              {about.lead}
            </p>
            <p className="mt-5 leading-relaxed text-muted">{about.body}</p>

            <ul className="mt-8 grid gap-4 border-l-2 border-brand pl-6">
              {about.objectives.map((objective) => (
                <li key={objective} className="text-[0.95rem] leading-relaxed text-ink">
                  {objective}
                </li>
              ))}
            </ul>

            <ArrowLink href={about.link.href} className="mt-10">
              {about.link.label}
            </ArrowLink>
          </div>
        </div>

        <dl className="mt-20 grid border-y border-border md:grid-cols-2 lg:mt-24">
          {[
            { term: "Our Vision", text: about.vision },
            { term: "Our Mission", text: about.mission },
          ].map((item, index) => (
            <div
              key={item.term}
              className={`py-10 md:py-12 ${
                index === 0
                  ? "md:pr-12"
                  : "border-t border-border md:border-t-0 md:border-l md:pl-12"
              }`}
            >
              <dt className="text-xs font-semibold tracking-[0.18em] text-brand-strong uppercase">
                {item.term}
              </dt>
              <dd className="mt-4 font-display text-2xl leading-snug font-semibold text-navy sm:text-[1.75rem]">
                &ldquo;{item.text}&rdquo;
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
