/** Shown while an admin page loads its data (each page folder's loading.tsx). */
export function PageSkeleton() {
  return (
    <div aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="mb-8 space-y-2.5">
        <div className="h-7 w-56 animate-pulse rounded bg-admin-line" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-admin-line/70" />
      </div>
      <div className="rounded-lg border border-admin-line bg-white p-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-admin-line py-4 last:border-0"
          >
            <div className="size-10 animate-pulse rounded bg-admin-line/70" />
            <div className="h-4 flex-1 animate-pulse rounded bg-admin-line/70" />
            <div className="h-4 w-20 animate-pulse rounded bg-admin-line/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
