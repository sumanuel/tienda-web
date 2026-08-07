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
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-500" />
        <input
          type="date"
          value={format(dateRange.startDate, 'yyyy-MM-dd')}
          onChange={(e) =>
            onChange({
              ...dateRange,
              startDate: new Date(e.target.value),
            })
          }
          className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <span className="text-gray-500">hasta</span>

      <input
        type="date"
        value={format(dateRange.endDate, 'yyyy-MM-dd')}
        onChange={(e) =>
          onChange({
            ...dateRange,
            endDate: new Date(e.target.value),
          })
        }
        className="rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}
