import { cacheLife } from "next/cache";
import Image from "next/image";
import Link from "next/link";

import {
  ClockIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  YouTubeIcon,
} from "@/components/ui/icons";
import { SmartLink } from "@/components/ui/SmartLink";
import { footerNav, site, type SocialNetwork } from "@/content/site";

const socialIcons: Record<SocialNetwork, typeof FacebookIcon> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YouTubeIcon,
};

/** The year is cached so the footer can still be prerendered. */
async function currentYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

function ColumnTitle({ children }: { children: string }) {
  return (
    <h2 className="eyebrow relative pb-3 text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-9 after:bg-linear-to-r after:from-primary after:from-60% after:to-accent after:to-60%">
      {children}
    </h2>
  );
}

const linkClass =
  "inline-block py-1 text-small text-on-dark transition-[color,translate] duration-200 ease-out-soft hover:translate-x-1 hover:text-white";

export async function Footer() {
  const year = await currentYear();
  const { contact } = site;

  return (
    <footer className="bg-primary-night text-on-dark [--focus-ring:var(--color-accent)]">
      <div className="container-page grid grid-cols-2 gap-x-8 gap-y-12 pt-16 pb-12 lg:grid-cols-[1.5fr_1fr_1fr_1.3fr] lg:gap-x-10 lg:pt-20">
        <div className="col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-4 rounded-sm">
            <span className="shrink-0 rounded-md bg-white p-2 shadow-sm">
              <Image
                src={site.logos.crest.src}
                alt=""
                width={56}
                height={56}
                sizes="56px"
                className="size-14"
              />
            </span>
            <span className="font-display text-h4 leading-snug font-semibold text-white">
              {site.name}
            </span>
          </Link>
          <p className="mt-5 max-w-xs text-small text-on-dark">{site.tagline}</p>

          <ul className="mt-6 flex gap-3">
            {site.social.map(({ network, label, href }) => {
              const Icon = socialIcons[network];
              return (
                <li key={network}>
                  <SmartLink
                    href={href}
                    aria-label={label}
                    className="grid size-10 place-items-center rounded-full border border-white/20 text-accent transition duration-200 ease-out-soft hover:-translate-y-0.5 hover:border-accent hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="size-[1.125rem]" />
                  </SmartLink>
                </li>
              );
            })}
          </ul>
        </div>

        {footerNav.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <ColumnTitle>{column.title}</ColumnTitle>
            <ul className="mt-5 space-y-1.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <SmartLink href={link.href} className={linkClass}>
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="col-span-2 lg:col-span-1">
          <ColumnTitle>Contact</ColumnTitle>
          <address className="mt-5 space-y-4 text-small not-italic">
            <p className="flex gap-3">
              <MapPinIcon className="mt-0.5 size-4.5 shrink-0 text-accent" />
              <span>
                {contact.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </span>
            </p>
            <p className="flex gap-3">
              <PhoneIcon className="mt-0.5 size-4.5 shrink-0 text-accent" />
              <a href={contact.phone.href} className="transition-colors hover:text-white">
                {contact.phone.label}
              </a>
            </p>
            <p className="flex gap-3">
              <MailIcon className="mt-0.5 size-4.5 shrink-0 text-accent" />
              <a href={contact.email.href} className="transition-colors hover:text-white">
                {contact.email.label}
              </a>
            </p>
            <p className="flex gap-3">
              <ClockIcon className="mt-0.5 size-4.5 shrink-0 text-accent" />
              <span>
                <span className="block text-white">Office hours</span>
                {contact.hours}
              </span>
            </p>
          </address>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-6 text-[0.8125rem] text-on-dark-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.name}. All rights reserved.
          </p>
          <p>A college of the {site.university}</p>
        </div>
      </div>
    </footer>
  );
}
