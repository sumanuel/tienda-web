/**
 * Higher-Order Component para manejar estados de carga y error en páginas
 * Uso:
 *
 * function MyPage() {
 *   const { data, loading, error, retry } = useData();
 *   return <PageContainer loading={loading} error={error} onRetry={retry}>
 *     <ActualContent data={data} />
 *   </PageContainer>
 * }
 */

'use client';

import { ReactNode } from 'react';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

interface PageContainerProps {
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  onRetry?: () => void;
  loadingMessage?: string;
  fullScreenLoading?: boolean;
}

export function PageContainer({
  children,
  loading = false,
  error = null,
  isEmpty = false,
  emptyTitle = 'No hay datos',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  onRetry,
  loadingMessage = 'Cargando...',
  fullScreenLoading = false,
}: PageContainerProps) {
  // Estado de carga
  if (loading) {
    return (
      <LoadingState message={loadingMessage} fullScreen={fullScreenLoading} />
    );
  }

  // Estado de error
  if (error) {
    return (
      <ErrorState message={error} onRetry={onRetry} showRetry={!!onRetry} />
    );
  }

  // Estado vacío
  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
      />
    );
  }

  // Estado normal - renderizar children
  return <>{children}</>;
}
