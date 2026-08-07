import { create } from 'zustand';
import { DateRange } from '@/types/reports';
import { startOfMonth, endOfDay } from 'date-fns';

interface ReportsStore {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  resetToCurrentMonth: () => void;
}

export const useReportsStore = create<ReportsStore>((set) => ({
  dateRange: {
    startDate: startOfMonth(new Date()),
    endDate: endOfDay(new Date()),
  },
  setDateRange: (range) => set({ dateRange: range }),
  resetToCurrentMonth: () =>
    set({
      dateRange: {
        startDate: startOfMonth(new Date()),
        endDate: endOfDay(new Date()),
      },
    }),
}));
