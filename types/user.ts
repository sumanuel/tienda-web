export type UserRole = 'owner' | 'admin' | 'cashier';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  currencies: string[];
  defaultCurrency: string;
  taxRate: number;
  createdAt: Date;
  updatedAt: Date;
}
