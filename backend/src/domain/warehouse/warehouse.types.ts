export interface Warehouse {
  id: number;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateWarehouseInput {
  name: string;
  code: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
}

export interface UpdateWarehouseInput {
  name?: string;
  code?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}