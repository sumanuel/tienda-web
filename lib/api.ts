// Cliente API para comunicarse con el backend PostgreSQL

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface ApiError {
  error: string;
  details?: unknown;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refreshToken');
  }

  private setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
          this.baseUrl = fallbackBaseUrl;
          return response;
        } catch {
          // Intentar siguiente fallback
        }
      }

      throw error;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await this.fetchWithFallback('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      const newAccessToken = data.accessToken;

      // Actualizar solo el access token
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', newAccessToken);
      }

      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.clearTokens();
      return null;
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await this.fetchWithFallback(endpoint, {
        ...options,
        headers,
      });

      // Si recibimos 401, intentar refrescar el token
      if (response.status === 401 && token) {
        const newToken = await this.refreshAccessToken();

        if (newToken) {
          // Reintentar con el nuevo token
          headers['Authorization'] = `Bearer ${newToken}`;
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
          // No se pudo refrescar, redirigir a login
          this.clearTokens();
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

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
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
      accessToken: string;
      refreshToken: string;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    this.setTokens(response.accessToken, response.refreshToken);
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
      accessToken: string;
      refreshToken: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async logout() {
    this.clearTokens();
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

  async getSale(id: string) {
    return this.request<{
      sale: {
        id: string;
        storeId: string;
        saleNumber: string;
        customerId: string | null;
        customerName: string | null;
        total: number;
        subtotal: number;
        discount: number;
        tax: number;
        currency: string;
        paymentMethod: string;
        paymentStatus: string;
        amountReceived: number | null;
        change: number | null;
        cashierId: string;
        cashierName: string;
        notes: string | null;
        createdAt: string;
        cancelledAt: string | null;
        items: Array<{
          id: string;
          productId: string;
          productName: string;
          productCode: string;
          quantity: number;
          unitPrice: number;
          discount: number;
          subtotal: number;
        }>;
      };
    }>(`/api/sales/${id}`);
  }

  async createSale(data: {
    storeId: string;
    customerId?: string;
    customerName?: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      discount?: number;
    }>;
    currency: string;
    paymentMethod: string;
    amountReceived?: number;
    notes?: string;
  }) {
    return this.request<{
      message: string;
      sale: {
        id: string;
        storeId: string;
        saleNumber: string;
        customerId: string | null;
        customerName: string | null;
        total: number;
        subtotal: number;
        discount: number;
        tax: number;
        currency: string;
        paymentMethod: string;
        paymentStatus: string;
        amountReceived: number | null;
        change: number | null;
        cashierId: string;
        cashierName: string;
        notes: string | null;
        createdAt: string;
        items: Array<{
          id: string;
          productId: string;
          productName: string;
          productCode: string;
          quantity: number;
          unitPrice: number;
          discount: number;
          subtotal: number;
        }>;
      };
    }>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async cancelSale(id: string) {
    return this.request<{
      message: string;
      sale: {
        id: string;
        saleNumber: string;
        cancelledAt: string;
      };
    }>(`/api/sales/${id}`, {
      method: 'DELETE',
    });
  }

  async getSalesStats(params: {
    storeId: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams({
      storeId: params.storeId,
      ...(params.startDate && { startDate: params.startDate }),
      ...(params.endDate && { endDate: params.endDate }),
    });

    return this.request<{
      stats: {
        totalSales: number;
        totalRevenue: number;
        averageTicket: number;
        totalItems: number;
      };
    }>(`/api/sales/stats/summary?${queryParams}`);
  }

  // Métodos de Inventory (Inventario)
  async getInventoryMovements(params: {
    storeId: string;
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams({
      storeId: params.storeId,
      ...(params.productId && { productId: params.productId }),
      ...(params.type && { type: params.type }),
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
      report: Array<{
        id: string;
        code: string;
        name: string;
        category: string;
        stock: number;
        minStock: number;
        cost: number;
        totalValue: number;
        status: string;
      }>;
      summary: {
        totalProducts: number;
        totalValue: number;
        lowStockProducts: number;
        outOfStockProducts: number;
      };
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
