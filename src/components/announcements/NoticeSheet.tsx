import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

import { RichText } from "@/components/ui/RichText";
import type { RichNode } from "@/lib/rich-text";

import { DateStamp } from "./NoticeCard";
import s from "./NoticeBoard.module.css";

export type NoticeSheetData = {
  title: string;
  content: RichNode;
  publishedOn: string;
  attachment: { url: string; name: string; size: number } | null;
};

const size = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

/** The college's seal, faint in the sheet's corner (decoration). */
function Seal() {
  const teeth = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const x1 = 50 + Math.cos(a) * 44;
    const y1 = 50 + Math.sin(a) * 44;
    const x2 = 50 + Math.cos(a) * 49;
    const y2 = 50 + Math.sin(a) * 49;
    return `M${x1.toFixed(2)} ${y1.toFixed(2)} L${x2.toFixed(2)} ${y2.toFixed(2)}`;
  });
  return (
    <div className={s.seal} aria-hidden="true" data-loop="" suppressHydrationWarning>
      <svg viewBox="0 0 100 100" focusable="false">
        <g fill="none" stroke="currentColor">
          <circle cx="50" cy="50" r="44" strokeWidth="2" />
          <circle cx="50" cy="50" r="34" strokeWidth="1" />
          <path d={teeth.join(" ")} strokeWidth="3" />
        </g>
        <text
          x="50"
          y="55"
          textAnchor="middle"
          fontSize="14"
          fontWeight="700"
          fill="currentColor"
          fontFamily="serif"
        >
          CST
        </text>
      </svg>
    </div>
  );
}

/**
 * One notice as an official sheet: a letterhead, its date stamp, the title, the
 * notice itself and its PDF. The public page and the admin's preview page both draw it.
 */
export function NoticeSheet({
  notice,
  backHref = "/announcements",
  backLabel = "All announcements",
}: {
  notice: NoticeSheetData;
  backHref?: string;
  backLabel?: string;
}) {
  const back = (
    <Link
      href={backHref}
      className="inline-flex items-center gap-2 font-display text-[0.9375rem] font-semibold text-primary-strong hover:text-primary-deep"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {backLabel}
    </Link>
  );
  return (
    <div className={`container-page ${s.sheetWrap}`}>
      <nav aria-label="Breadcrumb" className="mx-auto max-w-[54rem] text-sm">
        {back}
      </nav>
      <article className={s.sheet}>
        <div className={s.letterhead}>
          <span className={s.letterheadName}>College of Science and Technology</span>
          <span className={s.letterheadSub}>Royal University of Bhutan · Notice</span>
        </div>
        <div className={s.sheetBody}>
          <div className={s.sheetMeta}>
            <DateStamp date={notice.publishedOn} />
          </div>
          <h1 className={`heading-serif ${s.sheetTitle}`}>{notice.title}</h1>
          <RichText doc={notice.content} className="relative z-[1] mt-8" />

          {notice.attachment && (
            <div className="relative z-[1] mt-10 flex flex-col gap-4 rounded-sm border border-line border-l-[3px] border-l-[#34acc8] bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
              {/* a long file name (no spaces) wraps instead of running out of the box */}
              <div className="min-w-0">
                <p className="eyebrow text-muted">Attached notice</p>
                <p className="mt-1 font-display font-semibold text-ink [overflow-wrap:anywhere]">
                  {notice.attachment.name}{" "}
                  <span className="font-normal text-muted">
                    (PDF, {size(notice.attachment.size)})
                  </span>
                </p>
              </div>
              <a
                href={`${notice.attachment.url}?download=1`}
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-sm bg-primary-strong px-5 font-display text-[0.9375rem] font-semibold text-white transition-colors hover:bg-primary-deep"
              >
                <Download className="size-4" aria-hidden="true" />
                Download PDF
              </a>
            </div>
          )}
          <Seal />
        </div>
      </article>
      <div className="mx-auto mt-10 max-w-[54rem]">{back}</div>
    </div>
  );
}
