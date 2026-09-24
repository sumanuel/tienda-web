'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { es } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={es}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row gap-2',
        month: 'flex flex-col gap-4',
        month_caption: 'flex justify-center pt-1 relative items-center w-full',
        caption_label:
          'text-sm font-semibold text-gray-900 dark:text-slate-100 capitalize',
        nav: 'flex items-center justify-between absolute inset-x-0 top-0',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 border-gray-200 text-gray-500 hover:text-gray-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'size-7 bg-transparent p-0 border-gray-200 text-gray-500 hover:text-gray-900 dark:border-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
        ),
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday:
          'text-gray-400 dark:text-slate-500 rounded-md w-8 font-mono text-[0.65rem] font-semibold uppercase tracking-wide',
        week: 'flex w-full mt-1',
        day: 'relative p-0 text-center text-sm size-8 [&:has([data-selected])]:bg-brand-primary-light dark:[&:has([data-selected])]:bg-tsuma-primary-light first:[&:has([data-selected])]:rounded-l-lg last:[&:has([data-selected])]:rounded-r-lg',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-8 p-0 font-normal text-gray-700 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800 aria-selected:opacity-100'
        ),
        range_start: 'rounded-l-lg',
        range_end: 'rounded-r-lg',
        range_middle:
          'bg-brand-primary-light dark:bg-tsuma-primary-light rounded-none',
        selected:
          '[&>button]:bg-brand-primary [&>button]:text-white [&>button]:hover:bg-brand-primary-dark [&>button]:hover:text-white',
        today:
          '[&>button]:border [&>button]:border-brand-primary [&>button]:text-brand-primary',
        outside: 'text-gray-300 dark:text-slate-600 opacity-50',
        disabled: 'text-gray-300 dark:text-slate-700 opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" {...chevronProps} />
          ) : (
            <ChevronRight className="h-4 w-4" {...chevronProps} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
