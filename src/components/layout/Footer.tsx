import { cacheLife } from "next/cache";
import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/Button";
import {
  ArrowUpIcon,
  ClockIcon,
  ExternalIcon,
  FacebookIcon,
  InstagramIcon,
  MailIcon,
  MapPinIcon,
  YouTubeIcon,
} from "@/components/ui/icons";
import { SmartLink } from "@/components/ui/SmartLink";
import { footer, site, type NavLink, type SocialNetwork } from "@/content/site";

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

function ColumnTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="eyebrow relative pb-3 text-white after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-9 after:bg-linear-to-r after:from-primary after:from-60% after:to-accent after:to-60%">
      {children}
    </h2>
  );
}

function LinkColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <nav aria-label={title}>
      <ColumnTitle>{title}</ColumnTitle>
      <ul className="mt-5 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <SmartLink
              href={link.href}
              className="group inline-block text-small leading-snug text-on-dark transition-[color,translate] duration-200 ease-out-soft hover:translate-x-1 hover:text-white"
            >
              {link.label}
              {/* inline, so it follows the last word when a label wraps */}
              {link.href.startsWith("http") && (
                <ExternalIcon className="ml-1 inline-block size-3.5 align-[-0.15em] text-accent/70 transition-colors group-hover:text-accent" />
              )}
            </SmartLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export async function Footer() {
  const year = await currentYear();
  const { quickLinks, eServices, hours, address } = footer;

  return (
    <footer className="bg-primary-night text-on-dark [--focus-ring:var(--color-accent)]">
      <div className="container-page">
        <div className="grid gap-x-10 gap-y-12 py-14 min-[480px]:grid-cols-2 lg:grid-cols-[1.15fr_0.85fr_1fr_1.15fr] lg:py-16">
          <LinkColumn title={quickLinks.title} links={quickLinks.links} />
          <LinkColumn title={eServices.title} links={eServices.links} />

          <div>
            <ColumnTitle>{hours.title}</ColumnTitle>
            <dl className="mt-5 space-y-2 text-small">
              {hours.schedule.map(({ days, time }) => (
                <div key={days} className="flex gap-3">
                  <ClockIcon className="mt-0.5 size-4.5 shrink-0 text-accent" />
                  <dt className="w-16 shrink-0 text-white">{days}</dt>
                  <dd>{time}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-col items-start gap-3">
              {hours.actions.map((action) => (
                <ButtonLink
                  key={action.label}
                  href={action.href}
                  variant="secondary"
                  tone="dark"
                  className="min-h-11 w-full max-w-64 px-4 py-2.5 text-small"
                >
                  {action.label}
                </ButtonLink>
              ))}
            </div>
          </div>

          <div>
            <ColumnTitle>{address.title}</ColumnTitle>
            <address className="mt-5 space-y-4 text-small not-italic">
              <p className="flex gap-3">
                <MapPinIcon className="mt-0.5 size-4.5 shrink-0 text-accent" />
                <span>
                  {address.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </p>
              {address.contacts.map(({ label, value, href }) => (
                <p key={label} className="flex gap-3">
                  <MailIcon className="mt-0.5 size-4.5 shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="block text-white">{label}</span>
                    <a href={href} className="break-words transition-colors hover:text-white">
                      {value}
                    </a>
                  </span>
                </p>
              ))}
            </address>

            {/* where to follow the college, with the other ways to reach it */}
            <div className="mt-6">
              <p className="text-small text-white">Follow us</p>
              <ul className="mt-3 flex gap-3" aria-label="CST on social media">
                {site.social.map(({ network, label, href }) => {
                  const Icon = socialIcons[network];
                  return (
                    <li key={network}>
                      <SmartLink
                        href={href}
                        aria-label={label}
                        className="grid size-11 place-items-center rounded-full border border-white/20 text-accent transition duration-200 ease-out-soft hover:-translate-y-0.5 hover:border-accent hover:bg-white/10 hover:text-white"
                      >
                        <Icon className="size-[1.125rem]" />
                      </SmartLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-[0.8125rem] text-on-dark-muted sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 sm:flex sm:flex-wrap sm:gap-x-6 sm:space-y-0">
            <p className="text-on-dark">{footer.bottomLine}</p>
            <p>
              © {year} {site.name}. All rights reserved.
            </p>
          </div>
          <a
            href="#top"
            className="group inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-white/20 py-2 pr-4 pl-3 text-on-dark transition-colors duration-200 hover:border-accent hover:text-white sm:self-auto"
          >
            <ArrowUpIcon className="size-4 text-accent transition-transform duration-200 ease-out-soft group-hover:-translate-y-0.5" />
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
