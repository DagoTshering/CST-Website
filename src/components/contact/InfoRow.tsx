import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { ExternalIcon } from "@/components/ui/icons";
import { SmartLink } from "@/components/ui/SmartLink";
import { contact } from "@/lib/contact";

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
 * The four ways to reach the college, side by side: where it is, when the office is open, how to
 * call or write, and where to follow it. Each column's action sits on the same baseline.
 */
export function InfoRow() {
  const { address, postal, hours, general, social, map } = contact;
  return (
    <div className={s.info}>
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
          {address.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </address>
        <p className={s.muted}>{postal}</p>
      </Column>

      <Column eyebrow="Opening times" title="Office hours">
        <dl className={s.hours}>
          <dt>Mon to Fri</dt>
          <dd>
            {hours.open}–{hours.close}
          </dd>
          <dt>Sat and Sun</dt>
          <dd>Closed</dd>
        </dl>
        <OpenNow hours={hours} />
      </Column>

      <Column
        eyebrow="Call or write"
        title="Get in touch"
        action={
          <ButtonLink href={general.whatsapp}>
            WhatsApp <ExternalIcon className="size-4" aria-hidden="true" />
          </ButtonLink>
        }
      >
        <p>
          <a href={`tel:${general.phone}`} className={s.link}>
            {general.phoneLabel}
          </a>
          <span className={s.muted}>Administration Office</span>
        </p>
        <p className={s.spaced}>
          <a href={`mailto:${general.email}`} className={s.link}>
            {general.email}
          </a>
        </p>
      </Column>

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
    </div>
  );
}
