import { AlertCircle, CheckCircle2, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { cx } from "@/lib/cx";

/*
 * Small presentational pieces shared by the admin pages. Server-safe (no hooks), so both
 * Server and Client Components can use them.
 */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonBase =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-admin-accent-strong text-white shadow-sm hover:bg-admin-navy",
  secondary:
    "border border-admin-line bg-white text-admin-navy shadow-xs hover:border-admin-accent hover:bg-admin-accent-soft",
  ghost: "text-admin-muted hover:bg-admin-bg hover:text-admin-navy",
  danger: "bg-admin-danger text-white shadow-sm hover:bg-[#912018]",
};

export function buttonClass(variant: ButtonVariant = "primary", className?: string) {
  return cx(buttonBase, buttonVariants[variant], className);
}

export function LinkButton({
  variant = "primary",
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant }) {
  return <Link {...props} className={buttonClass(variant, className)} />;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-admin-navy sm:text-[1.75rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-admin-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({
  children,
  className,
  ...props
}: ComponentProps<"section"> & { children: ReactNode }) {
  return (
    <section
      {...props}
      className={cx("rounded-lg border border-admin-line bg-white shadow-xs", className)}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-admin-line px-5 py-4">
      <h2 className="text-[0.9375rem] font-semibold text-admin-navy">{title}</h2>
      {action}
    </div>
  );
}

type Tone = "success" | "error" | "warning" | "info";

const toneStyles: Record<Tone, { box: string; icon: LucideIcon }> = {
  success: {
    box: "border-admin-success/25 bg-admin-success-soft text-admin-success",
    icon: CheckCircle2,
  },
  error: {
    box: "border-admin-danger/25 bg-admin-danger-soft text-admin-danger",
    icon: AlertCircle,
  },
  warning: {
    box: "border-admin-warning/25 bg-admin-warning-soft text-admin-warning",
    icon: TriangleAlert,
  },
  info: { box: "border-admin-accent/30 bg-admin-accent-soft text-admin-navy", icon: Info },
};

export function Notice({
  tone,
  title,
  children,
  className,
  ...props
}: Omit<ComponentProps<"div">, "title"> & { tone: Tone; title?: string }) {
  const { box, icon: Icon } = toneStyles[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      {...props}
      className={cx("flex gap-3 rounded-md border px-4 py-3 text-sm", box, className)}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: "draft" | "published" }) {
  return status === "published" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-success-soft px-2.5 py-0.5 text-xs font-semibold text-admin-success">
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-admin-bg px-2.5 py-0.5 text-xs font-semibold text-admin-muted ring-1 ring-admin-line ring-inset">
      <span className="size-1.5 rounded-full border border-current" aria-hidden="true" />
      Draft
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-admin-accent-soft text-admin-accent-strong">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-admin-navy">{title}</h2>
      {children && <p className="mt-1.5 max-w-sm text-sm text-admin-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Dates in the admin panel are shown in Bhutan time. */
const dateTime = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Thimphu",
});

export function formatDateTime(date: Date) {
  return dateTime.format(date);
}
