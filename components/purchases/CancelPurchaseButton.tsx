'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, AlertTriangle } from 'lucide-react';
import { usePurchases } from '@/hooks/usePurchases';
import { toast } from 'react-hot-toast';

interface CancelPurchaseButtonProps {
  purchaseId: string;
  purchaseNumber: string;
  onSuccess?: () => void;
}

export function CancelPurchaseButton({
  purchaseId,
  purchaseNumber,
  onSuccess,
}: CancelPurchaseButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const { cancelPurchase } = usePurchases();

  const handleCancel = async () => {
    if (!reason.trim() || reason.trim().length < 10) {
      toast.error('La razón debe tener al menos 10 caracteres');
      return;
    }

    setProcessing(true);

    try {
      await cancelPurchase(purchaseId, reason.trim());
      toast.success(`Compra ${purchaseNumber} cancelada exitosamente`);
      setShowDialog(false);
      setReason('');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar la compra');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setShowDialog(true)}
        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
      >
        <X className="h-4 w-4" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              Cancelar Compra {purchaseNumber}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>Advertencia:</strong> Esta acción revertirá el stock de
                los productos recibidos y la deuda con el proveedor generada
                (si la compra fue a crédito).
              </p>
            </div>

            <div>
              <Label htmlFor="cancel-reason">Razón de la cancelación *</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Describe la razón de la cancelación (mínimo 10 caracteres)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                {reason.length} / 10 caracteres mínimos
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDialog(false);
                setReason('');
              }}
              disabled={processing}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={processing || reason.trim().length < 10}
            >
              {processing ? 'Cancelando...' : 'Confirmar Cancelación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
