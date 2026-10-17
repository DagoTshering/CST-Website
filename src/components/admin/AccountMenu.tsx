"use client";

import { ChevronDown, KeyRound, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { logout } from "@/app/admin/actions";
import type { PublicAdmin } from "@/lib/auth/dal";

/** The signed-in administrator, with a menu for the account settings and signing out. */
export function AccountMenu({ admin }: { admin: PublicAdmin }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const display = admin.name || admin.email;
  const initial = display.charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !root.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-md py-1.5 pr-2 pl-1.5 text-left transition-colors hover:bg-admin-bg"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-admin-navy text-sm font-semibold text-white"
        >
          {initial}
        </span>
        <span className="hidden max-w-48 min-w-0 md:block">
          <span className="block truncate text-sm font-semibold text-admin-navy">{display}</span>
          {admin.name && (
            <span className="block truncate text-xs text-admin-muted">{admin.email}</span>
          )}
        </span>
        <ChevronDown className="size-4 text-admin-muted" aria-hidden="true" />
        <span className="sr-only">Account menu</span>
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-lg border border-admin-line bg-white shadow-lg">
          <div className="border-b border-admin-line px-4 py-3">
            <p className="text-xs text-admin-muted">Signed in as</p>
            <p className="truncate text-sm font-semibold text-admin-navy">{admin.email}</p>
          </div>
          <div className="p-1.5">
            <Link
              href="/admin/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-admin-navy hover:bg-admin-bg"
            >
              <KeyRound className="size-4 text-admin-muted" aria-hidden="true" />
              Change password
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-admin-navy hover:bg-admin-bg"
              >
                <LogOut className="size-4 text-admin-muted" aria-hidden="true" />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
