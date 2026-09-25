import sql from "mssql";

export interface WarehouseAllocationItem {
  productId: number;
  quantity: number;
}

export interface WarehouseAllocationShortfall {
  productId: number;
  available: number;
  required: number;
}

export interface WarehouseAllocationResult {
  warehouseId: number | null;
  shortfalls: WarehouseAllocationShortfall[];
}

/**
 * Selects the lowest-Id active warehouse that has sufficient
 * AvailableQuantity for every requested line item. This is the confirmed
 * allocation rule for automatic warehouse selection at order creation time
 * (no serviceability/geo data exists in the schema to base a richer rule
 * on). Returns warehouseId: null with the first candidate's shortfalls if
 * no warehouse can fully cover the order (caller should route to
 * OUT_OF_STOCK).
 *
 * Must be called within the caller's existing sql.Transaction so the
 * UPDLOCK/ROWLOCK held on each candidate's Inventory rows is released
 * together with the rest of the order-creation transaction.
 */
export const selectWarehouseForOrder = async (
  transaction: sql.Transaction,
  items: WarehouseAllocationItem[],
): Promise<WarehouseAllocationResult> => {
  const warehousesResult = await new sql.Request(transaction).query<{
    Id: number;
  }>(`
    SELECT Id
    FROM dbo.Warehouses
    WHERE IsActive = 1
    ORDER BY Id ASC;
  `);

  let firstCandidateShortfalls: WarehouseAllocationShortfall[] = [];

  for (const warehouse of warehousesResult.recordset) {
    const inventoryResult = await new sql.Request(transaction)
      .input("WarehouseId", sql.Int, warehouse.Id)
      .query<{ ProductId: number; AvailableQuantity: number }>(`
        SELECT ProductId, AvailableQuantity
        FROM dbo.Inventory WITH (UPDLOCK, ROWLOCK)
        WHERE WarehouseId = @WarehouseId
          AND IsActive = 1;
      `);

    const availableByProduct = new Map(
      inventoryResult.recordset.map((row) => [row.ProductId, row.AvailableQuantity]),
    );

    const shortfalls: WarehouseAllocationShortfall[] = items
      .map((item) => ({
        productId: item.productId,
        available: availableByProduct.get(item.productId) ?? 0,
        required: item.quantity,
      }))
      .filter((entry) => entry.available < entry.required);

    if (shortfalls.length === 0) {
      return { warehouseId: warehouse.Id, shortfalls: [] };
    }

    if (firstCandidateShortfalls.length === 0) {
      firstCandidateShortfalls = shortfalls;
    }
  }

  return { warehouseId: null, shortfalls: firstCandidateShortfalls };
};
