import type { ReactNode } from "react";

import s from "./Emphasis.module.css";

/**
 * A word set in teal with a hand-drawn gold underline, as in About's heading. Inside an element
 * marked data-reveal, the underline draws itself once that element is revealed.
 */
export function Emphasis({
  children,
  tone = "light",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
}) {
  return (
    <em className={s.emphasis} data-tone={tone}>
      {children}
      <svg
        className={s.swash}
        viewBox="0 0 240 14"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M3 9C40 3 80 12 120 7S200 3 237 8" />
      </svg>
    </em>
  );
}

/** `text` with the first `word` in it set as an <Emphasis>; the text alone if it has no such word. */
export function Emphasised({
  text,
  word,
  tone,
}: {
  text: string;
  word: string;
  tone?: "light" | "dark";
}) {
  const at = text.indexOf(word);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <Emphasis tone={tone}>{word}</Emphasis>
      {text.slice(at + word.length)}
    </>
  );
}
