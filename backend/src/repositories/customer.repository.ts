import sql from "mssql";

import { getDatabasePool } from "../config/database.js";
import type {
  CreateCustomerInput,
  Customer,
  UpdateCustomerInput,
} from "../domain/customers/customer.types.js";

interface CustomerRow {
  Id: number;
  Name: string;
  Phone: string;
  Email: string | null;
  AddressLine1: string;
  AddressLine2: string | null;
  City: string;
  State: string;
  PostalCode: string;
  IsActive: boolean;
  CreatedAt: Date;
  UpdatedAt: Date | null;
}

const mapCustomer = (row: CustomerRow): Customer => ({
  id: row.Id,
  name: row.Name,
  phone: row.Phone,
  email: row.Email,
  addressLine1: row.AddressLine1,
  addressLine2: row.AddressLine2,
  city: row.City,
  state: row.State,
  postalCode: row.PostalCode,
  isActive: row.IsActive,
  createdAt: row.CreatedAt,
  updatedAt: row.UpdatedAt,
});

export class CustomerRepository {
  async create(input: CreateCustomerInput): Promise<Customer> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("name", sql.NVarChar(200), input.name)
      .input("phone", sql.NVarChar(50), input.phone)
      .input("email", sql.NVarChar(200), input.email ?? null)
      .input(
        "addressLine1",
        sql.NVarChar(500),
        input.addressLine1,
      )
      .input(
        "addressLine2",
        sql.NVarChar(500),
        input.addressLine2 ?? null,
      )
      .input("city", sql.NVarChar(100), input.city)
      .input("state", sql.NVarChar(100), input.state)
      .input(
        "postalCode",
        sql.NVarChar(20),
        input.postalCode,
      )
      .query<CustomerRow>(`
        INSERT INTO dbo.Customers (
          Name,
          Phone,
          Email,
          AddressLine1,
          AddressLine2,
          City,
          State,
          PostalCode,
          IsActive
        )
        OUTPUT
          INSERTED.Id,
          INSERTED.Name,
          INSERTED.Phone,
          INSERTED.Email,
          INSERTED.AddressLine1,
          INSERTED.AddressLine2,
          INSERTED.City,
          INSERTED.State,
          INSERTED.PostalCode,
          INSERTED.IsActive,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        VALUES (
          @name,
          @phone,
          @email,
          @addressLine1,
          @addressLine2,
          @city,
          @state,
          @postalCode,
          1
        );
      `);

    const row = result.recordset[0];

    if (!row) {
      throw new Error("Customer creation failed");
    }

    return mapCustomer(row);
  }

  async findAll(): Promise<Customer[]> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .query<CustomerRow>(`
        SELECT
          Id,
          Name,
          Phone,
          Email,
          AddressLine1,
          AddressLine2,
          City,
          State,
          PostalCode,
          IsActive,
          CreatedAt,
          UpdatedAt
        FROM dbo.Customers
        WHERE IsActive = 1
        ORDER BY Id DESC;
      `);

    return result.recordset.map(mapCustomer);
  }

  async findById(id: number): Promise<Customer | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query<CustomerRow>(`
        SELECT
          Id,
          Name,
          Phone,
          Email,
          AddressLine1,
          AddressLine2,
          City,
          State,
          PostalCode,
          IsActive,
          CreatedAt,
          UpdatedAt
        FROM dbo.Customers
        WHERE Id = @id
          AND IsActive = 1;
      `);

    const row = result.recordset[0];

    return row ? mapCustomer(row) : null;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("phone", sql.NVarChar(50), phone)
      .query<CustomerRow>(`
        SELECT
          Id,
          Name,
          Phone,
          Email,
          AddressLine1,
          AddressLine2,
          City,
          State,
          PostalCode,
          IsActive,
          CreatedAt,
          UpdatedAt
        FROM dbo.Customers
        WHERE Phone = @phone
          AND IsActive = 1;
      `);

    const row = result.recordset[0];

    return row ? mapCustomer(row) : null;
  }

  async update(
    id: number,
    input: UpdateCustomerInput,
  ): Promise<Customer | null> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .input("name", sql.NVarChar(200), input.name ?? null)
      .input("phone", sql.NVarChar(50), input.phone ?? null)
      .input("email", sql.NVarChar(200), input.email ?? null)
      .input(
        "addressLine1",
        sql.NVarChar(500),
        input.addressLine1 ?? null,
      )
      .input(
        "addressLine2",
        sql.NVarChar(500),
        input.addressLine2 ?? null,
      )
      .input("city", sql.NVarChar(100), input.city ?? null)
      .input("state", sql.NVarChar(100), input.state ?? null)
      .input(
        "postalCode",
        sql.NVarChar(20),
        input.postalCode ?? null,
      )
      .input(
        "isActive",
        sql.Bit,
        input.isActive ?? null,
      )
      .query<CustomerRow>(`
        UPDATE dbo.Customers
        SET
          Name = COALESCE(@name, Name),
          Phone = COALESCE(@phone, Phone),
          Email = COALESCE(@email, Email),
          AddressLine1 = COALESCE(@addressLine1, AddressLine1),
          AddressLine2 = COALESCE(@addressLine2, AddressLine2),
          City = COALESCE(@city, City),
          State = COALESCE(@state, State),
          PostalCode = COALESCE(@postalCode, PostalCode),
          IsActive = COALESCE(@isActive, IsActive),
          UpdatedAt = SYSUTCDATETIME()
        OUTPUT
          INSERTED.Id,
          INSERTED.Name,
          INSERTED.Phone,
          INSERTED.Email,
          INSERTED.AddressLine1,
          INSERTED.AddressLine2,
          INSERTED.City,
          INSERTED.State,
          INSERTED.PostalCode,
          INSERTED.IsActive,
          INSERTED.CreatedAt,
          INSERTED.UpdatedAt
        WHERE Id = @id;
      `);

    const row = result.recordset[0];

    return row ? mapCustomer(row) : null;
  }

  async delete(id: number): Promise<boolean> {
    const pool = await getDatabasePool();

    const result = await pool
      .request()
      .input("id", sql.Int, id)
      .query(`
        UPDATE dbo.Customers
        SET
          IsActive = 0,
          UpdatedAt = SYSUTCDATETIME()
        WHERE Id = @id
          AND IsActive = 1;
      `);

    return result.rowsAffected[0] === 1;
  }
}
