'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { AccountStatus } from '@/types/transaction';

import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface AccountStatusPDFProps {
  accountStatus: AccountStatus;
  type: 'customer' | 'supplier';
}

export function AccountStatusPDF({
  accountStatus,
  type,
}: AccountStatusPDFProps) {
  const generatePDF = () => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.text('Estado de Cuenta', 14, 20);

    doc.setFontSize(10);
    doc.text(
      `Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`,
      14,
      27
    );

    // Información del cliente/proveedor
    doc.setFontSize(12);
    const typeLabel = type === 'customer' ? 'Cliente' : 'Proveedor';
    doc.text(`${typeLabel}: ${accountStatus.name}`, 14, 37);

    if (type === 'customer' && accountStatus.document) {
      doc.text(`Documento: ${accountStatus.document}`, 14, 44);
    } else if (type === 'supplier' && accountStatus.rif) {
      doc.text(`RIF: ${accountStatus.rif}`, 14, 44);
    }

    doc.setFontSize(14);
    doc.setTextColor(220, 38, 38); // text-red-600
    doc.text(
      `Saldo Actual: $${accountStatus.currentBalance.toFixed(2)}`,
      14,
      51
    );
    doc.setTextColor(0, 0, 0); // Reset color

    // Resumen
    doc.setFontSize(10);
    doc.text(`Total Cargos: $${accountStatus.totalCharges.toFixed(2)}`, 14, 61);
    doc.text(
      `Total ${type === 'customer' ? 'Abonos' : 'Pagos'}: $${accountStatus.totalPayments.toFixed(2)}`,
      14,
      67
    );
    if (accountStatus.overdueAmount > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(
        `Saldo Vencido: $${accountStatus.overdueAmount.toFixed(2)}`,
        14,
        73
      );
      doc.setTextColor(0, 0, 0);
    }

    // Tabla de transacciones
    const tableData = accountStatus.transactions.map((t) => [
      format(t.createdAt, 'dd/MM/yyyy', { locale: es }),
      t.type === 'charge' ? 'Cargo' : type === 'customer' ? 'Abono' : 'Pago',
      `$${t.amount.toFixed(2)}`,
      t.paymentMethod || '-',
      `$${t.balanceAfter.toFixed(2)}`,
      t.notes || '-',
    ]);

    autoTable(doc, {
      startY: accountStatus.overdueAmount > 0 ? 80 : 74,
      head: [['Fecha', 'Tipo', 'Monto', 'Método', 'Balance', 'Notas']],
      body: tableData,
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [59, 130, 246], // bg-blue-600
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251], // bg-gray-50
      },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    // Guardar
    const fileName = `estado-cuenta-${accountStatus.name.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyyMMdd')}.pdf`;
    doc.save(fileName);
  };

  return (
    <Button onClick={generatePDF} variant="outline" size="sm">
      <Download className="mr-2 h-4 w-4" />
      Descargar PDF
    </Button>
  );
}
