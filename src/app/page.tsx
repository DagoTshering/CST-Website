const technologies = [
  { name: "Next.js", detail: "App Router, TypeScript" },
  { name: "PostgreSQL", detail: "Primary database" },
  { name: "Drizzle ORM", detail: "Type-safe queries and migrations" },
  { name: "Tailwind CSS", detail: "Utility-first styling" },
  { name: "Docker", detail: "Compose for app and database" },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-accent uppercase">Project foundation</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">CST Website</h1>
      <p className="mt-4 text-lg text-muted">The Next.js application is running successfully.</p>

      <h2 className="mt-12 text-xl">Technology stack</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {technologies.map((tech) => (
          <li key={tech.name} className="rounded-lg border border-border bg-surface px-4 py-3">
            <span className="font-semibold">{tech.name}</span>
            <span className="block text-sm text-muted">{tech.detail}</span>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-sm text-muted">
        Database status: <a href="/api/health">/api/health</a>
      </p>
    </main>
  );
}
