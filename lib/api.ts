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
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
