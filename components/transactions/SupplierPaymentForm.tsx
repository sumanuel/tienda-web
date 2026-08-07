'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { createSupplierPayment } from '@/lib/supplierTransactions';
import { useSuppliersStore } from '@/store/suppliersStore';
import { useSupplierTransactionsStore } from '@/store/supplierTransactionsStore';
import type { Supplier } from '@/types/supplier';
import type { PaymentMethod } from '@/types/transaction';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

interface SupplierPaymentFormProps {
  supplier: Supplier;
  onSuccess: () => void;
  onCancel: () => void;
}

export function SupplierPaymentForm({
  supplier,
  onSuccess,
  onCancel,
}: SupplierPaymentFormProps) {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateSupplier } = useSuppliersStore();
  const { addTransaction } = useSupplierTransactionsStore();

  const formSchema = z.object({
    amount: z
      .number()
      .positive('El monto debe ser positivo')
      .max(
        supplier.balance,
        `No puede exceder el saldo actual ($${supplier.balance.toFixed(2)})`
      ),
    paymentMethod: z.enum(['cash', 'card', 'transfer'] as const),
    notes: z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      paymentMethod: 'cash',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!user || !profile?.storeId) {
      toast.error('No hay sesión activa');
      return;
    }

    try {
      setIsSubmitting(true);

      const transaction = await createSupplierPayment(
        profile.storeId,
        supplier.id,
        {
          type: 'payment',
          amount: data.amount,
          paymentMethod: data.paymentMethod as PaymentMethod,
          notes: data.notes,
        },
        user.uid
      );

      // Actualizar balance del proveedor en el store
      const newBalance = supplier.balance - data.amount;
      updateSupplier(supplier.id, { balance: newBalance });

      // Agregar transacción al store
      addTransaction(transaction);

      toast.success('Pago registrado correctamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error registrando pago:', error);
      toast.error(error.message || 'Error al registrar pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Info del proveedor */}
        <div className="bg-muted/50 rounded-lg border p-4">
          <h4 className="mb-2 font-medium">Proveedor</h4>
          <p className="text-muted-foreground text-sm">
            {supplier.name} ({supplier.rif})
          </p>
          <p className="mt-1 text-sm font-medium">
            Saldo actual:{' '}
            <span className="text-red-600">${supplier.balance.toFixed(2)}</span>
          </p>
        </div>

        {/* Monto */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto del Pago *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) =>
                    field.onChange(parseFloat(e.target.value) || 0)
                  }
                  autoFocus
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Método de pago */}
        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Pago *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar método" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notas */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas (Opcional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Observaciones adicionales..."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Acciones */}
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Registrando...' : 'Registrar Pago'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
