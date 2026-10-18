import Link from "next/link";

import { ArrowRightIcon } from "./icons";
import s from "./CategoryList.module.css";

export type CategoryListItem = {
  href: string;
  title: string;
  /** One line under the title, e.g. "Bachelor of Engineering · 4 years · Department". */
  meta: string;
  /** Shown as the row opens. */
  summary: string;
};

/**
 * A list of links as expanding rows, after the 21st.dev "category-list": hairline rows that, on
 * hover or keyboard focus, grow taller, take the accent colour, show brass corner brackets, fade
 * in a one-line summary and slide in an arrow. On a touch screen (no hover) every row is open.
 * Every row is a real link. CSS only: no client JavaScript.
 */
export function CategoryList({ items }: { items: CategoryListItem[] }) {
  return (
    <ul className={s.list}>
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className={s.row}>
            <i className={`${s.bracket} ${s.tl}`} aria-hidden="true" />
            <i className={`${s.bracket} ${s.br}`} aria-hidden="true" />
            <span className={s.inner}>
              <span className={s.text}>
                <span className={s.title}>{item.title}</span>
                <span className={s.meta}>{item.meta}</span>
                <span className={s.summary}>{item.summary}</span>
              </span>
              <ArrowRightIcon className={s.arrow} aria-hidden="true" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
