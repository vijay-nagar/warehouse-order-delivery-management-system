import sql from "mssql";

import { assertValidTransition } from "../domain/order/order-transitions.js";
import { HttpError } from "../utils/http-error.js";

import type { OrderStatus } from "../domain/order/order-status.types.js";

interface RecordStatusChangeParams {
  transaction: sql.Transaction;
  orderId: number;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  changedBy: number | null;
  reason?: string | undefined;
}

/**
 * Central, transaction-scoped order status transition. Every repository
 * that moves Orders.Status must go through this instead of writing its own
 * ad-hoc UPDATE, so the legal-transition table and the audit trail
 * (OrderStatusHistory) stay authoritative in one place. Takes an existing
 * sql.Transaction (not a bare sql.Request) so the caller's own transaction
 * boundary/rollback semantics are preserved unchanged.
 */
export const recordStatusChange = async (
  params: RecordStatusChangeParams,
): Promise<void> => {
  assertValidTransition(params.fromStatus, params.toStatus);

  const updateResult = await new sql.Request(params.transaction)
    .input("OrderId", sql.Int, params.orderId)
    .input("From", sql.NVarChar(50), params.fromStatus)
    .input("To", sql.NVarChar(50), params.toStatus)
    .query(`
      UPDATE dbo.Orders
      SET Status = @To, UpdatedAt = SYSUTCDATETIME()
      WHERE Id = @OrderId AND Status = @From;
    `);

  if (updateResult.rowsAffected[0] !== 1) {
    throw new HttpError(
      409,
      `Order ${params.orderId} could not transition ${params.fromStatus} -> ${params.toStatus} (concurrent modification).`,
    );
  }

  await new sql.Request(params.transaction)
    .input("OrderId", sql.Int, params.orderId)
    .input("From", sql.NVarChar(50), params.fromStatus)
    .input("To", sql.NVarChar(50), params.toStatus)
    .input("ChangedBy", sql.Int, params.changedBy)
    .input("Reason", sql.NVarChar(500), params.reason ?? null)
    .query(`
      INSERT INTO dbo.OrderStatusHistory (OrderId, FromStatus, ToStatus, ChangedBy, Reason)
      VALUES (@OrderId, @From, @To, @ChangedBy, @Reason);
    `);
};

interface RecordInitialStatusParams {
  transaction: sql.Transaction;
  orderId: number;
  status: OrderStatus;
  changedBy: number | null;
  reason?: string | undefined;
}

/**
 * Writes only the OrderStatusHistory audit row for an order's initial
 * status. The Orders row itself already carries this status from its own
 * INSERT, so there is no UPDATE/guard here.
 */
export const recordInitialStatus = async (
  params: RecordInitialStatusParams,
): Promise<void> => {
  await new sql.Request(params.transaction)
    .input("OrderId", sql.Int, params.orderId)
    .input("To", sql.NVarChar(50), params.status)
    .input("ChangedBy", sql.Int, params.changedBy)
    .input("Reason", sql.NVarChar(500), params.reason ?? null)
    .query(`
      INSERT INTO dbo.OrderStatusHistory (OrderId, FromStatus, ToStatus, ChangedBy, Reason)
      VALUES (@OrderId, NULL, @To, @ChangedBy, @Reason);
    `);
};
