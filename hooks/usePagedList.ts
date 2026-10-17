import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

export interface PageInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PageResult<T> {
  items: T[];
  pagination: PageInfo;
}

interface PageQuery {
  page: number;
  limit: number;
  search: string;
}

interface Options {
  pageSize?: number;
  // Evita pedir datos hasta tener lo necesario (p. ej. el id de la tienda)
  enabled?: boolean;
}

/**
 * Lista paginada y con búsqueda en el servidor. `fetchPage` debe ser estable
 * (useCallback). La búsqueda espera 300 ms tras dejar de escribir y devuelve
 * a la página 1; las respuestas atrasadas se descartan.
 */
export function usePagedList<T>(
  fetchPage: (query: PageQuery) => Promise<PageResult<T>>,
  { pageSize = 10, enabled = true }: Options = {}
) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  // La página recuerda para qué búsqueda se eligió: si la búsqueda cambia, la
  // página vuelve a 1 sin necesidad de un efecto
  const [pageState, setPageState] = useState({ page: 1, forSearch: '' });
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    items: T[];
    pagination: PageInfo;
    error: string | null;
  } | null>(null);

  const page = pageState.forSearch === debouncedSearch ? pageState.page : 1;
  const key = `${page}|${pageSize}|${debouncedSearch}|${nonce}`;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    fetchPage({ page, limit: pageSize, search: debouncedSearch })
      .then((response) => {
        if (cancelled) return;

        // La página ya no existe (se eliminó el último elemento): ir a la última
        if (
          response.items.length === 0 &&
          page > 1 &&
          response.pagination.pages < page
        ) {
          setPageState({
            page: Math.max(response.pagination.pages, 1),
            forSearch: debouncedSearch,
          });
          return;
        }

        setResult({
          key,
          items: response.items,
          pagination: response.pagination,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setResult({
            key,
            items: [],
            pagination: { page, limit: pageSize, total: 0, pages: 1 },
            error:
              error instanceof Error ? error.message : 'Error al cargar datos',
          });
        }
      });

    return () => {
      cancelled = true;
    };
    // `key` resume page, pageSize, debouncedSearch y nonce
  }, [enabled, fetchPage, key, page, pageSize, debouncedSearch]);

  const setPage = useCallback(
    (next: number) => setPageState({ page: next, forSearch: debouncedSearch }),
    [debouncedSearch]
  );

  // Vuelve a pedir la página actual (tras crear, editar o eliminar)
  const refresh = useCallback(() => setNonce((value) => value + 1), []);

  return {
    rows: result?.items ?? [],
    pagination: result?.pagination ?? {
      page,
      limit: pageSize,
      total: 0,
      pages: 1,
    },
    loading: enabled && result?.key !== key,
    error: result?.error ?? null,
    search,
    setSearch,
    setPage,
    refresh,
  };
}
