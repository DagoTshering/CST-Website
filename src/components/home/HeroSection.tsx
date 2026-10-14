import Image from "next/image";

import { hero } from "@/content/home";
import { site } from "@/content/site";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Container } from "@/components/ui/Container";
import { WeaveBand } from "@/components/ui/WeaveBand";

/** Editorial split hero: navy text panel, campus photograph bleeding to the right edge. */
export function HeroSection() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative flex flex-col overflow-hidden bg-navy text-white lg:block"
    >
      {/* Photograph — stacked below the text on small screens, bleeding right on desktop. */}
      <div className="relative order-2 aspect-[4/3] sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:right-0 lg:aspect-auto lg:w-[45%]">
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          priority
          sizes="(min-width: 1024px) 45vw, 100vw"
          className="object-cover object-[30%_75%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-navy/50 via-transparent to-transparent lg:bg-gradient-to-r lg:from-navy/40"
        />

        <figure className="absolute bottom-16 -left-24 hidden w-64 border-[6px] border-navy shadow-lift lg:block xl:w-72">
          <Image
            src={hero.inset.src}
            alt={hero.inset.alt}
            width={hero.inset.width}
            height={hero.inset.height}
            sizes="18rem"
            className="aspect-[4/3] object-cover"
          />
        </figure>
      </div>

      <Container className="relative order-1">
        <div className="py-16 sm:py-20 lg:w-[55%] lg:py-28 lg:pr-16 xl:py-32">
          <p className="flex items-center gap-3 text-xs font-semibold tracking-[0.22em] text-brand uppercase">
            <span aria-hidden="true" className="h-px w-10 bg-brand" />
            {hero.eyebrow}
          </p>
          <h1 id="hero-title" className="mt-6 text-display font-extrabold">
            <span className="block">{hero.headline[0]}</span>
            <span className="block text-brand">{hero.headline[1]}</span>
          </h1>
          <p className="mt-7 max-w-xl text-lg leading-relaxed text-on-navy-muted">{hero.intro}</p>
          <div className="mt-10 flex flex-wrap gap-4">
            <ButtonLink href={hero.primaryCta.href}>{hero.primaryCta.label}</ButtonLink>
            <ButtonLink href={hero.secondaryCta.href} variant="outline-light">
              {hero.secondaryCta.label}
            </ButtonLink>
          </div>

          <p className="mt-14 max-w-sm border-t border-border-on-navy pt-6 font-display text-sm text-on-navy-muted italic lg:mt-20">
            &ldquo;{site.tagline}&rdquo;
          </p>
        </div>
      </Container>

      <WeaveBand className="relative order-3 text-brand/40" />
    </section>
  );
}
