'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/currency';
import { useCreditNotes, type CreditNote } from '@/hooks/useCreditNotes';
import { toast } from 'react-hot-toast';

interface RefundDialogProps {
  creditNote: CreditNote | null;
  onClose: () => void;
  onRefunded: () => void;
}

export function RefundDialog({
  creditNote,
  onClose,
  onRefunded,
}: RefundDialogProps) {
  // El diálogo se monta con la nota seleccionada: el monto inicia en el máximo
  return (
    <Dialog
      open={creditNote !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        {creditNote && (
          <RefundForm
            key={creditNote.id}
            creditNote={creditNote}
            onClose={onClose}
            onRefunded={onRefunded}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function RefundForm({
  creditNote,
  onClose,
  onRefunded,
}: {
  creditNote: CreditNote;
  onClose: () => void;
  onRefunded: () => void;
}) {
  const { refundCreditNote } = useCreditNotes();
  const [amount, setAmount] = useState(creditNote.maxRefund.toFixed(2));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const value = Number(amount);
  const invalid =
    !Number.isFinite(value) ||
    value <= 0 ||
    value > creditNote.maxRefund + 0.005;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await refundCreditNote(creditNote.id, value, notes.trim() || undefined);
      toast.success(`Reembolso de ${formatCurrency(value, 'USD')} registrado`);
      onRefunded();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Error al registrar el reembolso'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Reembolso de {creditNote.noteNumber}</DialogTitle>
        <DialogDescription>
          Registra el dinero que {creditNote.supplier?.name ?? 'el proveedor'}{' '}
          te devuelve. El saldo a favor baja por ese monto.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-slate-950">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-slate-400">
              Pendiente de la nota
            </span>
            <span className="font-mono">
              {formatCurrency(creditNote.remainingUsd, 'USD')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-slate-400">
              Saldo a favor vigente
            </span>
            <span className="font-mono">
              {formatCurrency(creditNote.availableCredit, 'USD')}
            </span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Máximo a reembolsar</span>
            <span className="font-mono">
              {formatCurrency(creditNote.maxRefund, 'USD')}
            </span>
          </div>
        </div>

        <div>
          <Label htmlFor="refund-amount">Monto (USD) *</Label>
          <Input
            id="refund-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="refund-notes">Notas</Label>
          <Textarea
            id="refund-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1"
            placeholder="Ej: transferencia recibida, referencia 12345"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={submitting}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || invalid}
          className="bg-brand-primary hover:bg-brand-primary-dark"
        >
          {submitting ? 'Registrando...' : 'Registrar reembolso'}
        </Button>
      </DialogFooter>
    </>
  );
}
