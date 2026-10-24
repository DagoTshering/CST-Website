import type { CSSProperties, ReactNode } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { ExternalIcon } from "@/components/ui/icons";
import { SmartLink } from "@/components/ui/SmartLink";
import type { ContactPage } from "@/lib/cms/resources/contact";
import { closedDays, dayRanges, telHref } from "@/lib/contact";

import s from "./Contact.module.css";
import { OpenNow } from "./OpenNow";

function Column({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={s.column} aria-label={title}>
      <p className={s.eyebrow}>{eyebrow}</p>
      <h2 className={s.columnTitle}>{title}</h2>
      <div className={s.columnBody}>{children}</div>
      {action && <div className={s.columnAction}>{action}</div>}
    </section>
  );
}

/**
 * The ways to reach the college, side by side: where it is, when the office is open, how to
 * call or write, and where to follow it (left out while there is nowhere to follow). Each
 * column's action sits on the same baseline.
 */
export function InfoRow({ page }: { page: ContactPage }) {
  const { address, postal, hours, general, social, map } = page;
  const closed = closedDays(hours.days);
  const columns = social.length > 0 ? 4 : 3;
  return (
    <div className={s.info} style={{ "--columns": columns } as CSSProperties}>
      <Column
        eyebrow="Post and visits"
        title="Visit us"
        action={
          <ButtonLink href={map.link} variant="secondary">
            Directions <ExternalIcon className="size-4" aria-hidden="true" />
          </ButtonLink>
        }
      >
        <address className={s.address}>
          {address.map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </address>
        {postal && <p className={s.muted}>{postal}</p>}
      </Column>

      <Column eyebrow="Opening times" title="Office hours">
        <dl className={s.hours}>
          <dt>{dayRanges(hours.days)}</dt>
          <dd>
            {hours.open}–{hours.close}
          </dd>
          {closed.length > 0 && (
            <>
              <dt>{dayRanges(closed)}</dt>
              <dd>Closed</dd>
            </>
          )}
        </dl>
        <OpenNow hours={hours} />
      </Column>

      <Column
        eyebrow="Call or write"
        title="Get in touch"
        action={
          general.whatsapp && (
            <ButtonLink href={general.whatsapp}>
              WhatsApp <ExternalIcon className="size-4" aria-hidden="true" />
            </ButtonLink>
          )
        }
      >
        {general.phone && (
          <p>
            <a href={telHref(general.phone)} className={s.link}>
              {general.phone}
            </a>
            {general.phoneNote && <span className={s.muted}>{general.phoneNote}</span>}
          </p>
        )}
        {general.email && (
          <p className={general.phone ? s.spaced : undefined}>
            <a href={`mailto:${general.email}`} className={s.link}>
              {general.email}
            </a>
          </p>
        )}
      </Column>

      {social.length > 0 && (
        <Column eyebrow="Elsewhere" title="Find us online">
          <ul className={s.social}>
            {social.map((item) => (
              <li key={item.url}>
                <SmartLink href={item.url}>
                  {item.label}
                  <ExternalIcon className={s.socialIcon} aria-hidden="true" />
                </SmartLink>
              </li>
            ))}
          </ul>
        </Column>
      )}
    </div>
  );
}
