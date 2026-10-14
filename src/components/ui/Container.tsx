import type { ComponentPropsWithoutRef } from "react";

/** Centred 1280px content column with responsive side gutters. */
export function Container({ className = "", ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={`mx-auto w-full max-w-site px-5 sm:px-8 lg:px-12 ${className}`} {...props} />
  );
}
