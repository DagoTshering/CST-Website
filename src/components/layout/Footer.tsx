import Image from "next/image";

import { images } from "@/content/images";
import {
  contact,
  footerQuickLinks,
  footerResources,
  relatedLinks,
  site,
  type NavLink,
} from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { WeaveBand } from "@/components/ui/WeaveBand";

function LinkColumn({ title, links, id }: { title: string; links: NavLink[]; id: string }) {
  return (
    <nav aria-labelledby={`${id}-heading`} id={id}>
      <h2
        id={`${id}-heading`}
        className="text-xs font-semibold tracking-[0.18em] text-brand uppercase"
      >
        {title}
      </h2>
      <ul className="mt-5 grid gap-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-[0.95rem] text-on-navy-muted transition-colors hover:text-white"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="bg-navy-deep text-white">
      <WeaveBand className="text-brand/30" />
      <Container className="pt-16 pb-10 lg:pt-20">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-4">
            <a href="#top" className="inline-flex items-center gap-4">
              <span className="grid size-16 place-items-center rounded-full bg-white p-1">
                <Image
                  src={images.logo.src}
                  alt={images.logo.alt}
                  width={images.logo.width}
                  height={images.logo.height}
                  className="size-full"
                />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-lg font-bold">{site.name}</span>
                <span className="block text-sm text-on-navy-muted">{site.university}</span>
              </span>
            </a>
            <p className="mt-6 max-w-sm text-[0.95rem] leading-relaxed text-on-navy-muted">
              {site.description}
            </p>
          </div>

          <div className="lg:col-span-2">
            <LinkColumn title="Quick Links" links={footerQuickLinks} id="quick-links" />
          </div>
          <div className="lg:col-span-3">
            <LinkColumn title="Resources" links={footerResources} id="resources" />
          </div>

          <address className="not-italic sm:col-span-2 lg:col-span-3">
            <h2 className="text-xs font-semibold tracking-[0.18em] text-brand uppercase">
              Contact
            </h2>
            <p className="mt-5 text-[0.95rem] leading-relaxed text-on-navy-muted">
              {contact.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
              <span className="block">
                {contact.postBox}, Postal Code {contact.postalCode}
              </span>
            </p>
            <ul className="mt-5 grid gap-2 text-[0.95rem]">
              <li>
                <a
                  href={contact.phoneHref}
                  className="inline-flex items-center gap-2.5 text-white hover:text-brand"
                >
                  <Icon name="phone" className="text-brand" />
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-2.5 text-white hover:text-brand"
                >
                  <Icon name="mail" className="text-brand" />
                  {contact.email}
                </a>
              </li>
            </ul>
            <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {contact.hours.map((row) => (
                <div key={row.days} className="contents">
                  <dt className="text-on-navy-muted">{row.days}</dt>
                  <dd className="text-white">{row.time}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-sm text-on-navy-muted">
              Web manager:{" "}
              <a href={`mailto:${contact.webManagerEmail}`} className="text-white hover:text-brand">
                {contact.webManagerEmail}
              </a>
            </p>
          </address>
        </div>

        <nav
          aria-label="Related institutions"
          className="mt-14 border-t border-border-on-navy pt-8"
        >
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-on-navy-muted">
            {relatedLinks.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-8 flex flex-col gap-2 border-t border-border-on-navy pt-8 text-sm text-on-navy-muted sm:flex-row sm:justify-between">
          <p>
            © {site.copyrightYear} {site.name}. All rights reserved.
          </p>
          <p>{site.university}</p>
        </div>
      </Container>
    </footer>
  );
}
