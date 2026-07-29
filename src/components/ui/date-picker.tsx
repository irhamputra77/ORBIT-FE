"use client";

import { useState } from "react";
import { CalendarDays, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

function parseDate(value?: string) {
  if (!value) return undefined;

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function serializeDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(date?: Date) {
  if (!date) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled,
  className,
  "aria-label": ariaLabel,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDate(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative min-w-0", className)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label={ariaLabel ?? placeholder}
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-blue-700/20 bg-blue-500/[0.035] px-3 text-left text-xs font-medium text-foreground outline-none transition hover:border-blue-600/40 focus:border-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarDays size={14} className="shrink-0 text-blue-600" />
            <span className={cn("min-w-0 flex-1 truncate", !value && "text-muted-foreground")}>
              {selected ? displayDate(selected) : value || placeholder}
            </span>
          </button>
        </PopoverTrigger>

        {value && !disabled && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
            }}
            aria-label="Clear date"
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X size={12} />
          </button>
        )}
      </div>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(serializeDate(date));
            setOpen(false);
          }}
          defaultMonth={selected}
        />
      </PopoverContent>
    </Popover>
  );
}
