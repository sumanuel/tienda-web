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

  private async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return null;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
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
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Si recibimos 401, intentar refrescar el token
      if (response.status === 401 && token) {
        const newToken = await this.refreshAccessToken();

        if (newToken) {
          // Reintentar con el nuevo token
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, {
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
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
