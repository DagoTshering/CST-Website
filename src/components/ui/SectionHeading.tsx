import type { ReactNode } from "react";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  id?: string;
  tone?: "light" | "dark";
  className?: string;
};

/** Section label + h2. `tone="dark"` is for navy backgrounds. */
export function SectionHeading({
  eyebrow,
  title,
  id,
  tone = "light",
  className = "",
}: SectionHeadingProps) {
  const onDark = tone === "dark";
  return (
    <div className={className}>
      <p
        className={`flex items-center gap-3 text-xs font-semibold tracking-[0.18em] uppercase ${
          onDark ? "text-brand" : "text-brand-strong"
        }`}
      >
        <span aria-hidden="true" className="h-px w-8 bg-current" />
        {eyebrow}
      </p>
      <h2 id={id} className={`mt-4 text-heading font-bold ${onDark ? "text-white" : "text-navy"}`}>
        {title}
      </h2>
    </div>
  );
}
