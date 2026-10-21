import {
  User,
  CargoItem,
  ShipmentItem,
  WarehouseItem,
  DashboardStats,
  TrackingData,
} from '../types/index.ts';

const API_BASE = '/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('airport_cargo_jwt');
  }

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('airport_cargo_jwt', token);
    } else {
      localStorage.removeItem('airport_cargo_jwt');
    }
  }

  public getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  }

  // Auth
  public async login(email: string, password: string) {
    const res = await this.request<{
      success: boolean;
      token: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    return res;
  }

  public async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  public async getMe(): Promise<{ success: boolean; user: User }> {
    return this.request('/auth/me');
  }

  // Dashboard
  public async getDashboardStats(): Promise<{
    success: boolean;
    data: DashboardStats;
    source: string;
  }> {
    return this.request('/dashboard/stats');
  }

  public async getRecentActivity(limit = 8) {
    return this.request<{ success: boolean; data: any[] }>(`/dashboard/recent-activity?limit=${limit}`);
  }

  // Cargo
  public async getCargos(params: {
    search?: string;
    status?: string;
    cargoType?: string;
    destination?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.cargoType) query.append('cargoType', params.cargoType);
    if (params.destination) query.append('destination', params.destination);
    if (params.warehouseId) query.append('warehouseId', params.warehouseId);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    return this.request<{
      success: boolean;
      items: CargoItem[];
      totalCount: number;
      totalPages: number;
      page: number;
    }>(`/cargo?${query.toString()}`);
  }

  public async getCargoById(id: string) {
    return this.request<{ success: boolean; data: CargoItem }>(`/cargo/${id}`);
  }

  public async createCargo(payload: Partial<CargoItem>) {
    return this.request<{ success: boolean; data: CargoItem; message: string }>('/cargo', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateCargo(id: string, payload: Partial<CargoItem>) {
    return this.request<{ success: boolean; data: CargoItem; message: string }>(`/cargo/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteCargo(id: string) {
    return this.request<{ success: boolean; message: string }>(`/cargo/${id}`, {
      method: 'DELETE',
    });
  }

  // Shipments
  public async getShipments(params: { search?: string; status?: string; destination?: string } = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.destination) query.append('destination', params.destination);

    return this.request<{
      success: boolean;
      data: ShipmentItem[];
      totalCount: number;
    }>(`/shipments?${query.toString()}`);
  }

  public async getShipmentById(id: string) {
    return this.request<{ success: boolean; data: any }>(`/shipments/${id}`);
  }

  public async updateShipmentStatus(id: string, payload: {
    status: string;
    location: string;
    expectedArrival?: string | null;
  }) {
    return this.request<{ success: boolean; data: any; message: string }>(`/shipments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Warehouses
  public async getWarehouses() {
    return this.request<{ success: boolean; data: WarehouseItem[] }>('/warehouses');
  }

  public async getWarehouseById(id: string) {
    return this.request<{ success: boolean; data: WarehouseItem & { storedCargos: CargoItem[] } }>(`/warehouses/${id}`);
  }

  public async createWarehouse(payload: {
    warehouseCode: string;
    name: string;
    location: string;
    totalCapacity: number;
  }) {
    return this.request<{ success: boolean; data: WarehouseItem; message: string }>('/warehouses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateWarehouse(id: string, payload: Partial<WarehouseItem>) {
    return this.request<{ success: boolean; data: WarehouseItem; message: string }>(`/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public async deleteWarehouse(id: string) {
    return this.request<{ success: boolean; message: string }>(`/warehouses/${id}`, {
      method: 'DELETE',
    });
  }

  public async assignCargo(warehouseId: string, cargoId: string, storageLocation?: string) {
    return this.request<{ success: boolean; message: string }>(`/warehouses/${warehouseId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ cargoId, storageLocation }),
    });
  }

  public async removeCargo(warehouseId: string, cargoId: string) {
    return this.request<{ success: boolean; message: string }>(`/warehouses/${warehouseId}/remove`, {
      method: 'POST',
      body: JSON.stringify({ cargoId }),
    });
  }

  // Tracking
  public async getTracking(cargoCode: string) {
    return this.request<{
      success: boolean;
      data: TrackingData;
      cached: boolean;
      cacheSource: string;
    }>(`/tracking/${encodeURIComponent(cargoCode)}`);
  }

  // Users & Demo
  public async getUsers() {
    return this.request<{ success: boolean; data: User[] }>('/users');
  }

  public async createUser(data: { name: string; email: string; password: string; role: string }) {
    return this.request<{ success: boolean; data: User; message: string }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async resetSeedData() {
    return this.request<{ success: boolean; message: string }>('/seed/reset', {
      method: 'POST',
    });
  }
}

export const api = new ApiService();
