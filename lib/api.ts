// Cliente API para comunicarse con el backend PostgreSQL

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiError {
  error: string;
  details?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // Los tokens viven en cookies httpOnly que pone el backend: el navegador las
  // envía solo y este código nunca las ve. Solo existe un indicador sin datos
  // (tsuma_session) para saber si hay una sesión iniciada.
  private hasSession(): boolean {
    if (typeof document === 'undefined') return false;
    return document.cookie
      .split('; ')
      .some((cookie) => cookie === 'tsuma_session=1');
  }

  private endSession() {
    if (typeof document === 'undefined') return;
    document.cookie = 'tsuma_session=; Path=/; Max-Age=0; SameSite=Lax';
  }

  private getFallbackBaseUrls(): string[] {
    const fallbacks: string[] = [];

    if (this.baseUrl.includes('localhost')) {
      fallbacks.push(this.baseUrl.replace('localhost', '127.0.0.1'));
    }

    if (this.baseUrl.includes('127.0.0.1')) {
      fallbacks.push(this.baseUrl.replace('127.0.0.1', 'localhost'));
    }

    const envFallbacks = (process.env.NEXT_PUBLIC_API_FALLBACK_URLS || '')
      .split(',')
      .map((url) => url.trim())
      .filter(Boolean);

    return Array.from(new Set([...fallbacks, ...envFallbacks])).filter(
      (url) => url !== this.baseUrl
    );
  }

  private isNetworkError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return msg.includes('failed to fetch') || msg.includes('networkerror');
  }

  private async fetchWithFallback(
    endpoint: string,
    options: RequestInit
  ): Promise<Response> {
    const primaryUrl = `${this.baseUrl}${endpoint}`;

    try {
      return await fetch(primaryUrl, options);
    } catch (error) {
      if (!this.isNetworkError(error)) {
        throw error;
      }

      const fallbackUrls = this.getFallbackBaseUrls();

      for (const fallbackBaseUrl of fallbackUrls) {
        try {
          const response = await fetch(
            `${fallbackBaseUrl}${endpoint}`,
            options
          );
          // Si responde, persistimos la URL funcional para siguientes requests
          if (fallbackBaseUrl.startsWith('http')) {
            this.baseUrl = fallbackBaseUrl;
          }
          return response;
        } catch {
          // Intentar siguiente fallback
        }
      }

      throw error;
    }
  }

  // Número de renovaciones hechas: si cambió mientras una petición esperaba,
  // otra ya renovó la sesión y basta con reintentar.
  private refreshCount = 0;

  // Una sola renovación a la vez: si varias peticiones reciben 401 juntas
  // comparten el mismo intento en vez de gastar el refresh token varias veces.
  private refreshInFlight: Promise<boolean> | null = null;

  private refreshSession(): Promise<boolean> {
    if (!this.refreshInFlight) {
      this.refreshInFlight = this.performRefresh().finally(() => {
        this.refreshInFlight = null;
      });
    }
    return this.refreshInFlight;
  }

  // true si la sesión se renovó, false si ya no es válida (hay que volver a
  // iniciar sesión) o lanza un error si el fallo es transitorio.
  private async performRefresh(): Promise<boolean> {
    try {
      const response = await this.fetchWithFallback('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 400 || response.status === 401) {
        // El refresh token no sirve (caducado o revocado): sesión terminada
        this.endSession();
        return false;
      }

      if (!response.ok) {
        throw new Error('No se pudo renovar la sesión. Intenta de nuevo.');
      }

      this.refreshCount++;
      return true;
    } catch (error) {
      // Un fallo de red o del servidor no debe cerrar la sesión
      console.error('Error refreshing session:', error);
      throw error instanceof Error
        ? error
        : new Error('No se pudo renovar la sesión. Intenta de nuevo.');
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    const refreshCountBefore = this.refreshCount;

    try {
      const response = await this.fetchWithFallback(endpoint, {
        ...options,
        headers,
      });

      // Si recibimos 401 con una sesión iniciada, intentar renovarla
      if (response.status === 401 && this.hasSession()) {
        // Si otra petición ya renovó la sesión, basta con reintentar
        const renewed =
          this.refreshCount !== refreshCountBefore ||
          (await this.refreshSession());

        if (renewed) {
          const retryResponse = await this.fetchWithFallback(endpoint, {
            ...options,
            headers,
          });

          if (!retryResponse.ok) {
            const errorData: ApiError = await retryResponse.json();
            throw new Error(errorData.error || 'Error en la petición');
          }

          return retryResponse.json();
        } else {
          // No se pudo renovar, redirigir a login
          this.endSession();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          throw new Error('Sesión expirada');
        }
      }

      if (!response.ok) {
        const errorData: ApiError = await response.json();
        throw new Error(errorData.error || 'Error en la petición');
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error de red');
    }
  }

  // Métodos HTTP helper
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Métodos de autenticación
  async register(data: {
    email: string;
    password: string;
    name: string;
    storeName: string;
    storeAddress?: string;
  }) {
    const response = await this.request<{
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        stores: Array<{ id: string; name: string; address: string | null }>;
      };
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        stores: Array<{ id: string; name: string; address: string | null }>;
      };
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    return response;
  }

  async logout() {
    // El servidor revoca las sesiones y borra las cookies; si no hay conexión
    // igual se limpia el indicador local
    try {
      await this.fetchWithFallback('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      // sin conexión
    }
    this.endSession();
  }

  async getMe() {
    return this.request<{
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
        createdAt: string;
        stores: Array<{ id: string; name: string; address: string | null }>;
      };
    }>('/api/auth/me');
  }

  // Métodos de Store
  async getStores() {
    return this.request<{
      stores: Array<{
        id: string;
        name: string;
        address: string | null;
        createdAt: string;
        updatedAt: string;
      }>;
    }>('/api/stores');
  }

  async getStore(id: string) {
    return this.request<{
      store: {
        id: string;
        name: string;
        address: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/stores/${id}`);
  }

  async createStore(data: { name: string; address?: string }) {
    return this.request<{
      store: {
        id: string;
        name: string;
        address: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>('/api/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateStore(id: string, data: { name?: string; address?: string }) {
    return this.request<{
      store: {
        id: string;
        name: string;
        address: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/stores/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStore(id: string) {
    return this.request<{ message: string }>(`/api/stores/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos de Customers (Clientes)
  async getCustomers(params: {
    storeId: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams({
      storeId: params.storeId,
      ...(params.search && { search: params.search }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.limit && { limit: params.limit.toString() }),
    });

    return this.request<{
      customers: Array<{
        id: string;
        storeId: string;
        name: string;
        email: string | null;
        phone: string | null;
        document: string | null;
        address: string | null;
        notes: string | null;
        balance: number;
        createdAt: string;
        updatedAt: string;
        _count: {
          sales: number;
          transactions: number;
        };
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>(`/api/customers?${queryParams}`);
  }

  async getCustomer(id: string) {
    return this.request<{
      customer: {
        id: string;
        storeId: string;
        name: string;
        email: string | null;
        phone: string | null;
        document: string | null;
        address: string | null;
        notes: string | null;
        balance: number;
        createdAt: string;
        updatedAt: string;
        store: {
          id: string;
          name: string;
        };
        sales: Array<{
          id: string;
          total: number;
          createdAt: string;
        }>;
        transactions: Array<{
          id: string;
          type: string;
          amount: number;
          description: string | null;
          createdAt: string;
        }>;
        _count: {
          sales: number;
          transactions: number;
        };
      };
    }>(`/api/customers/${id}`);
  }

  async createCustomer(data: {
    storeId: string;
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    address?: string;
  }) {
    return this.request<{
      message: string;
      customer: {
        id: string;
        storeId: string;
        name: string;
        email: string | null;
        phone: string | null;
        taxId: string | null;
        address: string | null;
        balance: number;
        createdAt: string;
        updatedAt: string;
      };
    }>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCustomer(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      taxId?: string;
      address?: string;
    }
  ) {
    return this.request<{
      message: string;
      customer: {
        id: string;
        storeId: string;
        name: string;
        email: string | null;
        phone: string | null;
        taxId: string | null;
        address: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCustomer(id: string) {
    return this.request<{ message: string }>(`/api/customers/${id}`, {
      method: 'DELETE',
    });
  }

  async getCustomerTransactions(id: string, limit?: number) {
    const queryParams = limit ? `?limit=${limit}` : '';
    return this.request<{
      transactions: Array<{
        id: string;
        customerId: string;
        type: string;
        amount: number;
        description: string | null;
        createdAt: string;
      }>;
      balance: number;
    }>(`/api/customers/${id}/transactions${queryParams}`);
  }

  async createCustomerTransaction(
    id: string,
    data: {
      type: 'credit' | 'payment';
      amount: number;
      description?: string;
    }
  ) {
    return this.request<{
      message: string;
      transaction: {
        id: string;
        customerId: string;
        type: string;
        amount: number;
        description: string | null;
        createdAt: string;
      };
      balance: number;
    }>(`/api/customers/${id}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Métodos de Suppliers (Proveedores)
  async getSuppliers(params: {
    storeId: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams({
      storeId: params.storeId,
      ...(params.search && { search: params.search }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.limit && { limit: params.limit.toString() }),
    });

    return this.request<{
      suppliers: Array<{
        id: string;
        storeId: string;
        name: string;
        email: string | null;
        phone: string | null;
        document: string | null;
        address: string | null;
        notes: string | null;
        balance: number;
        createdAt: string;
        updatedAt: string;
        _count: {
          transactions: number;
        };
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>(`/api/suppliers?${queryParams}`);
  }

  async getSupplier(id: string) {
    return this.request<{
      supplier: {
        id: string;
        storeId: string;
        name: string;
        email: string | null;
        phone: string | null;
        document: string | null;
        address: string | null;
        notes: string | null;
        balance: number;
        createdAt: string;
        updatedAt: string;
        store: {
          id: string;
          name: string;
        };
        transactions: Array<{
          id: string;
          type: string;
          amount: number;
          description: string | null;
          createdAt: string;
        }>;
        _count: {
          transactions: number;
        };
      };
    }>(`/api/suppliers/${id}`);
  }

  async createSupplier(data: {
    storeId: string;
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    address?: string;
  }) {
    return this.request<{
      message: string;
      supplier: {
        id: string;
        storeId: string;
        name: string;
        email: string | null;
        phone: string | null;
        taxId: string | null;
        address: string | null;
        balance: number;
        createdAt: string;
        updatedAt: string;
      };
    }>('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupplier(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      taxId?: string;
      address?: string;
    }
  ) {
    return this.request<{
      message: string;
      supplier: {
        id: string;
        storeId: string;
        name: string;
        email: string | null;
        phone: string | null;
        taxId: string | null;
        address: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSupplier(id: string) {
    return this.request<{ message: string }>(`/api/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  async getSupplierTransactions(id: string, limit?: number) {
    const queryParams = limit ? `?limit=${limit}` : '';
    return this.request<{
      transactions: Array<{
        id: string;
        supplierId: string;
        type: string;
        amount: number;
        description: string | null;
        createdAt: string;
      }>;
      balance: number;
    }>(`/api/suppliers/${id}/transactions${queryParams}`);
  }

  async createSupplierTransaction(
    id: string,
    data: {
      type: 'purchase' | 'payment';
      amount: number;
      description?: string;
    }
  ) {
    return this.request<{
      message: string;
      transaction: {
        id: string;
        supplierId: string;
        type: string;
        amount: number;
        description: string | null;
        createdAt: string;
      };
      balance: number;
    }>(`/api/suppliers/${id}/transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Métodos de Products (Productos)
  async getProducts(params: {
    storeId: string;
    search?: string;
    category?: string;
    minStock?: number;
    trackInventory?: boolean;
    costCurrency?: string;
    maxStock?: number;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams({
      storeId: params.storeId,
      ...(params.search && { search: params.search }),
      ...(params.category && { category: params.category }),
      ...(params.minStock && { minStock: params.minStock.toString() }),
      ...(params.maxStock && { maxStock: params.maxStock.toString() }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.limit && { limit: params.limit.toString() }),
    });

    return this.request<{
      products: Array<{
        id: string;
        storeId: string;
        code: string;
        barcode: string | null;
        name: string;
        description: string | null;
        category: string;
        cost: number;
        priceVES: number;
        priceUSD: number;
        stock: number;
        minStock: number;
        trackInventory: boolean;
        costCurrency: string | null;
        imageUrl: string | null;
        createdAt: string;
        updatedAt: string;
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>(`/api/products?${queryParams}`);
  }

  async getProduct(id: string) {
    return this.request<{
      product: {
        id: string;
        storeId: string;
        code: string;
        barcode: string | null;
        name: string;
        description: string | null;
        category: string;
        cost: number;
        priceVES: number;
        priceUSD: number;
        stock: number;
        minStock: number;
        trackInventory: boolean;
        costCurrency: string | null;
        imageUrl: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/products/${id}`);
  }

  async createProduct(data: {
    storeId: string;
    code?: string;
    barcode?: string;
    name: string;
    description?: string;
    category: string;
    cost: number;
    priceVES: number;
    priceUSD: number;
    stock?: number;
    minStock?: number;
    trackInventory?: boolean;
    costCurrency?: string;
    imageUrl?: string;
  }) {
    return this.request<{
      message: string;
      product: {
        id: string;
        storeId: string;
        code: string;
        barcode: string | null;
        name: string;
        description: string | null;
        category: string;
        cost: number;
        priceVES: number;
        priceUSD: number;
        stock: number;
        minStock: number;
        trackInventory: boolean;
        costCurrency: string | null;
        imageUrl: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(
    id: string,
    data: {
      code?: string;
      barcode?: string;
      name?: string;
      description?: string;
      category?: string;
      cost?: number;
      priceVES?: number;
      priceUSD?: number;
      minStock?: number;
      trackInventory?: boolean;
      costCurrency?: string;
      imageUrl?: string;
    }
  ) {
    return this.request<{
      message: string;
      product: {
        id: string;
        storeId: string;
        code: string;
        barcode: string | null;
        name: string;
        description: string | null;
        category: string;
        cost: number;
        priceVES: number;
        priceUSD: number;
        stock: number;
        minStock: number;
        trackInventory: boolean;
        costCurrency: string | null;
        imageUrl: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: string) {
    return this.request<{ message: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  async getCategories(storeId: string) {
    return this.request<{
      categories: string[];
    }>(`/api/products/categories?storeId=${storeId}`);
  }

  // Métodos de Sales (Ventas)
  async getSales(params: {
    storeId: string;
    customerId?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams({
      storeId: params.storeId,
      ...(params.customerId && { customerId: params.customerId }),
      ...(params.paymentStatus && { paymentStatus: params.paymentStatus }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.limit && { limit: params.limit.toString() }),
    });

    return this.request<{
      sales: Array<{
        id: string;
        storeId: string;
        saleNumber: string;
        customerId: string | null;
        customerName: string | null;
        total: number;
        currency: string;
        paymentMethod: string;
        paymentStatus: string;
        cashierId: string;
        cashierName: string;
        createdAt: string;
        cancelledAt: string | null;
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>(`/api/sales?${queryParams}`);
  }

  // Métodos de Inventory (Inventario)
  async getInventoryMovements(params: {
    storeId: string;
    productId?: string;
    type?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams({
      storeId: params.storeId,
      ...(params.productId && { productId: params.productId }),
      ...(params.type && { type: params.type }),
      ...(params.search && { search: params.search }),
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
      ...(params.page && { page: params.page.toString() }),
      ...(params.limit && { limit: params.limit.toString() }),
    });

    return this.request<{
      movements: Array<{
        id: string;
        storeId: string;
        productId: string;
        productName: string;
        productCode: string;
        type: string;
        quantity: number;
        stockBefore: number;
        stockAfter: number;
        unitCost: number;
        totalCost: number;
        reason: string | null;
        notes: string | null;
        userId: string;
        userName: string;
        createdAt: string;
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        pages: number;
      };
    }>(`/api/inventory/movements?${queryParams}`);
  }

  async getProductMovements(productId: string) {
    return this.request<{
      movements: Array<{
        id: string;
        type: string;
        quantity: number;
        stockBefore: number;
        stockAfter: number;
        unitCost: number;
        totalCost: number;
        reason: string | null;
        notes: string | null;
        userName: string;
        createdAt: string;
      }>;
    }>(`/api/inventory/product/${productId}/movements`);
  }

  async createInventoryAdjustment(data: {
    storeId: string;
    productId: string;
    type: 'damage' | 'adjustment';
    quantity: number;
    reason?: string;
    notes?: string;
  }) {
    return this.request<{
      message: string;
      movement: {
        id: string;
        storeId: string;
        productId: string;
        productName: string;
        productCode: string;
        type: string;
        quantity: number;
        stockBefore: number;
        stockAfter: number;
        unitCost: number;
        totalCost: number;
        reason: string | null;
        notes: string | null;
        userId: string;
        userName: string;
        createdAt: string;
      };
    }>('/api/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStockReport(storeId: string) {
    return this.request<{
      summary: {
        totalProducts: number;
        totalStock: number;
        totalValue: number;
        totalRetailValue: number;
        lowStockCount: number;
        outOfStockCount: number;
      };
      byCategory: Array<{
        category: string;
        productCount: number;
        totalStock: number;
        totalValue: number;
        lowStockCount: number;
      }> | null;
    }>(`/api/inventory/stock-report?storeId=${storeId}`);
  }

  async getLowStock(storeId: string) {
    return this.request<{
      products: Array<{
        id: string;
        code: string;
        name: string;
        category: string;
        stock: number;
        minStock: number;
        status: string;
      }>;
    }>(`/api/inventory/low-stock?storeId=${storeId}`);
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
