'use client';

import { Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  message = 'Cargando...',
  fullScreen = false,
}: LoadingStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
      <Loader2 className="mb-4 h-8 w-8 animate-spin text-[#2D7A5B]" />
      <p className="text-sm">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {content}
      </div>
    );
  }

  return <Card className="p-12">{content}</Card>;
}
