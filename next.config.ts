import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emit a self-contained server in .next/standalone for the Docker runtime image.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  images: {
    // Only optimise our own files under public/images, at the default quality.
    localPatterns: [{ pathname: "/images/**", search: "" }],
    qualities: [75],
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
