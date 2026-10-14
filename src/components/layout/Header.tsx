import Image from "next/image";
import Link from "next/link";

import { ButtonLink } from "@/components/ui/Button";
import { MailIcon, MapPinIcon, PhoneIcon } from "@/components/ui/icons";
import { headerAction, mainNav, site } from "@/content/site";

import { DesktopNav } from "./DesktopNav";
import { HeaderFrame } from "./HeaderFrame";
import { MobileMenu } from "./MobileMenu";

const { contact, logos } = site;

/**
 * Site header: a slim utility bar with the contact details, then the main row with the crest,
 * the menu and the Contact button. The header is fixed over a spacer of the same height, so
 * when the page scrolls the utility bar can slide away and the row can shrink without moving
 * any content. Heights come from the --utility-h and --header-row-h variables in globals.css,
 * which the hero also uses to fill exactly one screen.
 */
export function Header() {
  return (
    <div className="h-(--header-h) shrink-0">
      <HeaderFrame className="group/header fixed inset-x-0 top-0 z-50 transition-[translate,box-shadow] duration-300 ease-out-soft data-scrolled:translate-y-[calc(var(--utility-h)*-1)] data-scrolled:shadow-md">
        <div className="hidden h-(--utility-h) bg-surface text-[0.8125rem] text-copy md:block">
          <div className="container-page flex h-full items-center justify-between gap-6">
            <p className="flex items-center gap-2">
              <MapPinIcon className="size-3.5 text-primary-strong" />
              {contact.location}
            </p>
            <div className="flex items-center gap-6">
              <a
                href={contact.phone.href}
                className="flex items-center gap-2 transition-colors hover:text-primary-strong"
              >
                <PhoneIcon className="size-3.5 text-primary-strong" />
                {contact.phone.label}
              </a>
              <a
                href={contact.email.href}
                className="flex items-center gap-2 transition-colors hover:text-primary-strong"
              >
                <MailIcon className="size-3.5 text-primary-strong" />
                {contact.email.label}
              </a>
            </div>
          </div>
        </div>

        <div className="h-(--header-row-h) bg-white/95 backdrop-blur-md transition-[height] duration-300 ease-out-soft group-data-scrolled/header:h-(--header-row-h-scrolled)">
          <div className="container-page flex h-full items-center justify-between gap-6">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <Link
                href="/"
                className="group flex min-w-0 items-center gap-3 rounded-sm"
                aria-label={`${site.name}, home`}
              >
                <Image
                  src={logos.crest.src}
                  alt=""
                  width={52}
                  height={52}
                  sizes="52px"
                  loading="eager"
                  className="size-11 shrink-0 md:size-[3.25rem]"
                />
                <span className="min-w-0 leading-tight">
                  <span className="block max-w-[10.5rem] font-display text-[0.875rem] leading-[1.2] font-semibold text-ink transition-colors group-hover:text-primary-strong sm:max-w-none sm:text-[1.0625rem] xl:whitespace-nowrap">
                    {site.name}
                  </span>
                  <span className="mt-0.5 hidden text-[0.6875rem] font-semibold tracking-[0.14em] text-muted uppercase sm:block">
                    {site.university}
                  </span>
                </span>
              </Link>

              {/* The badge sits in a wide white JPEG; this square frame crops to the badge. */}
              <span
                className="hidden h-9 w-px shrink-0 bg-line min-[400px]:block"
                aria-hidden="true"
              />
              <span className="relative hidden size-10 shrink-0 overflow-hidden min-[400px]:block md:size-11">
                <Image
                  src={logos.silverJubilee.src}
                  alt={logos.silverJubilee.alt}
                  width={logos.silverJubilee.width}
                  height={logos.silverJubilee.height}
                  sizes="74px"
                  loading="eager"
                  className="absolute top-[-6.25%] left-[-36.4%] w-[167.8%] max-w-none"
                />
              </span>
            </div>

            <div className="flex h-full shrink-0 items-center gap-4 xl:gap-10">
              <DesktopNav items={mainNav} />
              {/* the button's own inline-flex would beat "hidden", so a wrapper does the hiding */}
              <div className="hidden md:block">
                <ButtonLink href={headerAction.href} className="min-h-11 px-5 py-2.5">
                  {headerAction.label}
                </ButtonLink>
              </div>
              <MobileMenu items={mainNav} />
            </div>
          </div>
        </div>
      </HeaderFrame>
    </div>
  );
}
