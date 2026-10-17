import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { site } from "@/content/site";
import { getCurrentAdmin } from "@/lib/auth/dal";

import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Administrator Login" };

/** Someone already signed in goes straight to the dashboard. */
async function RedirectIfSignedIn() {
  if (await getCurrentAdmin()) redirect("/admin");
  return null;
}

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <Suspense fallback={null}>
        <RedirectIfSignedIn />
      </Suspense>

      <div className="w-full max-w-[25rem]">
        <div className="rounded-xl border border-admin-line bg-white px-6 py-8 shadow-[0_1px_2px_rgb(16_43_58/0.04),0_12px_32px_-12px_rgb(16_43_58/0.14)] sm:px-9 sm:py-10">
          <div className="flex flex-col items-center text-center">
            <Image
              src={site.logos.crest.src}
              alt={site.logos.crest.alt}
              width={72}
              height={72}
              priority
              className="size-[72px]"
            />
            <p className="mt-4 text-xs font-semibold tracking-[0.12em] text-admin-accent-strong uppercase">
              {site.name}
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-admin-navy">
              Administrator Login
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-admin-muted">
              This area is restricted to authorised administrators of the CST website.
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-admin-muted">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Sign-in activity is monitored. Access is limited to authorised staff.
        </p>
      </div>
    </main>
  );
}
