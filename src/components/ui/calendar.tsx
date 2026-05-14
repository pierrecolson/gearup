"use client";

import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";

export type CalendarProps = DayPickerProps;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-2", className)}
      classNames={{
        months: "flex flex-col gap-3",
        month: "space-y-3",
        month_caption: "flex justify-center items-center h-8 relative",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1 absolute inset-x-0 top-0 justify-between px-1",
        button_previous:
          "inline-flex items-center justify-center size-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
        button_next:
          "inline-flex items-center justify-center size-7 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.75rem] uppercase tracking-wider",
        week: "flex w-full mt-1",
        day: "size-9 p-0 text-center text-sm relative focus-within:relative focus-within:z-20",
        day_button:
          "inline-flex items-center justify-center size-9 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors aria-selected:bg-foreground aria-selected:text-background aria-selected:hover:bg-foreground/90 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected: "[&_button]:bg-foreground [&_button]:text-background",
        today: "[&_button]:font-semibold [&_button]:text-blue-600 dark:[&_button]:text-blue-400 aria-selected:[&_button]:text-background",
        outside: "[&_button]:text-muted-foreground/40",
        disabled: "[&_button]:opacity-30 [&_button]:pointer-events-none",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <CaretLeft className="size-4" />
          ) : (
            <CaretRight className="size-4" />
          ),
      }}
      {...props}
    />
  );
}
