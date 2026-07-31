import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale } from '@/types/sale';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function generateReceiptPDF(sale: Sale, storeName: string): void {
  const doc = new jsPDF();

  // Encabezado
  doc.setFontSize(18);
  doc.text(storeName, 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text('RECIBO DE VENTA', 105, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Nº ${sale.saleNumber}`, 105, 37, { align: 'center' });

  // Información de venta
  doc.setFontSize(9);
  const startY = 50;

  doc.text(
    `Fecha: ${format(sale.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })}`,
    20,
    startY
  );
  doc.text(`Cajero: ${sale.cashierName}`, 20, startY + 5);
  if (sale.customerName) {
    doc.text(`Cliente: ${sale.customerName}`, 20, startY + 10);
  }
  doc.text(
    `Método de pago: ${sale.paymentMethod.toUpperCase()}`,
    20,
    startY + 15
  );

  // Tabla de productos
  const tableData = sale.items.map((item) => [
    item.productCode,
    item.productName,
    item.quantity.toString(),
    `${sale.currency} ${item.price.toFixed(2)}`,
    item.discount > 0 ? `${item.discount}%` : '-',
    `${sale.currency} ${item.subtotal.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: startY + 25,
    head: [['Código', 'Producto', 'Cant.', 'Precio', 'Desc.', 'Subtotal']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
  });

  // Totales
  const finalY = (doc as any).lastAutoTable.finalY + 10;

  doc.text(
    `Subtotal: ${sale.currency} ${sale.subtotal.toFixed(2)}`,
    140,
    finalY,
    {
      align: 'right',
    }
  );
  doc.text(
    `IVA (16%): ${sale.currency} ${sale.tax.toFixed(2)}`,
    140,
    finalY + 5,
    {
      align: 'right',
    }
  );

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `TOTAL: ${sale.currency} ${sale.total.toFixed(2)}`,
    140,
    finalY + 12,
    {
      align: 'right',
    }
  );

  if (sale.paymentMethod === 'cash' && sale.amountReceived) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Recibido: ${sale.currency} ${sale.amountReceived.toFixed(2)}`,
      140,
      finalY + 18,
      {
        align: 'right',
      }
    );
    doc.text(
      `Cambio: ${sale.currency} ${(sale.change || 0).toFixed(2)}`,
      140,
      finalY + 23,
      {
        align: 'right',
      }
    );
  }

  // Pie de página
  doc.setFontSize(8);
  doc.text('¡Gracias por su compra!', 105, 280, { align: 'center' });

  // Descargar PDF
  doc.save(`recibo-${sale.saleNumber}.pdf`);
}
