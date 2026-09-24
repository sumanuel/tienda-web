'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search, Filter, X, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SalesFilters {
  startDate?: string;
  endDate?: string;
  customerId?: string;
  paymentMethod?: string;
  status?: string;
  page: number;
  limit: number;
}

interface SalesFiltersProps {
  filters: SalesFilters;
  onFiltersChange: (filters: SalesFilters) => void;
}

interface DateFieldProps {
  id: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
}

function DateField({ id, label, value, onChange }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = value ? parseISO(value) : undefined;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            className="focus:border-brand-primary focus:ring-brand-primary mt-1.5 flex w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:ring-1 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            <CalendarIcon className="h-4 w-4 text-gray-500 dark:text-slate-400" />
            <span className="font-mono">
              {selectedDate
                ? format(selectedDate, 'dd MMM yyyy', { locale: es })
                : 'Seleccionar fecha'}
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function SalesFilters({ filters, onFiltersChange }: SalesFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SalesFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange({ ...localFilters, page: 1 });
  };

  const handleClearFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    const clearedFilters: SalesFilters = {
      startDate: today,
      endDate: today,
      customerId: '',
      paymentMethod: '',
      status: '',
      page: 1,
      limit: filters.limit,
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters =
    localFilters.customerId ||
    localFilters.paymentMethod ||
    localFilters.status;

  return (
    <Card className="rounded-2xl border-gray-200 p-4 shadow-sm dark:border-slate-800">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-5 w-5 text-gray-600 dark:text-slate-400" />
        <h3 className="text-lg font-semibold text-gray-800 dark:text-slate-200">
          Filtros
        </h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="ml-auto text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Fecha desde */}
        <DateField
          id="startDate"
          label="Desde"
          value={localFilters.startDate}
          onChange={(value) =>
            setLocalFilters({ ...localFilters, startDate: value })
          }
        />

        {/* Fecha hasta */}
        <DateField
          id="endDate"
          label="Hasta"
          value={localFilters.endDate}
          onChange={(value) =>
            setLocalFilters({ ...localFilters, endDate: value })
          }
        />

        {/* Método de pago */}
        <div>
          <Label htmlFor="paymentMethod">Método de Pago</Label>
          <Select
            value={localFilters.paymentMethod || 'all'}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                paymentMethod: value === 'all' ? '' : value,
              })
            }
          >
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los métodos</SelectItem>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="card">Tarjeta</SelectItem>
              <SelectItem value="transfer">Transferencia</SelectItem>
              <SelectItem value="pago_movil">Pago Móvil</SelectItem>
              <SelectItem value="por_cobrar">Por Cobrar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estado */}
        <div>
          <Label htmlFor="status">Estado</Label>
          <Select
            value={localFilters.status || 'all'}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                status: value === 'all' ? '' : value,
              })
            }
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="completed">Completada</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="mt-4 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          Limpiar
        </Button>
        <Button
          onClick={handleApplyFilters}
          className="bg-brand-primary hover:bg-brand-primary-dark"
        >
          <Search className="mr-2 h-4 w-4" />
          Aplicar Filtros
        </Button>
      </div>
    </Card>
  );
}
