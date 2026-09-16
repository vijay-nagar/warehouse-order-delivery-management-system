import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import type {
  CreateProductInput,
  Product,
  UpdateProductInput,
} from "../domain/products/product.types.js";

interface ProductRow {
  Id: number;
  Name: string;
  SKU: string;
  Description: string | null;
  Price: number;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date | null;
}

const mapProduct = (row: ProductRow): Product => ({
  id: row.Id,
  name: row.Name,
  sku: row.SKU,
  description: row.Description,
  price: row.Price,
  isActive: row.IsActive,
  createdAt: row.CreatedAt,
  updatedAt: row.UpdatedAt,
});

export class ProductRepository {
  async create(input: CreateProductInput): Promise<Product> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("name", sql.NVarChar(200), input.name)
      .input("sku", sql.NVarChar(100), input.sku)
      .input(
        "description",
        sql.NVarChar(1000),
        input.description ?? null,
      )
      .input("price", sql.Decimal(18, 2), input.price)
      .query<ProductRow>(`
        INSERT INTO dbo.Products (
          Name,
          SKU,
          Description,
          Price,
          IsActive
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.Name,
          INSERTED.SKU,
          INSERTED.Description,
          INSERTED.Price,
          INSERTED.IsActive,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        VALUES (
          @name,
          @sku,
          @description,
          @price,
          1
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Product creation failed");
    }

    return mapProduct(row);
  }

  async findAll(): Promise<Product[]> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .query<ProductRow>(`
        SELECT
          Id,
          Name,
          SKU,
          Description,
          Price,
          IsActive,
          CreatedAt,
          UpdatedAt
        FROM dbo.Products
        WHERE IsActive = 1
        ORDER BY Id DESC;
      `);

    return result.recordset.map(mapProduct);
  }

  async findById(id: number): Promise<Product | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query<ProductRow>(`
        SELECT
          Id,
          Name,
          SKU,
          Description,
          Price,
          IsActive,
          CreatedAt,
          UpdatedAt
        FROM dbo.Products
        WHERE Id = @id
          AND IsActive = 1;
      `);

    const row = result.recordset[0];

    return row ? mapProduct(row) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("sku", sql.NVarChar(100), sku)
      .query<ProductRow>(`
        SELECT
          Id,
          Name,
          SKU,
          Description,
          Price,
          IsActive,
          CreatedAt,
          UpdatedAt
        FROM dbo.Products
        WHERE SKU = @sku
          AND IsActive = 1;
      `);

    const row = result.recordset[0];

    return row ? mapProduct(row) : null;
  }

  async update(
    id: number,
    input: UpdateProductInput,
  ): Promise<Product | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar(200), input.name ?? null)
      .input("sku", sql.NVarChar(100), input.sku ?? null)
      .input(
        "description",
        sql.NVarChar(1000),
        input.description ?? null,
      )
      .input(
        "price",
        sql.Decimal(18, 2),
        input.price ?? null,
      )
      .input(
        "isActive",
        sql.Bit,
        input.isActive ?? null,
      )
      .query<ProductRow>(`
        UPDATE dbo.Products
        SET
          Name = COALESCE(@name, Name),
          SKU = COALESCE(@sku, SKU),
          Description = COALESCE(@description, Description),
          Price = COALESCE(@price, Price),
          IsActive = COALESCE(@isActive, IsActive),
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.Name,
          INSERTED.SKU,
          INSERTED.Description,
          INSERTED.Price,
          INSERTED.IsActive,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @id;
      `);

    const row = result.recordset[0];

    return row ? mapProduct(row) : null;
  }

  async delete(id: number): Promise<boolean> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        UPDATE dbo.Products
        SET
          IsActive = 0,
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
          AND IsActive = 1;
      `);

    return result.rowsAffected[0] === 1;
  }
}
