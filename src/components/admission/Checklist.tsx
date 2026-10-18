import { CheckIcon } from "@/components/ui/icons";
import { cx } from "@/lib/cx";

/** A short list of requirements, each after a small teal tick on a hairline row. */
export function Checklist({ items, className }: { items: string[]; className?: string }) {
  return (
    <ul className={cx("border-t border-line", className)}>
      {items.map((item) => (
        <li key={item} className="flex gap-3 border-b border-line py-3.5 text-copy">
          <CheckIcon className="mt-1 size-4 shrink-0 text-primary-strong" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
