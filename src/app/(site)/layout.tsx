import type { ReactNode } from "react";

import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { LoopObserver } from "@/components/motion/LoopObserver";
import { RevealObserver } from "@/components/motion/RevealObserver";

/** The public website's chrome. The admin panel (/admin) has its own layout. */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-sm bg-primary-strong px-4 py-2.5 text-small font-semibold text-white shadow-md transition-transform focus-visible:translate-y-0"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
      <RevealObserver />
      <LoopObserver />
    </>
  );
}
