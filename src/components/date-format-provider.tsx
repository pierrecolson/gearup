"use client";

import { createContext, useContext } from "react";
import { formatFullDate, formatShortDate } from "@/lib/date-format";
import type { DateFormat } from "@/lib/types";

const DateFormatContext = createContext<DateFormat>("dd/MM/yyyy");

export function DateFormatProvider({
  value,
  children,
}: {
  value: DateFormat;
  children: React.ReactNode;
}) {
  return (
    <DateFormatContext.Provider value={value}>
      {children}
    </DateFormatContext.Provider>
  );
}

export function useDateFormat(): DateFormat {
  return useContext(DateFormatContext);
}

export function useFormatDate() {
  const dateFormat = useContext(DateFormatContext);
  return (value: string | Date | null | undefined) =>
    formatFullDate(value, dateFormat);
}

export function useFormatShortDate() {
  const dateFormat = useContext(DateFormatContext);
  return (value: string | Date | null | undefined) =>
    formatShortDate(value, dateFormat);
}
