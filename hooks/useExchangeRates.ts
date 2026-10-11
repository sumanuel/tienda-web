import { useCallback, useEffect } from 'react';
import { create } from 'zustand';
import { apiClient } from '@/lib/api';

interface ExchangeRate {
  id: string;
  storeId: string;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  isActive: boolean;
  createdAt: string;
}

interface ActiveRate {
  usdToVes: number;
  eurToVes: number;
  updatedAt: string | null;
}

interface StoreRates {
  rates: ExchangeRate[];
  activeRate: ActiveRate | null;
  loading: boolean;
  error: string | null;
  fetchedAt: number;
}

interface UseExchangeRatesReturn {
  rates: ExchangeRate[];
  activeRate: ActiveRate | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateRate: (data: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source?: string;
  }) => Promise<void>;
}

// Las tasas cambian pocas veces al día: se comparten entre pantallas y se
// consideran vigentes durante este tiempo antes de volver a pedirlas.
const FRESH_MS = 60_000;

const EMPTY: StoreRates = {
  rates: [],
  activeRate: null,
  loading: true,
  error: null,
  fetchedAt: 0,
};

interface RatesStore {
  byStore: Record<string, StoreRates>;
}

const useRatesStore = create<RatesStore>(() => ({ byStore: {} }));
const inflight = new Map<string, Promise<void>>();

function patch(storeId: string, next: Partial<StoreRates>) {
  useRatesStore.setState((state) => ({
    byStore: {
      ...state.byStore,
      [storeId]: { ...(state.byStore[storeId] ?? EMPTY), ...next },
    },
  }));
}

function fetchRates(storeId: string, force = false): Promise<void> {
  const current = useRatesStore.getState().byStore[storeId];
  if (!force && current && Date.now() - current.fetchedAt < FRESH_MS) {
    return Promise.resolve();
  }

  const pending = inflight.get(storeId);
  if (pending) return pending;

  patch(storeId, { loading: true });

  const request = (async () => {
    try {
      const response = await apiClient.get<{
        rates: ExchangeRate[];
        activeRate: ActiveRate;
      }>(`/api/exchange-rates?storeId=${storeId}`);

      patch(storeId, {
        rates: response.rates || [],
        activeRate: response.activeRate || null,
        error: null,
        loading: false,
        fetchedAt: Date.now(),
      });
    } catch (err: any) {
      console.error('Error fetching exchange rates:', err);
      patch(storeId, {
        rates: [],
        activeRate: null,
        error: err?.message || 'Error al cargar tasas de cambio',
        loading: false,
        fetchedAt: 0,
      });
    } finally {
      inflight.delete(storeId);
    }
  })();

  inflight.set(storeId, request);
  return request;
}

export function useExchangeRates(storeId: string): UseExchangeRatesReturn {
  const state = useRatesStore((s) => s.byStore[storeId]) ?? EMPTY;

  useEffect(() => {
    if (storeId) {
      fetchRates(storeId);
    }
  }, [storeId]);

  const refetch = useCallback(async () => {
    if (storeId) await fetchRates(storeId, true);
  }, [storeId]);

  const updateRate = useCallback(
    async (data: {
      fromCurrency: string;
      toCurrency: string;
      rate: number;
      source?: string;
    }) => {
      try {
        await apiClient.post('/api/exchange-rates', { storeId, ...data });
        await fetchRates(storeId, true);
      } catch (err) {
        console.error('Error updating exchange rate:', err);
        throw new Error('Error al actualizar tasa de cambio');
      }
    },
    [storeId]
  );

  return {
    rates: state.rates,
    activeRate: state.activeRate,
    loading: storeId ? state.loading : false,
    error: state.error,
    refetch,
    updateRate,
  };
}
