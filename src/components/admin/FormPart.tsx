import type { ReactNode } from "react";

import { Card } from "./ui";

/**
 * A list shown below a page's main form (e.g. the About page's centres), with its own heading,
 * a line about it and its buttons; "None yet." while it is empty. `id` is its #anchor.
 */
export function FormPart({
  id,
  title,
  description,
  actions,
  empty,
  children,
}: {
  id: string;
  title: string;
  description: ReactNode;
  actions: ReactNode;
  empty: boolean;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-10 scroll-mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${id}-title`} className="text-lg font-semibold text-admin-ink">
            {title}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-admin-muted">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>
      {empty ? (
        <Card>
          <p className="p-5 text-sm text-admin-muted">None yet.</p>
        </Card>
      ) : (
        children
      )}
    </section>
  );
}
