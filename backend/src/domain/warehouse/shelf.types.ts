export interface Shelf {
  Id: number;
  ZoneId: number;
  Name: string;
  Code: string;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateShelfInput {
  zoneId: number;
  name: string;
  code: string;
}

export interface UpdateShelfInput {
  name?: string | undefined;
  code?: string | undefined;
}