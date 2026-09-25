# Roles and permissions matrix

Audit date: 2026-09-25 (updated; original audit 2026-09-23). This documents source-defined names and checked-in seed behavior. It does not claim live database grants, user assignments, or role IDs beyond what source proves.

## Authentication and enforcement

`auth.middleware.ts` requires `Authorization: Bearer <JWT>`, verifies signature/payload, and attaches `userId`, `username`, and `roles`. `permission.middleware.ts` checks each named permission through UserRoles, RolePermissions, Permissions, and Roles. It requires active permission and active role. It does not check that the JWT user's Users record remains active. `requireRoles` is now used by `delivery.routes.ts`, `picking.routes.ts`, `packing.routes.ts`, and `notification.routes.ts` (the 2026-09-23 note that no route used it is stale).

Login checks an active user and bcrypt password, then issues a one-hour JWT. Role names are in the JWT but routes authorize through the database permission query, not by named role. No mounted endpoint exposes a user's effective permissions.

## Seeded role names

| Role name | Verified source treatment |
| --- | --- |
| Super Admin | Inserted by auth SQL if absent. Base seed grants all permissions that exist at base seed execution. |
| Warehouse Manager | Inserted if absent. No name-based grant found. |
| Warehouse Staff | Inserted if absent. No name-based grant found. |
| Inventory Manager | Inserted if absent. No name-based grant found. |
| Picker | Inserted if absent. No name-based grant found. |
| Packer | Inserted if absent. No name-based grant found. |
| Delivery Manager | Inserted if absent. No name-based grant found. |
| Delivery Boy | Inserted if absent. No name-based grant found. |
| Support Staff | Inserted if absent. No name-based grant found. |

Packing and delivery seed scripts originally granted their permissions to numeric role IDs 1, 2, 3, and 5 (Super Admin, Warehouse Manager, Warehouse Staff, and Picker on a pristine database), which excluded Packer, Delivery Boy, and never granted PICKING_* to anyone. `2026-09-23/001_cleanup_worker_permissions.sql` removed the accidental Picker grants, and `2026-09-25/006_rbac_domain_permission_fix.sql` closed the gaps by name: Picker now gets all `PICKING_*`, Packer gets all `PACKING_*`, Delivery Boy gets all `DELIVERY_*`, and Super Admin was caught up on everything. All of this is name-based (`WHERE r.Name = '...'`), not numeric-ID-based.

## Route permissions and seed evidence

| Permission | Used by routes | Definition/grant evidence in checked-in SQL |
| --- | --- | --- |
| `AUTH_VIEW_PROFILE` | Auth profile | Defined in base seed; base seed grants then-existing active permissions to Super Admin. |
| `ORDER_CREATE`, `ORDER_VIEW`, `ORDER_VIEW_DETAILS`, `ORDER_CANCEL` | Orders and support aliases | Defined in base seed; base Super Admin grant at execution. |
| `CUSTOMER_CREATE`, `CUSTOMER_VIEW`, `CUSTOMER_UPDATE`, `CUSTOMER_DELETE` | Customers and support aliases | Defined in base seed; base Super Admin grant at execution. |
| `PRODUCT_CREATE`, `PRODUCT_VIEW`, `PRODUCT_UPDATE`, `PRODUCT_DELETE` | Products | Seeded by `2026-09-25/012_seed_missing_product_warehouse_inventory_permissions.sql`, granted by name to Super Admin, Warehouse Manager, Inventory Manager (`*_VIEW` also to Warehouse Staff). |
| `WAREHOUSE_CREATE`, `WAREHOUSE_VIEW`, `WAREHOUSE_UPDATE`, `WAREHOUSE_STATUS_UPDATE` | Warehouses, zones, shelves, bins | Same 012 migration; same grant-by-name set. |
| `INVENTORY_CREATE`, `INVENTORY_VIEW`, `INVENTORY_UPDATE`, `INVENTORY_STATUS_UPDATE` | Inventory, reservations, transactions | `INVENTORY_UPDATE` seeded/granted by `006_rbac_domain_permission_fix.sql`; `INVENTORY_CREATE`/`INVENTORY_VIEW`/`INVENTORY_STATUS_UPDATE` seeded/granted by `012_seed_missing_product_warehouse_inventory_permissions.sql`, same role set (`*_VIEW` also to Warehouse Staff). |
| `PICKING_CREATE`, `PICKING_VIEW`, `PICKING_ASSIGN`, `PICKING_START`, `PICKING_COMPLETE`, `PICKING_UPDATE_ITEM` | Picking | Defined in picking permissions SQL; granted to Picker (and Super Admin) by name via `006_rbac_domain_permission_fix.sql`. |
| `PACKING_CREATE`, `PACKING_VIEW`, `PACKING_ASSIGN`, `PACKING_START`, `PACKING_CREATE_PACKAGE`, `PACKING_COMPLETE` | Packing | Originally assigned to numeric role IDs 1,2,3,5 (excluding Packer); Packer added by name via `006_rbac_domain_permission_fix.sql`. |
| `DELIVERY_CREATE`, `DELIVERY_VIEW`, `DELIVERY_ASSIGN`, `DELIVERY_PICKUP`, `DELIVERY_OUT_FOR_DELIVERY`, `DELIVERY_TRACKING`, `DELIVERY_COMPLETE`, `DELIVERY_FAIL`, `DELIVERY_RETURN` | Delivery and support aliases | Originally assigned to numeric role IDs 1,2,3,5 (excluding Delivery Boy); Delivery Boy added by name via `006_rbac_domain_permission_fix.sql`. |

## Routes requiring authentication but no permission

| API area | Endpoint(s) | Scope in source |
| --- | --- | --- |
| Notifications | GET `/api/notifications/me`, GET `/api/notifications/me/unread`, PATCH `/api/notifications/:id/read` | Reads/marks only the JWT user's notifications. |
| Notifications | POST `/api/notifications` | Any authenticated user can submit a recipient userId. |
| Reports | GET `/api/reports/orders/summary` | Global aggregate; no report permission. |

Health and login are public. The inline `/api/health` is also public.

## Authorization gaps and ambiguities

- The base Super Admin grant runs before picking, packing, delivery, and product/warehouse/inventory permission scripts. It is a one-time insert, so `006_rbac_domain_permission_fix.sql` explicitly re-grants Super Admin every active permission that existed at that point, and `012_seed_missing_product_warehouse_inventory_permissions.sql` grants it the newly-seeded ones directly (not via a re-run of the base catch-up).
- Delivery assignment (`delivery.service.ts assign()`) already validates the target user is active and holds the "Delivery Boy" role before assigning. Picking/packing assignment (`picking.service.ts assignTask()`, `packing.service.ts assignTask()`) now do the same for "Picker"/"Packer" — fixed in the same change that hardened ownership validation; this closes the "task transitions do not require actor to equal assignee at assignment time" gap noted in the original audit. Post-assignment mutations (pickup/start/complete/etc.) already required the actor to equal the assignee before this fix.
- `/api/delivery/my-deliveries` scopes only that collection query; users with `DELIVERY_VIEW` can still use the global delivery list/details by ID. This remains by design for dispatch/admin visibility, not a gap being tracked for a fix.
- Support routes use their domain permission, not Support Staff role. No Support Staff-only rule exists.
- Frontend stores roles and displays them in Header, but does not enforce roles/permissions for routes, navigation, or UI actions. All authorization is server-side (`frontend/src/shared/permissions/access.ts`'s `hasPermission` deliberately always returns `false`, per its own comment, since the client has no reliable source of a user's effective permissions).

## Files inspected

`backend/src/middleware/{auth,permission,role}.middleware.ts`, `backend/src/repositories/user.repository.ts`, `backend/src/services/{auth,delivery,picking,packing}.service.ts`, `backend/src/utils/jwt.ts`, `backend/src/routes/*.ts`, `backend/sql/2026-09-16/{002_create_auth_tables,003_seed_permissions}.sql`, `backend/sql/2026-09-17/{004_picking_permissions,005_packing_permissions,006_delivery_setup}.sql`, `backend/sql/2026-09-23/001_cleanup_worker_permissions.sql`, `backend/sql/2026-09-25/{006_rbac_domain_permission_fix,012_seed_missing_product_warehouse_inventory_permissions}.sql`, and frontend authentication/navigation files.
