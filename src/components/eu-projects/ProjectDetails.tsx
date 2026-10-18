import type { ReactNode } from "react";

import { ButtonLink } from "@/components/ui/Button";
import { ExternalIcon } from "@/components/ui/icons";
import { partnersByCountry, projectFacts, safeUrl, type Project } from "@/lib/eu-projects";

import s from "./EuProjects.module.css";

const List = ({ items }: { items: string[] }) => (
  <ul className={s.list}>
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className={s.block}>
    <h4 className={s.blockTitle}>{title}</h4>
    {children}
  </section>
);

/** A bordered table like the Admissions requirement tables: mono column heads on a tint. */
function Table({
  caption,
  heads,
  rows,
}: {
  caption: string;
  heads: string[];
  rows: { key: string; cells: ReactNode[] }[];
}) {
  return (
    <div className={s.tableBox}>
      <table className={s.table}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {heads.map((head) => (
              <th key={head} scope="col">
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={i}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * What a project opens to: each block only if the data has it, in a fixed order. A project with
 * no details yet shows one notice instead.
 */
export function ProjectDetails({ project }: { project: Project }) {
  const d = project.detail;
  if (!d) {
    return (
      <p className={s.pending}>
        Project description, partners, dates and activities to be added. The old page for this
        project was empty.
      </p>
    );
  }

  const facts = projectFacts(d);
  const url = safeUrl(project);
  const links = d.extraLinks ?? [];

  return (
    <div className={s.details}>
      {project.fullTitle && <p className={s.fullTitle}>{project.fullTitle}</p>}

      {facts.length > 0 && (
        <dl className={s.facts}>
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className={s.about}>{d.about}</p>
      <p className={s.funding}>{d.programme.replace(/\.?$/, ".")}</p>

      {d.cstRole && (
        <Block title="CST’s role">
          <p className={s.about}>{d.cstRole}</p>
        </Block>
      )}

      {d.objectives?.length ? (
        <Block title="Objectives">
          <List items={d.objectives} />
        </Block>
      ) : null}

      {d.domains?.length ? (
        <Block title={d.domains.length === 5 ? "Five domains" : "Domains"}>
          <List items={d.domains} />
        </Block>
      ) : null}

      {d.outputs?.length ? (
        <Block title="Outputs">
          <List items={d.outputs} />
        </Block>
      ) : null}

      {d.partners?.length ? (
        <Block title="Partners">
          {d.coordinator && (
            <p className={s.coordinator}>
              Coordinator: <strong>{d.coordinator}</strong>
            </p>
          )}
          <Table
            caption={`${project.name} partner institutions by country`}
            heads={["Country", "Institutions"]}
            rows={partnersByCountry(d.partners).map(({ country, institutions }) => ({
              key: country,
              cells: [
                country,
                <ul key="i" className={s.cellList}>
                  {institutions.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>,
              ],
            }))}
          />
        </Block>
      ) : null}

      {d.team?.length ? (
        <Block title="CST project team">
          <Table
            caption={`${project.name} project team at CST`}
            heads={["Name", "Role"]}
            rows={d.team.map(([name, role]) => ({ key: name, cells: [name, role] }))}
          />
        </Block>
      ) : null}

      {d.meetings?.length ? (
        <Block title="Project meetings">
          <Table
            caption={`${project.name} project meetings`}
            heads={["Dates", "Meeting", "Venue"]}
            rows={d.meetings.map(([title, venue, dates]) => ({
              key: title,
              cells: [
                <span key="d" className={s.dates}>
                  {dates}
                </span>,
                title,
                venue,
              ],
            }))}
          />
        </Block>
      ) : null}

      {(url || links.length > 0) && (
        <div className={s.actions}>
          {url && (
            <ButtonLink href={url}>
              Project website <ExternalIcon className="size-4" aria-hidden="true" />
            </ButtonLink>
          )}
          {links.map((link) => (
            <ButtonLink key={link.url} href={link.url} variant="secondary">
              {link.label} <ExternalIcon className="size-4" aria-hidden="true" />
            </ButtonLink>
          ))}
        </div>
      )}
    </div>
  );
}
