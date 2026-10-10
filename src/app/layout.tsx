import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "CST Website",
  description: "Next.js, PostgreSQL, Drizzle ORM, Tailwind CSS and Docker foundation.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
