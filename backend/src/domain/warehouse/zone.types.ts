export interface Zone {
  Id: number;
  WarehouseId: number;
  Name: string;
  Code: string;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateZoneInput {
  warehouseId: number;
  name: string;
  code: string;
}

export interface UpdateZoneInput {
  name?: string;
  code?: string;
}