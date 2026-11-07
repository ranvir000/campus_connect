import { format, parseISO } from "date-fns";

// Timestamps arrive as ISO strings anchored server-side in IST (campus time).
// Display the campus wall-clock as written by dropping the offset, so a 9:00 AM
// event reads 9:00 AM for every viewer regardless of browser time zone.
function campusClock(iso: string): Date {
  return parseISO(iso.slice(0, 19));
}

export function fmtDate(iso: string): string {
  try {
    return format(campusClock(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

export function fmtDateTime(iso: string): string {
  try {
    return format(campusClock(iso), "d MMM yyyy • h:mm a");
  } catch {
    return iso;
  }
}
