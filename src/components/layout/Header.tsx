import Image from "next/image";

import { images } from "@/content/images";
import { contact, mainNav, site } from "@/content/site";
import { Container } from "@/components/ui/Container";
import { Icon, type IconName } from "@/components/ui/Icon";
import { MobileNav } from "./MobileNav";
import { NavDropdown } from "./NavDropdown";

const contactItems: { icon: IconName; label: string; value: string; href?: string }[] = [
  { icon: "pin", label: "Location", value: contact.location },
  { icon: "phone", label: "Call us", value: contact.phone, href: contact.phoneHref },
  { icon: "mail", label: "Email", value: contact.email, href: `mailto:${contact.email}` },
];

/**
 * Two-tier header. The identity bar is sticky on small screens (it holds the menu button);
 * on desktop the navigation bar sticks instead.
 */
export function Header() {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] bg-white px-4 py-2 text-sm font-semibold text-navy focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>

      <div id="top" className="sticky top-0 z-40 border-b border-border bg-white lg:static">
        <Container className="flex items-center justify-between gap-6 py-3 lg:py-3.5">
          <a href="#top" aria-label={`${site.name} home`} className="flex shrink-0 items-center">
            <Image
              src={images.logo.src}
              alt={images.logo.alt}
              width={images.logo.width}
              height={images.logo.height}
              priority
              className="size-12 lg:size-24"
            />
          </a>

          <ul className="hidden items-center divide-x divide-border lg:flex">
            {contactItems.map((item) => {
              const value = item.href ? (
                <a href={item.href} className="transition-colors hover:text-brand-strong">
                  {item.value}
                </a>
              ) : (
                item.value
              );
              return (
                <li key={item.label} className="flex items-center gap-3 px-6 last:pr-0">
                  <span className="grid size-9 place-items-center rounded-full bg-surface text-brand-strong">
                    <Icon name={item.icon} />
                  </span>
                  <span className="text-sm leading-snug">
                    <span className="block text-xs text-muted">{item.label}</span>
                    <span className="font-medium text-ink">{value}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          <MobileNav />
        </Container>
      </div>

      <header className="sticky top-0 z-40 hidden bg-navy lg:block">
        <Container className="flex items-center justify-center">
          <nav aria-label="Main">
            <ul className="flex items-center gap-9 xl:gap-12">
              {mainNav.map((item, index) =>
                item.children ? (
                  <NavDropdown key={item.label} item={item} />
                ) : (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      aria-current={index === 0 ? "page" : undefined}
                      className="relative flex h-14 items-center text-sm font-medium text-white/85 transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:bg-brand after:transition-transform hover:text-white hover:after:scale-x-100 aria-[current=page]:text-white aria-[current=page]:after:scale-x-100"
                    >
                      {item.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </nav>
        </Container>
      </header>
    </>
  );
}
