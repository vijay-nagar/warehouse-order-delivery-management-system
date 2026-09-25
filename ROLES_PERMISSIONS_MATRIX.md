# Roles and permissions matrix

Audit date: 2026-09-23. This documents source-defined names and checked-in seed behavior. It does not claim live database grants, user assignments, or role IDs beyond what source proves.

## Authentication and enforcement

`auth.middleware.ts` requires `Authorization: Bearer <JWT>`, verifies signature/payload, and attaches `userId`, `username`, and `roles`. `permission.middleware.ts` checks each named permission through UserRoles, RolePermissions, Permissions, and Roles. It requires active permission and active role. It does not check that the JWT user's Users record remains active. `requireRoles` exists but no mounted route uses it.

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

Packing and delivery seed scripts grant their permissions to numeric role IDs 1, 2, 3, and 5. On a pristine database following the role insertion order, those IDs would be Super Admin, Warehouse Manager, Warehouse Staff, and Picker. This is a conditional seed-order observation, not a verified live mapping. It does not grant by name to Packer, Delivery Manager, or Delivery Boy.

## Route permissions and seed evidence

| Permission | Used by routes | Definition/grant evidence in checked-in SQL |
| --- | --- | --- |
| `AUTH_VIEW_PROFILE` | Auth profile | Defined in base seed; base seed grants then-existing active permissions to Super Admin. |
| `ORDER_CREATE`, `ORDER_VIEW`, `ORDER_VIEW_DETAILS`, `ORDER_CANCEL` | Orders and support aliases | Defined in base seed; base Super Admin grant at execution. |
| `CUSTOMER_CREATE`, `CUSTOMER_VIEW`, `CUSTOMER_UPDATE`, `CUSTOMER_DELETE` | Customers and support aliases | Defined in base seed; base Super Admin grant at execution. |
| `PRODUCT_CREATE`, `PRODUCT_VIEW`, `PRODUCT_UPDATE`, `PRODUCT_DELETE` | Products | Used by routes; no checked-in permission definition/grant seed found. |
| `WAREHOUSE_CREATE`, `WAREHOUSE_VIEW`, `WAREHOUSE_UPDATE`, `WAREHOUSE_STATUS_UPDATE` | Warehouses, zones, shelves, bins | Used by routes; no checked-in permission definition/grant seed found. |
| `INVENTORY_CREATE`, `INVENTORY_VIEW`, `INVENTORY_UPDATE`, `INVENTORY_STATUS_UPDATE` | Inventory, reservations, transactions | Used by routes; no checked-in permission definition/grant seed found. |
| `PICKING_CREATE`, `PICKING_VIEW`, `PICKING_ASSIGN`, `PICKING_START`, `PICKING_COMPLETE`, `PICKING_UPDATE_ITEM` | Picking | Defined in picking permissions SQL; no corresponding RolePermissions insert found. |
| `PACKING_CREATE`, `PACKING_VIEW`, `PACKING_ASSIGN`, `PACKING_START`, `PACKING_CREATE_PACKAGE`, `PACKING_COMPLETE` | Packing | Defined; assigned to numeric role IDs 1,2,3,5. |
| `DELIVERY_CREATE`, `DELIVERY_VIEW`, `DELIVERY_ASSIGN`, `DELIVERY_PICKUP`, `DELIVERY_OUT_FOR_DELIVERY`, `DELIVERY_TRACKING`, `DELIVERY_COMPLETE`, `DELIVERY_FAIL`, `DELIVERY_RETURN` | Delivery and support aliases | Defined; assigned to numeric role IDs 1,2,3,5. |

## Routes requiring authentication but no permission

| API area | Endpoint(s) | Scope in source |
| --- | --- | --- |
| Notifications | GET `/api/notifications/me`, GET `/api/notifications/me/unread`, PATCH `/api/notifications/:id/read` | Reads/marks only the JWT user's notifications. |
| Notifications | POST `/api/notifications` | Any authenticated user can submit a recipient userId. |
| Reports | GET `/api/reports/orders/summary` | Global aggregate; no report permission. |

Health and login are public. The inline `/api/health` is also public.

## Authorization gaps and ambiguities

- The base Super Admin grant runs before picking, packing, and delivery permission scripts. It is a one-time insert, so later-created permissions are not automatically assigned unless an operator reruns/otherwise maps them.
- Product, warehouse, and inventory permission names are enforced by routes but are not seeded in checked-in SQL. Source cannot prove that any role can use those endpoints in a live database.
- Assignment accepts numeric users without checking user existence, role, active state, or warehouse. Task transitions do not require action actor to equal assignee.
- `/api/delivery/my-deliveries` scopes only that collection query; users with `DELIVERY_VIEW` can use global delivery list/details.
- Support routes use their domain permission, not Support Staff role. No Support Staff-only rule exists.
- Frontend stores roles and displays them in Header, but does not enforce roles/permissions for routes, navigation, or UI actions.

## Files inspected

`backend/src/middleware/{auth,permission,role}.middleware.ts`, `backend/src/repositories/user.repository.ts`, `backend/src/services/auth.service.ts`, `backend/src/utils/jwt.ts`, `backend/src/routes/*.ts`, `backend/sql/2026-09-16/{002_create_auth_tables,003_seed_permissions}.sql`, `backend/sql/2026-09-17/{004_picking_permissions,005_packing_permissions,006_delivery_setup}.sql`, and frontend authentication/navigation files.
