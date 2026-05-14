import { format, parseISO } from "date-fns";
import type { DateFormat } from "@/lib/types";

function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

/**
 * Strip the day token from a date-fns format to get a month-precision variant.
 * Examples:
 *   dd/MM/yyyy → MM/yyyy
 *   yyyy.MM.dd → yyyy.MM
 *   yyyy-MM-dd → yyyy-MM
 *   MM/dd/yyyy → MM/yyyy
 */
function toMonthFormat(dateFormat: DateFormat): string {
  return dateFormat.replace(/[./-]dd|dd[./-]/, "");
}

export function formatFullDate(
  value: string | Date | null | undefined,
  dateFormat: DateFormat,
): string {
  if (!value) return "—";
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, dateFormat);
}

export function formatShortDate(
  value: string | Date | null | undefined,
  dateFormat: DateFormat,
): string {
  if (!value) return "—";
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, toMonthFormat(dateFormat));
}
