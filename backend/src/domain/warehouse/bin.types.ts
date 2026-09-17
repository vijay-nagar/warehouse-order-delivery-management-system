export interface Bin {
  Id: number;
  ShelfId: number;
  Name: string;
  Code: string;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateBinInput {
  shelfId: number;
  name: string;
  code: string;
}

export interface UpdateBinInput {
  name?: string | undefined;
  code?: string | undefined;
}