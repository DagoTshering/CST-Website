import type { NextConfig } from "next";

/** The old site's programme pages whose path is the new programme's slug. */
const PROGRAMME_PATHS = [
  "civil-engineering",
  "architecture",
  "electrical-engineering",
  "electronics-and-communication",
  "engineering-geology",
  "instrumentation-and-control-engineering",
  "mechanical-engineering",
  "software-engineering",
  "renewable-energy",
  "construction-management",
];

const nextConfig: NextConfig = {
  // The old site's programme pages, kept working (and their search ranking passed on).
  async redirects() {
    return [
      ...PROGRAMME_PATHS.map((slug) => ({
        source: `/${slug}`,
        destination: `/programmes/${slug}`,
        permanent: true,
      })),
      {
        source: "/programme-it",
        destination: "/programmes/information-technology",
        permanent: true,
      },
      {
        source: "/water-engineering",
        destination: "/programmes/water-resource-engineering",
        permanent: true,
      },
      {
        source: "/Master%20of%20Science%20in%20Engineering",
        destination: "/programmes/msc-engineering",
        permanent: true,
      },
    ];
  },
  // Emit a self-contained server in .next/standalone for the Docker runtime image.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // Only optimise our own files: public/images, and uploads served from /media.
    localPatterns: [
      { pathname: "/images/**", search: "" },
      { pathname: "/media/**", search: "" },
    ],
    qualities: [75],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        // CSS Modules are left alone: `as: "*.css"` would turn them into global CSS and their
        // class names would be undefined.
        condition: { not: { path: "*.module.css" } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
