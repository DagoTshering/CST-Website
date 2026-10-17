"use client";

import { ChevronRight, ExternalLink, LogOut, Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef, type ReactNode, type RefObject } from "react";

import { logout } from "@/app/admin/actions";
import { site } from "@/content/site";
import { cx } from "@/lib/cx";

import { adminNav, breadcrumbsFor, isActive } from "./nav";

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-3 rounded-md px-2 py-1">
      <Image
        src={site.logos.crest.src}
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-full bg-white p-0.5"
      />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-display text-[0.9375rem] font-semibold text-white">
          {site.shortName} Admin
        </span>
        <span className="block truncate text-xs text-white/60">{site.name}</span>
      </span>
    </Link>
  );
}

function SidebarNav({ pathname }: { pathname: string }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-5 pb-4">
        <Brand />
      </div>
      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
        {adminNav.map((group) => (
          <div key={group.label} className="mt-4 first:mt-0">
            <p className="px-3 pb-1.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-white/45 uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(pathname, href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-admin-accent",
                        active
                          ? "bg-white/10 font-semibold text-white before:absolute before:inset-y-2 before:-left-3 before:w-[3px] before:rounded-r before:bg-admin-accent"
                          : "text-white/70 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <Icon
                        className={cx("size-[18px] shrink-0", active && "text-admin-accent")}
                        aria-hidden="true"
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <form action={logout} className="border-t border-white/10 p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-admin-accent"
        >
          <LogOut className="size-[18px]" aria-hidden="true" />
          Sign out
        </button>
      </form>
    </div>
  );
}

/** The navigation with the current page marked. Before the path is known, nothing is marked. */
function CurrentSidebarNav() {
  return <SidebarNav pathname={usePathname()} />;
}

function Sidebar() {
  return (
    <Suspense fallback={<SidebarNav pathname="" />}>
      <CurrentSidebarNav />
    </Suspense>
  );
}

/** Following a link in the drawer closes it. */
function CloseOnNavigate({ drawer }: { drawer: RefObject<HTMLDialogElement | null> }) {
  const pathname = usePathname();
  useEffect(() => {
    drawer.current?.close();
  }, [drawer, pathname]);
  return null;
}

function Breadcrumbs() {
  const trail = breadcrumbsFor(usePathname());
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1.5 text-sm">
        {trail.map((crumb, i) => {
          const last = i === trail.length - 1;
          return (
            <li
              key={crumb.href}
              className={cx("flex min-w-0 items-center gap-1.5", !last && "hidden sm:flex")}
            >
              {i > 0 && (
                <ChevronRight
                  className="hidden size-3.5 shrink-0 text-admin-muted/60 sm:block"
                  aria-hidden="true"
                />
              )}
              {last ? (
                <span aria-current="page" className="truncate font-semibold text-admin-navy">
                  {crumb.label}
                </span>
              ) : (
                <Link href={crumb.href} className="truncate text-admin-muted hover:text-admin-navy">
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * The admin panel's frame: a navy sidebar (a drawer on small screens), a top bar with the
 * breadcrumb, a link to the public site and the account menu, and the page.
 */
export function AdminFrame({ account, children }: { account: ReactNode; children: ReactNode }) {
  const drawer = useRef<HTMLDialogElement>(null);

  // The current path is only known at request time, so what depends on it streams in.
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 bg-admin-navy lg:block">
        <Sidebar />
      </aside>

      <dialog
        ref={drawer}
        aria-label="Admin menu"
        className="m-0 h-dvh max-h-none w-72 max-w-[85vw] bg-admin-navy p-0 backdrop:bg-admin-navy/50 backdrop:backdrop-blur-[2px] lg:hidden"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <button
          type="button"
          onClick={() => drawer.current?.close()}
          className="absolute top-5 right-3 z-10 rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" aria-hidden="true" />
          <span className="sr-only">Close menu</span>
        </button>
        <Sidebar />
      </dialog>
      <Suspense>
        <CloseOnNavigate drawer={drawer} />
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-admin-line bg-white/95 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => drawer.current?.showModal()}
            className="-ml-1 rounded-md p-2 text-admin-navy hover:bg-admin-bg lg:hidden"
          >
            <Menu className="size-5" aria-hidden="true" />
            <span className="sr-only">Open menu</span>
          </button>
          <Suspense>
            <Breadcrumbs />
          </Suspense>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-navy"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">View website</span>
              <span className="sr-only sm:hidden">View website</span>
            </a>
            {account}
          </div>
        </header>
        <main id="admin-main" className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
