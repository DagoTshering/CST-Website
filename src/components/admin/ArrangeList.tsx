"use client";

import { ArrowDown, ArrowUp, GripVertical, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";

import type { ArrangeResult, OrderedItem } from "@/lib/cms/ordering";
import { cx } from "@/lib/cx";

import { buttonClass, Notice } from "./ui";

/** Two initials for an item without a photo. */
const initials = (label: string) =>
  label
    .replace(/^(dr|mr|mrs|ms)\.?\s+/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

/**
 * Puts a group's items in order: drag a row by its handle, or use its ▲/▼ buttons (keyboard,
 * touch screens). Items only move within their section (a project report within its programme).
 * Nothing is saved until Save order; the Server Action then returns to the list.
 */
export function ArrangeList({
  items,
  save,
  cancelHref,
  showPhotos = false,
}: {
  items: OrderedItem[];
  /** The Server Action, with the list and group bound. */
  save: (ids: number[]) => Promise<ArrangeResult>;
  cancelHref: string;
  showPhotos?: boolean;
}) {
  const byId = new Map(items.map((item) => [item.id, item]));
  const [order, setOrder] = useState(items.map((item) => item.id));
  const [dragging, setDragging] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const changed = order.some((id, i) => id !== items[i]?.id);

  const sectionOf = (id: number) => byId.get(id)?.section ?? null;

  /** Moves `id` to where `target` is, if they share a section. */
  const moveTo = (id: number, target: number) => {
    if (id === target || sectionOf(id) !== sectionOf(target)) return;
    setOrder((current) => {
      const next = current.filter((other) => other !== id);
      const at = next.indexOf(target) + (current.indexOf(id) < current.indexOf(target) ? 1 : 0);
      next.splice(at, 0, id);
      return next;
    });
  };

  const step = (id: number, by: -1 | 1) => {
    const at = order.indexOf(id);
    const neighbour = order[at + by];
    if (neighbour === undefined || sectionOf(neighbour) !== sectionOf(id)) return;
    const next = [...order];
    next[at] = neighbour;
    next[at + by] = id;
    setOrder(next);
    const inSection = next.filter((other) => sectionOf(other) === sectionOf(id));
    setAnnouncement(
      `${byId.get(id)?.label} moved to position ${inSection.indexOf(id) + 1} of ${inSection.length}.`,
    );
  };

  const submit = () =>
    startTransition(async () => {
      setError(null);
      const result = await save(order);
      if (result && !result.ok) setError(result.message);
    });

  return (
    <div className="rounded-lg border border-admin-line bg-white shadow-xs">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      {error && (
        <Notice tone="error" className="m-5 mb-0">
          {error}
        </Notice>
      )}
      <ol className="divide-y divide-admin-line">
        {order.map((id, i) => {
          const item = byId.get(id)!;
          const section = sectionOf(id);
          const newSection = i === 0 || sectionOf(order[i - 1]) !== section;
          const first = newSection;
          const last = i === order.length - 1 || sectionOf(order[i + 1]) !== section;
          const position = order.slice(0, i + 1).filter((o) => sectionOf(o) === section).length;
          return (
            <li key={id}>
              {newSection && section && (
                <p className="bg-admin-bg/70 px-5 py-2 text-xs font-semibold tracking-wide text-admin-muted uppercase">
                  {section}
                </p>
              )}
              <div
                draggable
                onDragStart={(event) => {
                  setDragging(id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", String(id));
                }}
                onDragOver={(event) => {
                  if (dragging === null || sectionOf(dragging) !== section) return;
                  event.preventDefault();
                  moveTo(dragging, id);
                }}
                onDragEnd={() => setDragging(null)}
                onDrop={(event) => event.preventDefault()}
                className={cx(
                  "flex items-center gap-3 px-3 py-2.5 transition-colors sm:px-5",
                  dragging === id ? "bg-admin-accent-soft" : "hover:bg-admin-bg/50",
                )}
              >
                <GripVertical
                  className="size-5 shrink-0 cursor-grab text-admin-muted/70 active:cursor-grabbing"
                  aria-hidden="true"
                />
                <span className="w-7 shrink-0 text-right font-mono text-xs text-admin-muted">
                  {position}
                </span>
                {showPhotos && (
                  <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-admin-bg text-[0.6875rem] font-semibold text-admin-muted ring-1 ring-admin-line">
                    {item.photo ? (
                      <Image
                        src={item.photo}
                        alt=""
                        fill
                        unoptimized
                        sizes="36px"
                        className="object-cover"
                      />
                    ) : (
                      initials(item.label)
                    )}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-admin-navy">
                  {item.label}
                </span>
                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => step(id, -1)}
                    disabled={first || pending}
                    className="rounded-md p-1.5 text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-navy disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" aria-hidden="true" />
                    <span className="sr-only">Move {item.label} up</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => step(id, 1)}
                    disabled={last || pending}
                    className="rounded-md p-1.5 text-admin-muted transition-colors hover:bg-admin-bg hover:text-admin-navy disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" aria-hidden="true" />
                    <span className="sr-only">Move {item.label} down</span>
                  </button>
                </span>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="flex flex-col-reverse gap-3 border-t border-admin-line bg-admin-bg/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-admin-muted">
          {changed ? "You have unsaved changes." : "Drag the rows, or use the arrows."}
        </p>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Link href={cancelHref} className={buttonClass("ghost")}>
            Cancel
          </Link>
          {changed && (
            <button
              type="button"
              onClick={() => setOrder(items.map((item) => item.id))}
              disabled={pending}
              className={buttonClass("secondary")}
            >
              Undo changes
            </button>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={!changed || pending}
            className={buttonClass("primary")}
          >
            {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
            {pending ? "Saving…" : "Save order"}
          </button>
        </div>
      </div>
    </div>
  );
}
