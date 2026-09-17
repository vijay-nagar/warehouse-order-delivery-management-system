export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string | null;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  description?: string;
  price: number;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
}
