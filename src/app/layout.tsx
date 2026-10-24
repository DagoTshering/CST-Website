import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, Inter, Jost } from "next/font/google";

import { site } from "@/content/site";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jost = Jost({ subsets: ["latin"], variable: "--font-jost", display: "swap" });
// The hero headline only.
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cormorant",
  display: "swap",
});
// Its italic, for the About heading. Below the fold, so it is not preloaded.
const cormorantItalic = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "500",
  style: "italic",
  variable: "--font-cormorant-italic",
  display: "swap",
  preload: false,
});
// Only small captions and table heads below the fold use the mono face, so it is not preloaded.
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
    <html
      lang="en"
      // globals.css turns on smooth scrolling; this tells Next.js to pause it during route changes
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${jost.variable} ${cormorant.variable} ${cormorantItalic.variable} ${plexMono.variable}`}
    >
      {/* id="top" is the target of the footer's "Back to top" link */}
      <body id="top">{children}</body>
    </html>
  );
}
