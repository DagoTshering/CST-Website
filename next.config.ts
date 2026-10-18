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

/**
 * Security headers for every page. The Content-Security-Policy limits what may be framed and how
 * the site may be framed, without restricting scripts (that would need per-request nonces):
 * - frame-src: only our own pages and the AirGradient dashboard (/air-quality) may be embedded;
 * - frame-ancestors: no other site may embed ours (clickjacking, e.g. of the admin panel);
 * - object-src, base-uri, form-action: no plugins, no <base> tricks, forms only post to us.
 * /media sets its own, stricter policy for uploaded files, so it is left out here.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "frame-src 'self' https://app.airgradient.com",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/((?!media/).*)", headers: securityHeaders }];
  },
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
        source: "/admission-for-new-students",
        destination: "/admissions",
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
