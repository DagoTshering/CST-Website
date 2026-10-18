// Usage: pnpm check-links
// Opens every link on the EU Projects page (data/eu-projects.json) and prints what came back, so
// the web team can see which ones still work. A report only: it changes nothing, and the site
// itself never checks links at build or run time. A page that loads may still be the wrong one
// (a sold or taken-over domain), so open anything surprising by hand.
import fs from "node:fs";

const { projects } = JSON.parse(fs.readFileSync("data/eu-projects.json", "utf8"));
const TIMEOUT = 15_000;

const links = projects.flatMap((p) => [
  ...(p.externalUrl ? [{ project: p.name, url: p.externalUrl, state: p.linkState }] : []),
  ...(p.detail?.extraLinks ?? []).map((l) => ({ project: p.name, url: l.url, state: "extra" })),
]);

async function check(url) {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT),
      headers: { "user-agent": "Mozilla/5.0 (CST website link check)" },
    });
    const moved = res.url && res.url !== url ? ` -> ${res.url}` : "";
    return `${res.status}${moved}`;
  } catch (e) {
    return `failed (${e.name === "TimeoutError" ? "timed out" : (e.cause?.code ?? e.message)})`;
  }
}

const results = await Promise.all(links.map(async (l) => ({ ...l, result: await check(l.url) })));
for (const r of results) {
  console.log(
    `${r.project.padEnd(38)} ${String(r.state).padEnd(10)} ${r.result}\n${"".padEnd(49)}${r.url}`,
  );
}
const unavailable = projects.filter((p) => p.linkState === "unavailable").map((p) => p.name);
console.log(`\nNot linked (unavailable): ${unavailable.join(", ")}`);
