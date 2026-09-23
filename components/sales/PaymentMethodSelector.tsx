'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  CreditCard,
  Banknote,
  Smartphone,
  ArrowLeftRight,
  Clock,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

type PaymentMethod = 'cash' | 'card' | 'transfer' | 'pago_movil' | 'por_cobrar';

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  referenceNumber: string;
  onReferenceNumberChange: (ref: string) => void;
  customerDocument?: string;
  showError?: boolean;
}

const PAYMENT_METHODS = [
  {
    value: 'cash' as PaymentMethod,
    label: 'Efectivo',
    icon: Banknote,
    requiresReference: false,
    description: 'Pago en efectivo',
  },
  {
    value: 'card' as PaymentMethod,
    label: 'Tarjeta',
    icon: CreditCard,
    requiresReference: true,
    description: 'Débito o crédito',
  },
  {
    value: 'transfer' as PaymentMethod,
    label: 'Transferencia',
    icon: ArrowLeftRight,
    requiresReference: true,
    description: 'Transferencia bancaria',
  },
  {
    value: 'pago_movil' as PaymentMethod,
    label: 'Pago Móvil',
    icon: Smartphone,
    requiresReference: true,
    description: 'Pago móvil C2P',
  },
  {
    value: 'por_cobrar' as PaymentMethod,
    label: 'Por Cobrar',
    icon: Clock,
    requiresReference: false,
    description: 'Cuenta por cobrar',
  },
];

export function PaymentMethodSelector({
  paymentMethod,
  onPaymentMethodChange,
  referenceNumber,
  onReferenceNumberChange,
  customerDocument = '',
  showError = false,
}: PaymentMethodSelectorProps) {
  const selectedMethod = PAYMENT_METHODS.find((m) => m.value === paymentMethod);
  const requiresReference = selectedMethod?.requiresReference || false;
  const isGenericCustomer = customerDocument === '1';
  const cannotUsePorCobrar =
    paymentMethod === 'por_cobrar' && isGenericCustomer;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="payment-method">Método de Pago</Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
          <SelectTrigger id="payment-method">
            <SelectValue placeholder="Seleccionar método" />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isDisabled =
                method.value === 'por_cobrar' && isGenericCustomer;

              return (
                <SelectItem
                  key={method.value}
                  value={method.value}
                  disabled={isDisabled}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <div>
                      <p className="font-medium">{method.label}</p>
                      {isDisabled && (
                        <p className="text-xs text-red-500">
                          No disponible para cliente genérico
                        </p>
                      )}
                    </div>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {selectedMethod && (
          <p className="mt-1 text-sm text-gray-600 dark:text-slate-400">
            {selectedMethod.description}
          </p>
        )}
      </div>

      {/* Campo de referencia */}
      {requiresReference && (
        <div>
          <Label htmlFor="reference-number">Número de Referencia *</Label>
          <Input
            id="reference-number"
            value={referenceNumber}
            onChange={(e) => onReferenceNumberChange(e.target.value)}
            placeholder="Ej: 1234567890"
            className={
              showError && !referenceNumber.trim() ? 'border-red-500' : ''
            }
          />
          {showError && !referenceNumber.trim() && (
            <p className="mt-1 text-sm text-red-600">
              El número de referencia es obligatorio para este método
            </p>
          )}
        </div>
      )}

      {/* Alerta de validación */}
      {cannotUsePorCobrar && (
        <Alert variant="destructive">
          <AlertDescription>
            No se puede usar "Por Cobrar" con el cliente genérico (documento
            "1"). Selecciona un cliente específico o usa otro método de pago.
          </AlertDescription>
        </Alert>
      )}

      {paymentMethod === 'por_cobrar' && !isGenericCustomer && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Se creará una cuenta por cobrar para este cliente. El monto quedará
            pendiente de pago.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
