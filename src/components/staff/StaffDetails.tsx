import type { StaffMember } from "@/content/staff";
import { cx } from "@/lib/cx";

import s from "./StaffDetails.module.css";

type StaffDetailsProps = {
  person: StaffMember;
  /** "row": label beside value (the carousel); "stacked": label over value (search results). */
  layout?: "row" | "stacked";
  className?: string;
};

/** The email with a break opportunity after the @, so a long address wraps there first. */
function Email({ address }: { address: string }) {
  const at = address.indexOf("@");
  return (
    <a href={`mailto:${address}`} className={s.email}>
      {at < 0 ? (
        address
      ) : (
        <>
          {address.slice(0, at + 1)}
          <wbr />
          {address.slice(at + 1)}
        </>
      )}
    </a>
  );
}

/**
 * What follows a person's name: rank, roles in teal, a short brass rule, then Programme,
 * Department and Email (Programme and Email are left out for someone without one).
 */
export function StaffDetails({ person, layout = "row", className }: StaffDetailsProps) {
  const { programmes } = person;

  return (
    <div className={cx(s.details, className)} data-layout={layout}>
      <p className={s.rank}>{person.rank}</p>
      {person.roles.length > 0 && <p className={s.roles}>{person.roles.join(" · ")}</p>}
      <span className={s.rule} aria-hidden="true" />
      <dl className={s.facts}>
        {programmes.length > 0 && (
          <div className={s.fact}>
            <dt>{programmes.length > 1 ? "Programmes" : "Programme"}</dt>
            <dd>{programmes.join(" · ")}</dd>
          </div>
        )}
        <div className={s.fact}>
          <dt>Department</dt>
          <dd>{person.departmentLabel}</dd>
        </div>
        {person.email && (
          <div className={s.fact}>
            <dt>Email</dt>
            <dd>
              <Email address={person.email} />
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}
