'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Search, Filter, X } from 'lucide-react';

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

export function SalesFilters({ filters, onFiltersChange }: SalesFiltersProps) {
  const [localFilters, setLocalFilters] = useState<SalesFilters>(filters);

  const handleApplyFilters = () => {
    onFiltersChange({ ...localFilters, page: 1 });
  };

  const handleClearFilters = () => {
    const clearedFilters: SalesFilters = {
      startDate: '',
      endDate: '',
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
    localFilters.startDate ||
    localFilters.endDate ||
    localFilters.customerId ||
    localFilters.paymentMethod ||
    localFilters.status;

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Filter className="h-5 w-5 text-gray-600 dark:text-slate-400" />
        <h3 className="text-lg font-semibold">Filtros</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="ml-auto text-red-600 hover:text-red-700"
          >
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Fecha desde */}
        <div>
          <Label htmlFor="startDate">Desde</Label>
          <Input
            id="startDate"
            type="date"
            value={localFilters.startDate || ''}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, startDate: e.target.value })
            }
          />
        </div>

        {/* Fecha hasta */}
        <div>
          <Label htmlFor="endDate">Hasta</Label>
          <Input
            id="endDate"
            type="date"
            value={localFilters.endDate || ''}
            onChange={(e) =>
              setLocalFilters({ ...localFilters, endDate: e.target.value })
            }
          />
        </div>

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
          className="bg-[#2D7A5B] hover:bg-[#236449]"
        >
          <Search className="mr-2 h-4 w-4" />
          Aplicar Filtros
        </Button>
      </div>
    </Card>
  );
}
