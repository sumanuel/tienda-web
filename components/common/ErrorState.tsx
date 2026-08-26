'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  showRetry?: boolean;
  showGoBack?: boolean;
}

export function ErrorState({
  title = 'Error',
  message,
  onRetry,
  onGoBack,
  showRetry = true,
  showGoBack = false,
}: ErrorStateProps) {
  const isAuthError =
    message.includes('401') ||
    message.includes('Token') ||
    message.includes('autorizado');

  return (
    <div className="flex min-h-[400px] items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center">
          <div
            className={`mb-4 rounded-full p-3 ${isAuthError ? 'bg-orange-100' : 'bg-red-100'}`}
          >
            <AlertCircle
              className={`h-8 w-8 ${isAuthError ? 'text-orange-600' : 'text-red-600'}`}
            />
          </div>

          <h2 className="mb-2 text-xl font-semibold text-gray-900">
            {isAuthError ? 'Sesión Expirada' : title}
          </h2>

          <p className="mb-6 text-gray-600">
            {isAuthError
              ? 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.'
              : message}
          </p>

          <div className="flex w-full gap-3">
            {showGoBack && onGoBack && (
              <Button variant="outline" onClick={onGoBack} className="flex-1">
                Volver
              </Button>
            )}

            {showRetry && onRetry && !isAuthError && (
              <Button
                onClick={onRetry}
                className="flex-1 bg-[#2D7A5B] hover:bg-[#236449]"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            )}

            {isAuthError && (
              <Button
                onClick={() => (window.location.href = '/login')}
                className="flex-1 bg-[#2D7A5B] hover:bg-[#236449]"
              >
                Iniciar Sesión
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
