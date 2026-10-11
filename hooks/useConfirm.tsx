'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/**
 * Reemplazo de window.confirm: `confirm(opciones)` devuelve una promesa con la
 * decisión del usuario y `dialog` debe renderizarse una vez en el componente.
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const dialog = (
    <Dialog
      open={options !== null}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{options?.title}</DialogTitle>
          {options?.description && (
            <DialogDescription className="whitespace-pre-line">
              {options.description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => settle(false)}>
            {options?.cancelLabel ?? 'Cancelar'}
          </Button>
          <Button
            variant={options?.destructive ? 'destructive' : 'default'}
            className={
              options?.destructive
                ? undefined
                : 'bg-brand-primary hover:bg-brand-primary-dark'
            }
            onClick={() => settle(true)}
          >
            {options?.confirmLabel ?? 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return { confirm, dialog };
}
