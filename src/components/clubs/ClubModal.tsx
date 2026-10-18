"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import s from "./StudentHub.module.css";

/**
 * A club opened over the list: a native modal <dialog>, so focus stays inside it, Esc closes it
 * and the page behind cannot scroll (globals.css). Its URL is the club's own page, so closing it
 * in any way (Esc, the Close button, a click on the backdrop) goes back in history, and the
 * browser's Back button closes it too. Closing the dialog first hands focus back to the row
 * that opened it.
 */
export function ClubModal({ titleId, children }: { titleId: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    // The visitor closed it: leave the club's URL. A close event that arrives once the dialog
    // is open again (React's development double mount closes and reopens it) is ignored.
    const onClose = () => {
      if (!el.open) router.back();
    };
    if (!el.open) el.showModal();
    el.addEventListener("close", onClose);
    // Next keeps a route it leaves mounted but hidden (React's Activity), so after Back the
    // dialog would stay modal out of sight, leaving the page inert and unscrollable. Hidden, it
    // closes without going back again (the listener is gone); shown again (Forward), it reopens.
    return () => {
      el.removeEventListener("close", onClose);
      if (el.open) el.close();
    };
  }, [router]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className={s.modal}
      onClick={(e) => {
        // a click on the backdrop lands on the dialog itself, outside its content
        if (e.target === e.currentTarget) e.currentTarget.close();
      }}
    >
      <div className={s.modalBar}>
        <p className={s.eyebrow}>Student Hub</p>
        <button type="button" className={s.close} onClick={() => dialog.current?.close()}>
          Close <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className={s.modalBody}>{children}</div>
    </dialog>
  );
}
