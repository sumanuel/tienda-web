'use client';

import { FileSpreadsheet, FileText } from 'lucide-react';

interface ExportButtonsProps {
  onExportExcel: () => void;
  onExportPDF: () => void;
  disabled?: boolean;
}

export default function ExportButtons({
  onExportExcel,
  onExportPDF,
  disabled = false,
}: ExportButtonsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onExportExcel}
        disabled={disabled}
        className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-600"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </button>

      <button
        onClick={onExportPDF}
        disabled={disabled}
        className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600"
      >
        <FileText className="h-4 w-4" />
        PDF
      </button>
    </div>
  );
}
