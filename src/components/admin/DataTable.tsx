import { FileText, ImageIcon, Pencil } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import type { DeleteResult, MediaPreview } from "@/lib/cms/form";
import { cx } from "@/lib/cx";

import { DeleteButton } from "./DeleteButton";
import { Notice } from "./ui";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  /** Hide the column on narrow screens. */
  wide?: boolean;
  className?: string;
};

/**
 * A content list. The first column links to the edit page; each row ends with edit and delete
 * buttons. Server Component: column renderers stay on the server.
 */
export function DataTable<T extends { id: number }>({
  caption,
  columns,
  rows,
  editHref,
  deleteAction,
  rowName,
  kind,
}: {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  editHref: (row: T) => string;
  /** The delete Server Action, bound to the row's id. */
  deleteAction: (row: T) => () => Promise<DeleteResult>;
  rowName: (row: T) => string;
  kind: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-admin-line bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-admin-line bg-admin-bg/70 text-xs font-semibold tracking-wide text-admin-muted uppercase">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  className={cx("px-4 py-3 font-semibold", column.wide && "hidden md:table-cell")}
                >
                  {column.header}
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-line">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-admin-bg/50">
                {columns.map((column, i) => (
                  <td
                    key={column.header}
                    className={cx(
                      "px-4 py-3 align-middle text-admin-navy",
                      column.wide && "hidden md:table-cell",
                      column.className,
                    )}
                  >
                    {i === 0 ? (
                      <Link
                        href={editHref(row)}
                        className="font-semibold text-admin-navy hover:text-admin-accent-strong"
                      >
                        {column.cell(row)}
                      </Link>
                    ) : (
                      column.cell(row)
                    )}
                  </td>
                ))}
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <Link
                    href={editHref(row)}
                    className="inline-flex rounded-md p-2 text-admin-muted transition-colors hover:bg-admin-accent-soft hover:text-admin-accent-strong"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    <span className="sr-only">Edit {rowName(row)}</span>
                  </Link>
                  <DeleteButton
                    action={deleteAction(row)}
                    itemName={rowName(row)}
                    kind={kind}
                    compact
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A small thumbnail of a row's image, with its name beside it. */
export function TitleWithThumb({ title, image }: { title: string; image: MediaPreview | null }) {
  return (
    <span className="flex items-center gap-3">
      <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-admin-bg text-admin-muted ring-1 ring-admin-line">
        {image ? (
          <Image src={image.url} alt="" fill unoptimized sizes="44px" className="object-cover" />
        ) : (
          <ImageIcon className="size-4" aria-hidden="true" />
        )}
      </span>
      <span className="min-w-0">{title}</span>
    </span>
  );
}

export function DocumentBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-admin-muted">
      <FileText className="size-3.5" aria-hidden="true" />
      PDF
    </span>
  );
}

const notices = {
  created: { tone: "success", text: (kind: string) => `The ${kind} was created.` },
  updated: { tone: "success", text: (kind: string) => `Your changes to the ${kind} were saved.` },
  deleted: { tone: "success", text: (kind: string) => `The ${kind} was deleted.` },
  missing: {
    tone: "warning",
    text: (kind: string) => `That ${kind} no longer exists. It may have been deleted.`,
  },
} as const;

/** The result of the last save or delete, passed in the URL by the Server Action's redirect. */
export function ListNotice({ notice, kind }: { notice: unknown; kind: string }) {
  if (typeof notice !== "string" || !(notice in notices)) return null;
  const { tone, text } = notices[notice as keyof typeof notices];
  return (
    <Notice tone={tone} className="mb-5">
      {text(kind)}
    </Notice>
  );
}
