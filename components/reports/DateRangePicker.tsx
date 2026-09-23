'use client';

import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from '@/types/reports';

interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({
  dateRange,
  onChange,
}: DateRangePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-500 dark:text-slate-400" />
        <input
          type="date"
          value={format(dateRange.startDate, 'yyyy-MM-dd')}
          onChange={(e) =>
            onChange({
              ...dateRange,
              startDate: new Date(e.target.value),
            })
          }
          className="focus:border-brand-primary focus:ring-brand-primary rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
        />
      </div>

      <span className="text-sm text-gray-500 dark:text-slate-400">hasta</span>

      <input
        type="date"
        value={format(dateRange.endDate, 'yyyy-MM-dd')}
        onChange={(e) =>
          onChange({
            ...dateRange,
            endDate: new Date(e.target.value),
          })
        }
        className="focus:border-brand-primary focus:ring-brand-primary rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:bg-slate-900"
      />
    </div>
  );
}
