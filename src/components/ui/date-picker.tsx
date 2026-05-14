"use client";

import * as React from "react";
import { parseISO, format as fmtDate } from "date-fns";
import { CalendarBlank, X } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFormatDate } from "@/components/date-format-provider";

export type DatePickerProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
};

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  allowClear = true,
}: DatePickerProps) {
  const formatDate = useFormatDate();
  const [open, setOpen] = React.useState(false);
  const selected = value ? parseISO(value) : undefined;
  const hasValue = Boolean(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            data-empty={!hasValue}
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-[empty=true]:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
              className,
            )}
          >
            <CalendarBlank className="size-4 shrink-0 text-muted-foreground" />
            <span className="flex-1 text-left">
              {hasValue ? formatDate(value) : placeholder}
            </span>
            {hasValue && allowClear && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear date"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onChange(null);
                  }
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </span>
            )}
          </button>
        }
      />
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            onChange(d ? fmtDate(d, "yyyy-MM-dd") : null);
            if (d) setOpen(false);
          }}
          defaultMonth={selected ?? new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
