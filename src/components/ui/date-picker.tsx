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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormatDate } from "@/components/date-format-provider";

export type DatePrecision = "day" | "month" | "year";

export type DatePickerProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowClear?: boolean;
  /** Which precisions the user can pick. Defaults to ["day"]. */
  precisions?: DatePrecision[];
};

const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function detectPrecision(value: string | null): DatePrecision {
  if (!value) return "day";
  const d = parseISO(value);
  if (Number.isNaN(d.getTime())) return "day";
  if (d.getMonth() === 0 && d.getDate() === 1) return "year";
  if (d.getDate() === 1) return "month";
  return "day";
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled,
  allowClear = true,
  precisions = ["day"],
}: DatePickerProps) {
  const formatDate = useFormatDate();
  const [open, setOpen] = React.useState(false);
  // Track the precision the user is currently working in. Seeded from the
  // existing value (if any), or the first precision in the list.
  const [precision, setPrecision] = React.useState<DatePrecision>(() => {
    const detected = detectPrecision(value);
    return precisions.includes(detected) ? detected : precisions[0];
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    // When closing, re-sync the precision tab to whatever the value looks like
    // so the next open lands on a sensible tab without needing an effect.
    if (!next) {
      const detected = detectPrecision(value);
      const target = precisions.includes(detected) ? detected : precisions[0];
      if (target !== precision) setPrecision(target);
    }
  }

  const selected = value ? parseISO(value) : undefined;
  const hasValue = Boolean(value);
  const showTabs = precisions.length > 1;

  function displayText(): string {
    if (!hasValue) return placeholder;
    const detected = detectPrecision(value);
    if (detected === "year") return value!.slice(0, 4);
    if (detected === "month") {
      const d = parseISO(value!);
      return `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`;
    }
    return formatDate(value);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
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
            <span className="flex-1 text-left truncate">
              {displayText()}
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
        {showTabs && (
          <div className="flex items-center gap-1 border-b border-border/60 p-1">
            {precisions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPrecision(p)}
                data-active={precision === p}
                className="flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize text-muted-foreground hover:text-foreground transition-colors data-[active=true]:bg-accent data-[active=true]:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        {precision === "day" && (
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(d) => {
              onChange(d ? fmtDate(d, "yyyy-MM-dd") : null);
              if (d) setOpen(false);
            }}
            defaultMonth={selected ?? new Date()}
          />
        )}
        {precision === "month" && (
          <MonthPanel
            value={value}
            onPick={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
          />
        )}
        {precision === "year" && (
          <YearPanel
            value={value}
            onPick={(iso) => {
              onChange(iso);
              setOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}

function MonthPanel({
  value,
  onPick,
}: {
  value: string | null;
  onPick: (iso: string) => void;
}) {
  const parsed = value ? parseISO(value) : null;
  const [year, setYear] = React.useState<number>(
    parsed && !Number.isNaN(parsed.getTime())
      ? parsed.getFullYear()
      : new Date().getFullYear(),
  );
  const selectedMonth =
    parsed && !Number.isNaN(parsed.getTime()) && parsed.getFullYear() === year
      ? parsed.getMonth()
      : null;
  const years = yearRange(new Date().getFullYear());

  return (
    <div className="p-2 w-64 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Year</span>
        <Select
          value={String(year)}
          onValueChange={(v) => v && setYear(Number(v))}
        >
          <SelectTrigger className="h-7 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {MONTH_LABELS.map((label, idx) => (
          <button
            key={label}
            type="button"
            data-active={selectedMonth === idx}
            onClick={() =>
              onPick(`${year}-${String(idx + 1).padStart(2, "0")}-01`)
            }
            className="rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:hover:bg-foreground/90"
          >
            {label.slice(0, 3)}
          </button>
        ))}
      </div>
    </div>
  );
}

function YearPanel({
  value,
  onPick,
}: {
  value: string | null;
  onPick: (iso: string) => void;
}) {
  const parsed = value ? parseISO(value) : null;
  const selectedYear =
    parsed && !Number.isNaN(parsed.getTime()) ? parsed.getFullYear() : null;
  const years = yearRange(new Date().getFullYear());

  return (
    <div className="p-2 w-64">
      <div className="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            data-active={selectedYear === y}
            onClick={() => onPick(`${y}-01-01`)}
            className="rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors data-[active=true]:bg-foreground data-[active=true]:text-background data-[active=true]:hover:bg-foreground/90"
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  );
}

function yearRange(currentYear: number): number[] {
  // Twenty years back, ten years forward — covers historic purchases and a
  // reasonable horizon for renewal targets.
  const start = currentYear - 20;
  const end = currentYear + 10;
  const out: number[] = [];
  for (let y = end; y >= start; y--) out.push(y);
  return out;
}
