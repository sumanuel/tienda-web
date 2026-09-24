'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DateRange as DayPickerRange } from 'react-day-picker';
import { DateRange } from '@/types/reports';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({
  dateRange,
  onChange,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const selected: DayPickerRange = {
    from: dateRange.startDate,
    to: dateRange.endDate,
  };

  const handleSelect = (range: DayPickerRange | undefined) => {
    if (!range?.from) return;

    onChange({
      startDate: range.from,
      endDate: range.to ?? range.from,
    });

    if (range.from && range.to) {
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="focus:border-brand-primary focus:ring-brand-primary flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
        >
          <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-slate-400" />
          <span className="font-mono">
            {format(dateRange.startDate, 'dd MMM yyyy', { locale: es })}
            {' – '}
            {format(dateRange.endDate, 'dd MMM yyyy', { locale: es })}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <Calendar
          mode="range"
          selected={selected}
          onSelect={handleSelect}
          defaultMonth={dateRange.startDate}
        />
      </PopoverContent>
    </Popover>
  );
}
