import { useState, useEffect } from 'react';
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

export function useExchangeRates(storeId: string): UseExchangeRatesReturn {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [activeRate, setActiveRate] = useState<ActiveRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.get(
        `/exchange-rates?storeId=${storeId}`
      );
      setRates(response.data.rates || []);
      setActiveRate(response.data.activeRate || null);
      setError(null);
    } catch (err) {
      console.error('Error fetching exchange rates:', err);
      setError('Error al cargar tasas de cambio');
    } finally {
      setLoading(false);
    }
  };

  const updateRate = async (data: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    source?: string;
  }) => {
    try {
      await apiClient.post('/exchange-rates', {
        storeId,
        ...data,
      });
      await fetchRates();
    } catch (err) {
      console.error('Error updating exchange rate:', err);
      throw new Error('Error al actualizar tasa de cambio');
    }
  };

  useEffect(() => {
    if (storeId) {
      fetchRates();
    }
  }, [storeId]);

  return {
    rates,
    activeRate,
    loading,
    error,
    refetch: fetchRates,
    updateRate,
  };
}
