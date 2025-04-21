// File: /components/custom/DateRangePicker.jsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (date: DateRange) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange>({
    from: value?.from,
    to: value?.to,
  });

  // Update local state when value prop changes
  useEffect(() => {
    setDate({
      from: value?.from,
      to: value?.to,
    });
  }, [value?.from, value?.to]);

  // Handle date selection
  const handleSelect = (newDate: DateRange) => {
    setDate(newDate);
    if (newDate.from && newDate.to) {
      onChange(newDate);
    }
  };

  // Format date range for display
  const formatDateRange = () => {
    if (date.from && date.to) {
      return `${format(date.from, "MMM d, yyyy")} - ${format(date.to, "MMM d, yyyy")}`;
    }
    return "Select date range";
  };

  // Clear date selection
  const clearSelection = () => {
    const newDate = { from: undefined, to: undefined };
    setDate(newDate);
    onChange(newDate);
  };

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={`w-full justify-start text-left font-normal ${
              !date.from && "text-gray-500"
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-end gap-2 p-2 border-t">
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (date.from && date.to) {
                  onChange(date);
                }
              }}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}