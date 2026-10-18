import type { ReactNode } from "react";

/**
 * The Student Hub and its pop-up. Following a club from the list fills the @modal slot (an
 * intercepted /student-hub/[slug]) over the list; anywhere else the slot is empty.
 */
export default function StudentHubLayout({
  children,
  modal,
}: {
  children: ReactNode;
  modal: ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
