# Workflow and status matrix

Audit date: 2026-09-23. This matrix reports only status values and transitions found in active backend source. It does not infer missing transitions or business policy.

## Declared status sets

| Entity | Source-defined statuses |
| --- | --- |
| Order | `CREATED`, `STOCK_RESERVED`, `PICKING`, `PICKED`, `PACKING`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `OUT_OF_STOCK`, `CANCELLED`, `FAILED`, `RETURNED` |
| Inventory reservation | `RESERVED`, `RELEASED`, `CONSUMED` |
| Picking task | `PENDING`, `ASSIGNED`, `PICKING`, `PICKED`, `CANCELLED` |
| Picking item | `PENDING`, `PICKED`, `PARTIAL`, `SHORT` |
| Packing task | `PENDING`, `ASSIGNED`, `PACKING`, `PACKED`, `CANCELLED` |
| Package | `CREATED`, `PACKED`, `CANCELLED` |
| Delivery | `PENDING`, `ASSIGNED`, `PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, `RETURNED` |
| Notification type | `INFO`, `ORDER`, `INVENTORY`, `DELIVERY`, `SYSTEM` |
| Inventory transaction type | `IN`, `OUT`, `ADJUSTMENT` |

Only the order status union is declared in a dedicated `ORDER_STATUSES` array. Other status unions are TypeScript types. SQL constraints exist only for reservation status in the checked-in scripts; workflow status database constraints were not found.

## Enforced transitions

| Entity | Endpoint | From | To | Additional source-verified conditions |
| --- | --- | --- | --- | --- |
| Order | POST `/api/orders` | New | `CREATED` | Active products must exist; customer and warehouse existence are not checked. |
| Order | POST `/api/orders/:id/cancel` | `CREATED` | `CANCELLED` | Repository predicate enforces CREATED. |
| Order / reservation | POST `/api/inventory/reservations/:orderId` and POST `/api/inventory-reservation/:orderId` | `CREATED` | `STOCK_RESERVED` | Warehouse present, items present, active inventory exists and sufficient available stock; reservation and picking task/items are transactional. |
| Picking task | POST `/api/picking` | New | `PENDING` | Explicit create; a duplicate active task for the same order is rejected unless existing task is PICKED/CANCELLED. |
| Picking task | POST `/api/picking/:id/assign` | `PENDING` | `ASSIGNED` | pickerUserId is validated positive; target user is not role/active checked. |
| Picking task | POST `/api/picking/:id/start` | `ASSIGNED` | `PICKING` | None beyond task status. |
| Picking item | PATCH `/api/picking/:id/items/:itemId` | Task `PICKING` | `PENDING`, `PARTIAL`, or `PICKED` | `pickedQuantity=0` => PENDING; `0 < quantity < required` => PARTIAL; `quantity >= required` => PICKED. `SHORT` is declared but not written by this source. |
| Picking task | POST `/api/picking/:id/complete` | `PICKING` | `PICKED` | At least one item and every `PickedQuantity >= RequiredQuantity`. |
| Packing task | POST `/api/packing` | New | `PENDING` | No source check that linked picking task is PICKED, belongs to order, or even exists. |
| Packing task | POST `/api/packing/:id/assign` | `PENDING` | `ASSIGNED` | No applied schema or target-user role/active check. |
| Packing task | POST `/api/packing/:id/start` | `ASSIGNED` | `PACKING` | None beyond task status. |
| Package | POST `/api/packing/:id/packages` | Packing `PACKING` | `CREATED` | Generated tracking code; optional weight is passed without active validator. |
| Packing task | POST `/api/packing/:id/complete` | `PACKING` | `PACKED` | Requires one or more packages. Package status is not changed by this implementation. |
| Delivery | POST `/api/delivery` | New | `PENDING` | Package belongs to submitted order; package `CREATED` or `PACKED`; linked packing task `PACKED`; no existing active delivery for that package. |
| Delivery | POST `/api/delivery/:id/assign` | `PENDING` | `ASSIGNED` | No active/role check for deliveryBoyUserId. |
| Delivery | POST `/api/delivery/:id/pickup` | `ASSIGNED` | `PICKED_UP` | None beyond status. |
| Delivery | POST `/api/delivery/:id/out-for-delivery` | `PICKED_UP` | `OUT_FOR_DELIVERY` | None beyond status. |
| Delivery | POST `/api/delivery/:id/delivered` | `OUT_FOR_DELIVERY` | `DELIVERED` | None beyond status. |
| Delivery | POST `/api/delivery/:id/failed` | `PICKED_UP` or `OUT_FOR_DELIVERY` | `FAILED` | Failure reason may be empty because active controller does not apply validator; inserts a DeliveryAttempts row. |
| Delivery | POST `/api/delivery/:id/returned` | `FAILED` | `RETURNED` | Return reason may be empty because active controller does not apply validator. |
| Delivery tracking | POST `/api/delivery/:id/tracking` | Delivery `PICKED_UP` or `OUT_FOR_DELIVERY` | Tracking row uses current delivery status | Body `status` is ignored; optional coordinates/remarks become null. |

## Not implemented or disconnected in active source

- The reservation model declares `RELEASED` and `CONSUMED`; no route, service, or repository operation changes a reservation to either state.
- The order union declares every listed workflow stage, but active code writes only `CREATED`, `STOCK_RESERVED`, and `CANCELLED`. Picking, packing, delivery, failed, returned, and inventory outcomes do not update parent `Orders.Status`.
- `OUT_OF_STOCK` is declared but no active code writes it. Insufficient reservation stock throws an error and leaves the transaction rolled back.
- Picking and packing declare `CANCELLED`, and package declares `PACKED`/`CANCELLED`; active endpoints do not write those values. Package remains `CREATED` when packing completes, although delivery permits `CREATED` and requires the task itself to be `PACKED`.
- The reservation-created picking task does not move the order to `PICKING`; it remains `STOCK_RESERVED`.
- There is no verified retry/reassignment transition from delivery FAILED, no delivery cancellation, and no active order status check when delivery is created.
- Direct inventory update and transactions do not coordinate reservations. Stock-out only checks `AvailableQuantity`; adjustment can set a total lower than ReservedQuantity because transaction service does not check reserved quantity.
- Task action authorization checks a permission, not assignment ownership. No mapped role gate ensures a Picker, Packer, or Delivery Boy performs its matching task.

## Source files inspected

`backend/src/domain/{order/order-status.types.ts,inventory/reservation.types.ts,picking/picking.types.ts,packing/packing.types.ts,delivery/delivery.types.ts}`, all active route/controller/service/repository files for orders, inventory reservation, picking, packing, and delivery, plus checked-in SQL under `backend/sql`.
