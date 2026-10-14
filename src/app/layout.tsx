import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Jost } from "next/font/google";

import { site } from "@/content/site";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });
// Only the hero's drawing captions use the mono face, so it is not preloaded.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: `${site.name} | ${site.university}`,
    template: `%s | ${site.shortName}`,
  },
  description: site.description,
};

export const viewport: Viewport = {
  themeColor: "#215563",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jost.variable} ${plexMono.variable}`}>
      <body>
        <a
          href="#main"
          className="fixed top-3 left-3 z-[100] -translate-y-24 rounded-sm bg-primary-strong px-4 py-2.5 text-small font-semibold text-white shadow-md transition-transform focus-visible:translate-y-0"
        >
          Skip to main content
        </a>
        <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
      </body>
    </html>
  );
}
