/**
 * Tests de componentes para components/reports/ExportButtons.tsx
 *
 * Objetivo: Validar clicks, disabled states
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ExportButtons from '@/components/reports/ExportButtons';

describe('ExportButtons.tsx', () => {
  const mockOnExportExcel = jest.fn();
  const mockOnExportPDF = jest.fn();

  const defaultProps = {
    onExportExcel: mockOnExportExcel,
    onExportPDF: mockOnExportPDF,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderizado', () => {
    it('debe renderizar ambos botones (Excel y PDF)', () => {
      render(<ExportButtons {...defaultProps} />);

      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('PDF')).toBeInTheDocument();
    });

    it('botones deben estar habilitados por defecto', () => {
      render(<ExportButtons {...defaultProps} />);

      const excelButton = screen.getByText('Excel').closest('button');
      const pdfButton = screen.getByText('PDF').closest('button');

      expect(excelButton).not.toBeDisabled();
      expect(pdfButton).not.toBeDisabled();
    });
  });

  describe('Estado disabled', () => {
    it('debe deshabilitar ambos botones cuando disabled=true', () => {
      render(<ExportButtons {...defaultProps} disabled={true} />);

      const excelButton = screen.getByText('Excel').closest('button');
      const pdfButton = screen.getByText('PDF').closest('button');

      expect(excelButton).toBeDisabled();
      expect(pdfButton).toBeDisabled();
    });

    it('debe permitir clicks cuando disabled=false', () => {
      render(<ExportButtons {...defaultProps} disabled={false} />);

      const excelButton = screen.getByText('Excel').closest('button');
      const pdfButton = screen.getByText('PDF').closest('button');

      expect(excelButton).not.toBeDisabled();
      expect(pdfButton).not.toBeDisabled();
    });
  });

  describe('Clicks en botones', () => {
    it('debe llamar onExportExcel cuando se clickea botón Excel', () => {
      render(<ExportButtons {...defaultProps} />);

      const excelButton = screen.getByText('Excel').closest('button');
      fireEvent.click(excelButton!);

      expect(mockOnExportExcel).toHaveBeenCalledTimes(1);
      expect(mockOnExportPDF).not.toHaveBeenCalled();
    });

    it('debe llamar onExportPDF cuando se clickea botón PDF', () => {
      render(<ExportButtons {...defaultProps} />);

      const pdfButton = screen.getByText('PDF').closest('button');
      fireEvent.click(pdfButton!);

      expect(mockOnExportPDF).toHaveBeenCalledTimes(1);
      expect(mockOnExportExcel).not.toHaveBeenCalled();
    });

    it('NO debe llamar callbacks cuando botones están disabled', () => {
      render(<ExportButtons {...defaultProps} disabled={true} />);

      const excelButton = screen.getByText('Excel').closest('button');
      const pdfButton = screen.getByText('PDF').closest('button');

      fireEvent.click(excelButton!);
      fireEvent.click(pdfButton!);

      expect(mockOnExportExcel).not.toHaveBeenCalled();
      expect(mockOnExportPDF).not.toHaveBeenCalled();
    });
  });

  describe('Múltiples clicks', () => {
    it('debe manejar múltiples clicks en Excel', () => {
      render(<ExportButtons {...defaultProps} />);

      const excelButton = screen.getByText('Excel').closest('button');

      fireEvent.click(excelButton!);
      fireEvent.click(excelButton!);
      fireEvent.click(excelButton!);

      expect(mockOnExportExcel).toHaveBeenCalledTimes(3);
    });

    it('debe permitir clicks alternados entre Excel y PDF', () => {
      render(<ExportButtons {...defaultProps} />);

      const excelButton = screen.getByText('Excel').closest('button');
      const pdfButton = screen.getByText('PDF').closest('button');

      fireEvent.click(excelButton!);
      fireEvent.click(pdfButton!);
      fireEvent.click(excelButton!);

      expect(mockOnExportExcel).toHaveBeenCalledTimes(2);
      expect(mockOnExportPDF).toHaveBeenCalledTimes(1);
    });
  });

  describe('Estilos visuales', () => {
    it('botón Excel debe tener clase bg-green-600', () => {
      render(<ExportButtons {...defaultProps} />);

      const excelButton = screen.getByText('Excel').closest('button');
      expect(excelButton?.className).toContain('bg-green-600');
    });

    it('botón PDF debe tener clase bg-red-600', () => {
      render(<ExportButtons {...defaultProps} />);

      const pdfButton = screen.getByText('PDF').closest('button');
      expect(pdfButton?.className).toContain('bg-red-600');
    });

    it('botones disabled deben tener opacity-50', () => {
      render(<ExportButtons {...defaultProps} disabled={true} />);

      const excelButton = screen.getByText('Excel').closest('button');
      const pdfButton = screen.getByText('PDF').closest('button');

      expect(excelButton?.className).toContain('opacity-50');
      expect(pdfButton?.className).toContain('opacity-50');
    });
  });
});
