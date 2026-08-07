'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { createCustomerPayment } from '@/lib/customerTransactions';
import { useCustomersStore } from '@/store/customersStore';
import { useCustomerTransactionsStore } from '@/store/customerTransactionsStore';
import type { Customer } from '@/types/customer';
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

interface CustomerPaymentFormProps {
  customer: Customer;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomerPaymentForm({
  customer,
  onSuccess,
  onCancel,
}: CustomerPaymentFormProps) {
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { updateCustomer } = useCustomersStore();
  const { addTransaction } = useCustomerTransactionsStore();

  const formSchema = z.object({
    amount: z
      .number()
      .positive('El monto debe ser positivo')
      .max(
        customer.balance,
        `No puede exceder el saldo actual ($${customer.balance.toFixed(2)})`
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

      const transaction = await createCustomerPayment(
        profile.storeId,
        customer.id,
        {
          type: 'payment',
          amount: data.amount,
          paymentMethod: data.paymentMethod as PaymentMethod,
          notes: data.notes,
        },
        user.uid
      );

      // Actualizar balance del cliente en el store
      const newBalance = customer.balance - data.amount;
      updateCustomer(customer.id, { balance: newBalance });

      // Agregar transacción al store
      addTransaction(transaction);

      toast.success('Abono registrado correctamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error registrando abono:', error);
      toast.error(error.message || 'Error al registrar abono');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Info del cliente */}
        <div className="bg-muted/50 rounded-lg border p-4">
          <h4 className="mb-2 font-medium">Cliente</h4>
          <p className="text-muted-foreground text-sm">
            {customer.name} ({customer.document})
          </p>
          <p className="mt-1 text-sm font-medium">
            Saldo actual:{' '}
            <span className="text-red-600">${customer.balance.toFixed(2)}</span>
          </p>
        </div>

        {/* Monto */}
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Monto del Abono *</FormLabel>
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
            {isSubmitting ? 'Registrando...' : 'Registrar Abono'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
