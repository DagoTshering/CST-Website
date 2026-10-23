import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

import { RichText } from "@/components/ui/RichText";
import type { RichNode } from "@/lib/rich-text";
import { formatVacancyDate, vacancyCategoryLabel } from "@/lib/vacancies";

export type VacancyArticleData = {
  title: string;
  category: string;
  content: RichNode;
  /** null for a draft, in the admin's preview. */
  publishedAt: Date | null;
  updatedAt: Date;
  attachment: { url: string; name: string; size: number } | null;
};

const megabytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

/**
 * A vacancy post as visitors see it: its category, title and date, the notice, and its PDF. The
 * public page and the admin's preview page both draw it, so a preview is exactly the page.
 */
export function VacancyArticle({
  post,
  backHref = "/vacancies",
  backLabel = "All vacancies",
}: {
  post: VacancyArticleData;
  backHref?: string;
  backLabel?: string;
}) {
  // "updated" is shown when it was changed a day or more after it was published
  const updated =
    post.publishedAt !== null && post.updatedAt.getTime() - post.publishedAt.getTime() > 86_400_000;
  const backLink = (
    <Link
      href={backHref}
      className="inline-flex items-center gap-2 font-display text-[0.9375rem] font-semibold text-primary-strong hover:text-primary-deep"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {backLabel}
    </Link>
  );

  return (
    <article className="container-page max-w-4xl pt-[clamp(2rem,1.25rem+2vw,3.25rem)]">
      <nav aria-label="Breadcrumb" className="text-sm">
        {backLink}
      </nav>
      <header className="mt-8 border-b border-line pb-8">
        <p className="eyebrow flex items-center gap-2 text-primary-strong">
          <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full bg-[#34acc8]" />
          {vacancyCategoryLabel(post.category)}
        </p>
        <h1 className="mt-4 heading-serif text-ink">{post.title}</h1>
        <p className="mt-4 font-mono text-xs tracking-[0.06em] text-muted">
          {post.publishedAt ? (
            <>
              Published{" "}
              <time dateTime={post.publishedAt.toISOString()}>
                {formatVacancyDate(post.publishedAt)}
              </time>
            </>
          ) : (
            "Not yet published"
          )}
          {updated && (
            <>
              {" "}
              · Updated{" "}
              <time dateTime={post.updatedAt.toISOString()}>
                {formatVacancyDate(post.updatedAt)}
              </time>
            </>
          )}
        </p>
      </header>

      <RichText doc={post.content} className="mt-10" />

      {post.attachment && (
        <div className="mt-12 flex flex-col gap-4 rounded-sm border border-line border-l-[3px] border-l-[#34acc8] p-5 sm:flex-row sm:items-center sm:justify-between">
          {/* a long file name (no spaces) wraps instead of running out of the box */}
          <div className="min-w-0">
            <p className="eyebrow text-muted">Official notice</p>
            <p className="mt-1 font-display font-semibold text-ink [overflow-wrap:anywhere]">
              {post.attachment.name}{" "}
              <span className="font-normal text-muted">
                (PDF, {megabytes(post.attachment.size)})
              </span>
            </p>
          </div>
          <a
            href={`${post.attachment.url}?download=1`}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-primary-strong px-5 font-display text-[0.9375rem] font-semibold text-white transition-colors hover:bg-primary-deep"
          >
            <Download className="size-4" aria-hidden="true" />
            Download PDF
          </a>
        </div>
      )}

      <div className="mt-14 border-t border-line pt-8 pb-[clamp(4rem,3rem+3vw,6.5rem)]">
        {backLink}
      </div>
    </article>
  );
}
