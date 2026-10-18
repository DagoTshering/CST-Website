import { ListOrdered } from "lucide-react";
import Link from "next/link";

import { arrange } from "@/app/admin/(panel)/arrange-actions";
import { orderedItems, type OrderingKey } from "@/lib/cms/ordering";
import { cx } from "@/lib/cx";

import { ArrangeList } from "./ArrangeList";
import { Card, EmptyState, PageHeader } from "./ui";

/**
 * An "Arrange order" page: one group of an ordered list (a department, a chart row, a category),
 * with links to the other groups when there are several. The caller has checked the session.
 */
export async function ArrangePage({
  list,
  group,
  title,
  description,
  cancelHref,
  groups,
  showPhotos,
}: {
  list: OrderingKey;
  group: string;
  title: string;
  description: string;
  cancelHref: string;
  /** Links to the other groups, e.g. one per department. */
  groups?: { label: string; href: string; active: boolean }[];
  showPhotos?: boolean;
}) {
  const items = await orderedItems(list, group);
  return (
    <>
      <PageHeader title={title} description={description} />
      {groups && groups.length > 1 && (
        <nav aria-label="Choose a group" className="mb-5 flex flex-wrap gap-2">
          {groups.map((g) => (
            <Link
              key={g.href}
              href={g.href}
              aria-current={g.active ? "page" : undefined}
              className={cx(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                g.active
                  ? "border-admin-navy bg-admin-navy text-white"
                  : "border-admin-line bg-white text-admin-navy hover:border-admin-accent",
              )}
            >
              {g.label}
            </Link>
          ))}
        </nav>
      )}
      {items.length < 2 ? (
        <Card>
          <EmptyState icon={ListOrdered} title="Nothing to arrange">
            {items.length === 0 ? "There is nothing here yet." : "There is only one item here."}
          </EmptyState>
        </Card>
      ) : (
        <ArrangeList
          key={group}
          items={items}
          save={arrange.bind(null, list, group)}
          cancelHref={cancelHref}
          showPhotos={showPhotos}
        />
      )}
    </>
  );
}
