import Image from "next/image";
import Link from "next/link";

import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { mainNav, site } from "@/content/site";
import { cx } from "@/lib/cx";

import { DesktopNav } from "./DesktopNav";
import { MobileMenu } from "./MobileMenu";

const { contact, logos } = site;

const contacts = [
  { icon: MapPinIcon, label: "Location", value: contact.location },
  { icon: PhoneIcon, label: "Call us", value: contact.phone.label, href: contact.phone.href },
  { icon: MailIcon, label: "Email", value: contact.email.label, href: contact.email.href },
];

/**
 * Site header. On large screens the white top row scrolls away and the menu bar sticks (the
 * header's negative sticky offset equals the top row's height). Its heights come from the
 * --header-* variables in globals.css, which the hero also uses to fill exactly one screen. Below that, the single compact
 * row sticks and the menu opens in a panel.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-md lg:top-[calc(var(--header-row-h)*-1)]">
      <div className="container-page flex h-(--header-row-h) items-center justify-between gap-4 lg:gap-6">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 rounded-sm lg:gap-4"
          aria-label={`${site.name}, home`}
        >
          <Image
            src={logos.crest.src}
            alt=""
            width={64}
            height={64}
            sizes="(min-width: 64rem) 64px, 48px"
            loading="eager"
            className="size-11 shrink-0 sm:size-12 lg:size-16"
          />
          <span className="min-w-0 leading-tight">
            <span className="block max-w-[10.5rem] font-display text-[0.875rem] leading-[1.2] font-semibold text-ink transition-colors group-hover:text-primary-strong sm:max-w-none sm:text-[1.0625rem] lg:text-[1.25rem] lg:whitespace-nowrap">
              {site.name}
            </span>
            <span className="mt-1 hidden text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase sm:block lg:text-[0.75rem]">
              {site.university}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-3 lg:gap-8">
          <ul className="hidden items-center gap-8 lg:flex">
            {contacts.map(({ icon: Icon, label, value, href }) => (
              <li key={label} className={cx("flex items-center gap-3", !href && "hidden xl:flex")}>
                <span className="grid size-10 place-items-center rounded-full bg-accent-soft text-primary-strong">
                  <Icon className="size-[1.125rem]" />
                </span>
                <span className="leading-tight">
                  <span className="block text-[0.75rem] font-semibold tracking-[0.08em] text-muted uppercase">
                    {label}
                  </span>
                  {href ? (
                    <a
                      href={href}
                      className="text-small font-medium text-ink transition-colors hover:text-primary-strong"
                    >
                      {value}
                    </a>
                  ) : (
                    <span className="text-small font-medium text-ink">{value}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          {/* The badge sits in a wide white JPEG; this square frame crops to the badge itself. */}
          <span className="relative hidden size-12 shrink-0 overflow-hidden min-[400px]:block sm:size-14 lg:size-[4.5rem]">
            <Image
              src={logos.silverJubilee.src}
              alt={logos.silverJubilee.alt}
              width={logos.silverJubilee.width}
              height={logos.silverJubilee.height}
              sizes="(min-width: 64rem) 121px, 94px"
              loading="eager"
              className="absolute top-[-6.25%] left-[-36.4%] w-[167.8%] max-w-none"
            />
          </span>

          <MobileMenu items={mainNav} />
        </div>
      </div>

      <div className="hidden border-t border-line-soft lg:block">
        <DesktopNav items={mainNav} />
      </div>
    </header>
  );
}
