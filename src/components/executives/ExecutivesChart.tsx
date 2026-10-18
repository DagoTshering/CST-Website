import type { CSSProperties } from "react";

import { roleTitle, type Executive } from "@/content/executives";

import { BlueprintGrid } from "./BlueprintGrid";
import { Dial } from "./Dial";
import s from "./Executives.module.css";

/** The dials' photographs at their largest (desktop): 77% of a 268px or 216px dial. */
const SIZES = { president: "210px", dean: "170px" };

const delay = (seconds: number) => ({ "--delay": `${seconds}s` }) as CSSProperties;

/** One person: their dial, role, name, scope (Deans) and a short brass rule. Focusable. */
function Person({ person, kind }: { person: Executive; kind: "president" | "dean" }) {
  return (
    <article className={s.person} tabIndex={0} aria-label={`${person.name}, ${roleTitle(person)}`}>
      <Dial person={person} kind={kind} sizes={SIZES[kind]} />
      <div className={s.text}>
        <p className={s.role}>{person.role}</p>
        <h3 className={s.name}>{person.name}</h3>
        {person.scope && <p className={s.scope}>{person.scope}</p>}
        <span className={s.rule} aria-hidden="true" />
      </div>
    </article>
  );
}

/**
 * The executive structure as an organisation chart drawn on a blueprint sheet: the President at
 * the top, the three Deans in a row below, joined by an orthogonal dash-dot connector (a stem, a
 * bus with a junction above each Dean, and a drop with an arrowhead onto each portrait). On a
 * phone it becomes a column with a rail down the left. Hovering or focusing a person darkens
 * their branch of the connector. Read in order, it is the President, then the Deans.
 *
 * Everything but the grid behind it is rendered on the server; the connectors, labels and
 * layout are CSS (Executives.module.css). The people come from the database (Admin ›
 * Executives): the head of the chart (level 1) and the row below it, left to right.
 */
export function ExecutivesChart({
  president,
  deans,
}: {
  president: Executive | null;
  deans: Executive[];
}) {
  return (
    <section className={s.chart} aria-labelledby="executives-chart-title">
      <h2 id="executives-chart-title" className="sr-only">
        Executive structure
      </h2>
      <div className={s.sheet}>
        <BlueprintGrid className={s.grid} />
        <i className={`${s.reg} ${s.tl}`} aria-hidden="true" />
        <i className={`${s.reg} ${s.tr}`} aria-hidden="true" />
        <i className={`${s.reg} ${s.bl}`} aria-hidden="true" />
        <i className={`${s.reg} ${s.br}`} aria-hidden="true" />

        <div className={s.tree}>
          {president && (
            <>
              <div className={`${s.presRow} ${s.rise}`}>
                <p className={s.level} aria-hidden="true">
                  <b>01</b> {president.role}
                </p>
                <Person person={president} kind="president" />
              </div>
              {deans.length > 0 && <div className={s.stem} aria-hidden="true" />}
            </>
          )}
          {deans.length > 0 && (
            <div className={s.deansRow}>
              <p className={`${s.level} ${s.levelDeans}`} aria-hidden="true">
                <b>02</b> Deans
              </p>
              <div className={s.deans}>
                {deans.map((dean, i) => (
                  <div
                    key={dean.id}
                    className={`${s.dean} ${s.rise}`}
                    style={delay(0.25 + i * 0.12)}
                  >
                    <span className={s.node} aria-hidden="true" />
                    <span className={s.arrow} aria-hidden="true" />
                    <Person person={dean} kind="dean" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
