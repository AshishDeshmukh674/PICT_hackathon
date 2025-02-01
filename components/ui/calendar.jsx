"use client";
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"
import { buttonVariants } from "../../components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  month,
  onMonthChange,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("w-full p-3 md:p-4", className)}
      month={month}
      onMonthChange={onMonthChange}
      classNames={{
        months: "flex flex-col space-y-4",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "grid grid-cols-7",
        head_cell: cn(
          "text-muted-foreground text-center text-[0.8rem] font-medium",
          "h-9 p-0 align-middle"
        ),
        row: "grid grid-cols-7 mt-2",
        cell: cn(
          "text-center text-sm align-middle",
          "relative p-0 focus-within:relative focus-within:z-20"
        ),
        day: cn(
          "h-9 w-9 p-0 mx-auto",
          "inline-flex items-center justify-center rounded-md",
          "text-sm font-normal transition-colors hover:bg-accent",
          "cursor-pointer select-none"
        ),
        day_selected: "bg-blue-600 text-white hover:bg-blue-700",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      weekStartsOn={0}
      formatters={{
        formatWeekdayName: (date) => {
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        }
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar"

export { Calendar }

