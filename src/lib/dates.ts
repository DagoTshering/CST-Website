const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Splits an ISO `YYYY-MM-DD` date without involving time zones. */
export function dateParts(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return { day: String(day).padStart(2, "0"), month: MONTHS[month - 1], year: String(year) };
}

/** Formats an ISO date as e.g. "08 Oct 2026". */
export function formatDate(iso: string) {
  const { day, month, year } = dateParts(iso);
  return `${day} ${month} ${year}`;
}
