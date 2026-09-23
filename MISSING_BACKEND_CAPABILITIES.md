# Missing backend capabilities

Audit date: 2026-09-23. “Missing” below means no mounted active endpoint or implementation was found in this repository for the stated capability. It is not a request to invent business rules or APIs.

## Workflow completion gaps

| Missing or incomplete capability | Source evidence |
| --- | --- |
| Parent order progression after `STOCK_RESERVED` | Picking, packing, and delivery services update their own records only. No active source writes order `PICKING`, `PICKED`, `PACKING`, `PACKED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`, or `RETURNED`. |
| Reservation release and consumption | Reservation status type and SQL constraint declare `RELEASED` and `CONSUMED`; only `RESERVED` is written. |
| Out-of-stock outcome | `OUT_OF_STOCK` is declared as an order status but no route/service/repository writes it. Insufficient stock rolls back reservation. |
| Picking/packing/package cancellation | Cancelled types exist; no corresponding mounted write endpoints were found. |
| Package completion state | Packing completion leaves Package rows `CREATED`; no active code makes them `PACKED`. |
| Delivery retry/reassignment/cancellation | FAILED can only progress to RETURNED; no retry, reassign-after-failure, or cancellation action is mounted. |
| Warehouse hierarchy schema completeness | Active API repositories query Zones, Shelves, and Bins, but checked-in SQL does not create those tables. |
| Inventory transaction schema completeness | Active transaction repository queries `InventoryTransactions`, but checked-in SQL does not create that table. |

## Authorization and operational visibility gaps

| Missing capability | Source evidence |
| --- | --- |
| Effective-permission discovery | Login and `/api/auth/me` return roles, not effective permissions; no permissions-list endpoint was found. |
| Role/user/permission administration APIs | No mounted route manages users, roles, role assignments, permissions, or role-permission mappings. |
| Actor-to-assignee enforcement | Picking, packing, and delivery start/update/complete endpoints do not compare JWT user with assigned user. |
| Assignee eligibility enforcement | Assign endpoints accept IDs but do not verify target user exists, is active, has the expected role, or matches a warehouse. |
| Warehouse-scoped access | No route middleware or query predicates scope resource access by warehouse membership. |
| Report authorization | Report summary is authentication-only; a report-specific permission is absent. |
| Permission seed completeness | Route-required PRODUCT_*, WAREHOUSE_*, and INVENTORY_* permissions have no checked-in seed definitions; picking has definitions but no explicit role mappings. |

## API and client-enablement gaps

| Missing or incomplete capability | Source evidence |
| --- | --- |
| Server pagination/filter/sort/export | Collection APIs take no paging/filter/sort query. Frontend filters and CSV export are entirely local. |
| Detail/list relations for packing | Packing task response has no packages array or package list endpoint. |
| Delivery tracking route consistency | Tracking retrieval is mounted only under `/api/support/deliveries/:id/tracking`, not `/api/delivery/:id/tracking`. |
| Delivery-attempt retrieval | Attempts are inserted on failure but no mounted query endpoint returns them. |
| Notification authorization policy | Any authenticated user may create a notification for submitted userId; no creation permission or recipient restriction exists. |
| Backend logout/token revocation/refresh | Auth provides login and profile only. JWT has fixed one-hour expiry; no refresh, logout, revocation, or active-token invalidation endpoint exists. |
| Validated packing/delivery mutation contracts | Validators exist but active packing/delivery controllers do not use them. |
| Uniform response/error contract | Customer and inventory transaction controllers use shapes that differ from most other APIs; unhandled validation/business errors pass to generic 500 handler. |

## Ambiguities requiring source or database confirmation

- SQL scripts grant packing and delivery permissions to numeric role IDs 1, 2, 3, and 5. Fresh seed order suggests specific names, but database state has not been queried and IDs are not a durable named-role mapping.
- The base Super Admin grant runs before later permission scripts. It does not automatically grant permissions added afterward unless rerun.
- Checked-in SQL contradicts active repository assumptions: PackingTasks.PackerUserId and Packages.Weight are NOT NULL in SQL but inserted as NULL; DeliveryTracking latitude/longitude/remarks are NOT NULL in SQL but repository can insert NULL. Deployed schema may have been altered separately.
- Existing database schema, migrations applied, users, role assignments, and runtime environment are not knowable from this source-only audit.
- No payment, carrier, proof-of-delivery, address validation, product catalog stock location, or notification-trigger business rule was found. Their absence from this list must not be read as a requirement to add them.

## Files inspected

The findings are derived from all active backend routes, controllers, services, repositories, validators, domain types, auth middleware, SQL scripts, and active frontend call sites listed in the other audit documents.
