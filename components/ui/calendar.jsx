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
      className={cn("p-3", className)}
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
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between",
        head_cell: "text-muted-foreground rounded-md w-8 h-8 font-medium text-[0.8rem]",
        row: "flex w-full mt-1 justify-between",
        cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 w-8 h-8",
        day: cn(
          "h-8 w-8 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md transition-colors duration-200 cursor-pointer flex items-center justify-center text-sm"
        ),
        day_selected: "bg-blue-600 text-white hover:bg-blue-700 rounded-md",
        day_today: "bg-gray-50 text-gray-900 font-medium rounded-md",
        day_outside: "text-gray-400 opacity-50 hover:bg-gray-50",
        day_disabled: "text-gray-400 opacity-50 cursor-not-allowed hover:bg-transparent",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar"

export { Calendar }

