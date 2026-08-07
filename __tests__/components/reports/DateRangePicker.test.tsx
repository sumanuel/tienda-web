/**
 * Tests de componentes para components/reports/DateRangePicker.tsx
 *
 * Objetivo: Validar validaciones de fechas y manejo de cambios
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DateRangePicker from '@/components/reports/DateRangePicker';
import { format } from 'date-fns';

describe('DateRangePicker.tsx', () => {
  const mockOnChange = jest.fn();

  const defaultProps = {
    dateRange: {
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-07'),
    },
    onChange: mockOnChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('debe renderizar dos inputs de fecha', () => {
      render(<DateRangePicker {...defaultProps} />);

      const inputs =
        screen.getAllByRole('textbox') ||
        screen.getAllByDisplayValue(/2026-08/);
      expect(inputs.length).toBeGreaterThanOrEqual(2);
    });

    it('debe mostrar las fechas iniciales correctamente', () => {
      render(<DateRangePicker {...defaultProps} />);

      const startInput = screen.getByDisplayValue('2026-08-01');
      const endInput = screen.getByDisplayValue('2026-08-07');

      expect(startInput).toBeInTheDocument();
      expect(endInput).toBeInTheDocument();
    });

    it('debe mostrar texto "hasta" entre los inputs', () => {
      render(<DateRangePicker {...defaultProps} />);

      expect(screen.getByText('hasta')).toBeInTheDocument();
    });
  });

  describe('Cambio de fecha inicio', () => {
    it('debe llamar onChange cuando se cambia la fecha inicio', () => {
      render(<DateRangePicker {...defaultProps} />);

      const startInput = screen.getByDisplayValue('2026-08-01');
      fireEvent.change(startInput, { target: { value: '2026-08-05' } });

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('debe preservar endDate cuando se cambia startDate', () => {
      render(<DateRangePicker {...defaultProps} />);

      const startInput = screen.getByDisplayValue('2026-08-01');
      fireEvent.change(startInput, { target: { value: '2026-08-03' } });

      const callArg = mockOnChange.mock.calls[0][0];
      expect(callArg.endDate).toEqual(defaultProps.dateRange.endDate);
    });
  });

  describe('Cambio de fecha fin', () => {
    it('debe llamar onChange cuando se cambia la fecha fin', () => {
      render(<DateRangePicker {...defaultProps} />);

      const endInput = screen.getByDisplayValue('2026-08-07');
      fireEvent.change(endInput, { target: { value: '2026-08-10' } });

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('debe preservar startDate cuando se cambia endDate', () => {
      render(<DateRangePicker {...defaultProps} />);

      const endInput = screen.getByDisplayValue('2026-08-07');
      fireEvent.change(endInput, { target: { value: '2026-08-15' } });

      const callArg = mockOnChange.mock.calls[0][0];
      expect(callArg.startDate).toEqual(defaultProps.dateRange.startDate);
    });
  });

  describe('BUG-012: NO valida startDate < endDate', () => {
    it('FALLA: permite seleccionar startDate > endDate (bug crítico)', () => {
      render(<DateRangePicker {...defaultProps} />);

      const startInput = screen.getByDisplayValue('2026-08-01');

      // Seleccionar fecha inicio POSTERIOR a fecha fin
      fireEvent.change(startInput, { target: { value: '2026-08-15' } });

      // BUG: No hay validación, onChange se llama con fecha inválida
      expect(mockOnChange).toHaveBeenCalled();

      // DEBERÍA rechazar el cambio o mostrar error
      // Este test DOCUMENTA el bug actual
    });
  });

  describe('BUG-013: Timezone no manejado', () => {
    it('DOCUMENTA: new Date() puede causar problemas de timezone', () => {
      // BUG: El componente usa new Date(e.target.value) directamente
      // Esto puede causar diferencias de 1 día dependiendo del timezone

      const testDate = '2026-08-05';
      const parsed = new Date(testDate);

      // En algunos timezones, esto puede resultar en 2026-08-04 23:00
      console.log('Parsed date:', parsed.toISOString());

      // DEBERÍA usar parseISO() de date-fns para parsing seguro
    });
  });
});
