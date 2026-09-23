# Backend API inventory

Audit date: 2026-09-23. Static source audit only. This inventory lists 88 mounted method/path pairs found through `backend/src/app.ts`, `backend/src/gateway/gateway.routes.ts`, and nested router mounting in `inventory.routes.ts`. Backup files and unmounted gateway helpers are excluded.

All protected routes require a Bearer JWT. A listed permission is enforced by `requirePermission`; `None` means no permission middleware was found. `E(...)` means the common `{ success: true, data: ... }` response envelope. Controllers are the active source of truth for response shape; error envelopes are inconsistent.

## Health and authentication

| Method | Endpoint | Handler | Permission | Request / response |
| --- | --- | --- | --- | --- |
| GET | `/health` | health.getHealth | None, public | Raw `{status,service,database,timestamp}`; 200 or 503 after database check. |
| GET | `/api/health` | inline app handler | None, public | Raw `{status:"ok",instance}`; no database check. |
| POST | `/api/auth/login` | auth.login | None, public | `{username,password}`; 200 E(Login), 400 invalid input, 401 invalid credentials. |
| GET | `/api/auth/me` | auth.me | `AUTH_VIEW_PROFILE` | 200 E(`{userId,username,roles}`); no body. |

## Customers, products, warehouse resources, inventory, and transactions

| Method | Endpoint | Handler | Permission | Request / response |
| --- | --- | --- | --- | --- |
| POST | `/api/customers` | createCustomer | `CUSTOMER_CREATE` | Create customer schema; 201 raw Customer. |
| GET | `/api/customers` | getCustomers | `CUSTOMER_VIEW` | 200 raw active Customer array. |
| GET | `/api/customers/:id` | getCustomerById | `CUSTOMER_VIEW` | 200 raw active Customer. |
| PUT | `/api/customers/:id` | updateCustomer | `CUSTOMER_UPDATE` | Update customer schema; 200 raw Customer. |
| DELETE | `/api/customers/:id` | deleteCustomer | `CUSTOMER_DELETE` | Soft-deactivates; 200 `{message}`. |
| POST | `/api/products` | createProduct | `PRODUCT_CREATE` | `{name,sku,price,description?}`; 201 E(Product). |
| GET | `/api/products` | getProducts | `PRODUCT_VIEW` | 200 E(active Product array). |
| GET | `/api/products/:id` | getProductById | `PRODUCT_VIEW` | 200 E(Product). |
| PUT | `/api/products/:id` | updateProduct | `PRODUCT_UPDATE` | Optional product fields and `isActive`; 200 E(Product). |
| DELETE | `/api/products/:id` | deleteProduct | `PRODUCT_DELETE` | Soft-deactivates; 200 E(message). |
| POST | `/api/warehouses` | createWarehouse | `WAREHOUSE_CREATE` | Warehouse schema; 201 E(Warehouse). |
| GET | `/api/warehouses` | getAllWarehouses | `WAREHOUSE_VIEW` | 200 E(Warehouse array). |
| GET | `/api/warehouses/:id` | getWarehouseById | `WAREHOUSE_VIEW` | 200 E(Warehouse). |
| PUT | `/api/warehouses/:id` | updateWarehouse | `WAREHOUSE_UPDATE` | Warehouse update schema; 200 E(Warehouse). |
| PATCH | `/api/warehouses/:id/status` | updateWarehouseStatus | `WAREHOUSE_STATUS_UPDATE` | `{isActive:boolean}`; 200 E(Warehouse). |
| POST | `/api/zones` | createZone | `WAREHOUSE_CREATE` | Zone schema; 201 E(Zone). |
| GET | `/api/zones` | getAllZones | `WAREHOUSE_VIEW` | 200 E(Zone array). |
| GET | `/api/zones/:id` | getZoneById | `WAREHOUSE_VIEW` | 200 E(Zone). |
| PUT | `/api/zones/:id` | updateZone | `WAREHOUSE_UPDATE` | Zone update schema; 200 E(Zone). |
| PATCH | `/api/zones/:id/status` | updateZoneStatus | `WAREHOUSE_STATUS_UPDATE` | `{isActive:boolean}`; 200 E(Zone). |
| POST | `/api/shelves` | createShelf | `WAREHOUSE_CREATE` | Shelf schema; 201 E(Shelf). |
| GET | `/api/shelves` | getAllShelves | `WAREHOUSE_VIEW` | 200 E(Shelf array). |
| GET | `/api/shelves/:id` | getShelfById | `WAREHOUSE_VIEW` | 200 E(Shelf). |
| PUT | `/api/shelves/:id` | updateShelf | `WAREHOUSE_UPDATE` | Shelf update schema; 200 E(Shelf). |
| PATCH | `/api/shelves/:id/status` | updateShelfStatus | `WAREHOUSE_STATUS_UPDATE` | `{isActive:boolean}`; 200 E(Shelf). |
| POST | `/api/bins` | createBin | `WAREHOUSE_CREATE` | Bin schema; 201 E(Bin). |
| GET | `/api/bins` | getAllBins | `WAREHOUSE_VIEW` | 200 E(Bin array). |
| GET | `/api/bins/:id` | getBinById | `WAREHOUSE_VIEW` | 200 E(Bin). |
| PUT | `/api/bins/:id` | updateBin | `WAREHOUSE_UPDATE` | Bin update schema; 200 E(Bin). |
| PATCH | `/api/bins/:id/status` | updateBinStatus | `WAREHOUSE_STATUS_UPDATE` | `{isActive:boolean}`; 200 E(Bin). |
| POST | `/api/inventory` | createInventory | `INVENTORY_CREATE` | Inventory schema; 201 E(Inventory). |
| GET | `/api/inventory` | getAllInventory | `INVENTORY_VIEW` | 200 E(Inventory array). |
| GET | `/api/inventory/:id` | getInventoryById | `INVENTORY_VIEW` | 200 E(Inventory). |
| PUT | `/api/inventory/:id` | updateInventory | `INVENTORY_UPDATE` | Inventory update schema; 200 E(Inventory). |
| PATCH | `/api/inventory/:id/status` | updateInventoryStatus | `INVENTORY_STATUS_UPDATE` | `{isActive:boolean}`; 200 E(Inventory). |
| POST | `/api/inventory/reservations/:orderId` | inline reserveOrder | `INVENTORY_UPDATE` | Reserves stock; 200 E(Reservation array). |
| POST | `/api/inventory-reservation/:orderId` | inline reserveOrder | `INVENTORY_UPDATE` | Same router/handler and response as previous path. |
| POST | `/api/inventory-transactions/stock-in` | stockIn | `INVENTORY_UPDATE` | `{inventoryId,quantity,remarks?}`; 201 `{message,data}`. |
| POST | `/api/inventory-transactions/stock-out` | stockOut | `INVENTORY_UPDATE` | Same body; 201 `{message,data}`. |
| POST | `/api/inventory-transactions/adjustment` | stockAdjustment | `INVENTORY_UPDATE` | Same body; submitted quantity is new total. |
| GET | `/api/inventory-transactions/history/:inventoryId` | getTransactionHistory | `INVENTORY_VIEW` | 200 `{data: Transaction[]}`. |

## Orders, picking, packing, delivery, notifications, reports

| Method | Endpoint | Handler | Permission | Request / response |
| --- | --- | --- | --- | --- |
| POST | `/api/orders` | createOrder | `ORDER_CREATE` | CreateOrder schema; 201 E(Order). |
| GET | `/api/orders` | getOrders | `ORDER_VIEW` | 200 E(Order array). |
| GET | `/api/orders/:id` | getOrderById | `ORDER_VIEW_DETAILS` | 200 E(Order with items). |
| POST | `/api/orders/:id/cancel` | cancelOrder | `ORDER_CANCEL` | No body; 200 E(Order) only from CREATED. |
| POST | `/api/picking` | createPickingTask | `PICKING_CREATE` | `{orderId,items,notes?}`; 201 E(task with items). |
| GET | `/api/picking` | getPickingTasks | `PICKING_VIEW` | 200 E(tasks with items). |
| GET | `/api/picking/:id` | getPickingTaskById | `PICKING_VIEW` | 200 E(task with items). |
| POST | `/api/picking/:id/assign` | assignPickingTask | `PICKING_ASSIGN` | `{pickerUserId}`; 200 E(task). |
| POST | `/api/picking/:id/start` | startPickingTask | `PICKING_START` | No body; 200 E(task). |
| POST | `/api/picking/:id/complete` | completePickingTask | `PICKING_COMPLETE` | `{notes?}`; 200 E(task). |
| PATCH | `/api/picking/:id/items/:itemId` | updatePickingItem | `PICKING_UPDATE_ITEM` | `{pickedQuantity}`; 200 E(item). |
| POST | `/api/packing` | createPackingTask | `PACKING_CREATE` | Raw `{orderId,pickingTaskId,notes?}`; 201 E(task). |
| GET | `/api/packing` | getPackingTasks | `PACKING_VIEW` | 200 E(task array). |
| GET | `/api/packing/:id` | getPackingTaskById | `PACKING_VIEW` | 200 E(task). |
| POST | `/api/packing/:id/assign` | assignPackingTask | `PACKING_ASSIGN` | Raw `{packerUserId}`; 200 E(task). |
| POST | `/api/packing/:id/start` | startPackingTask | `PACKING_START` | No body; 200 E(task). |
| POST | `/api/packing/:id/packages` | createPackage | `PACKING_CREATE_PACKAGE` | Raw `{weight?}`; 201 E(package). |
| POST | `/api/packing/:id/complete` | completePackingTask | `PACKING_COMPLETE` | Raw `{notes?}`; 200 E(task). |
| POST | `/api/delivery` | createDelivery | `DELIVERY_CREATE` | Raw `{orderId,packageId}`; 201 E(delivery). |
| GET | `/api/delivery` | getDeliveries | `DELIVERY_VIEW` | 200 E(delivery array). |
| GET | `/api/delivery/my-deliveries` | getMyDeliveries | `DELIVERY_VIEW` | 200 E(deliveries assigned to JWT user). |
| GET | `/api/delivery/:id` | getDeliveryById | `DELIVERY_VIEW` | 200 E(delivery). |
| POST | `/api/delivery/:id/assign` | assignDelivery | `DELIVERY_ASSIGN` | Raw `{deliveryBoyUserId}`; 200 E(delivery). |
| POST | `/api/delivery/:id/pickup` | pickupDelivery | `DELIVERY_PICKUP` | No body; 200 E(delivery). |
| POST | `/api/delivery/:id/out-for-delivery` | outForDelivery | `DELIVERY_OUT_FOR_DELIVERY` | No body; 200 E(delivery). |
| POST | `/api/delivery/:id/tracking` | addTracking | `DELIVERY_TRACKING` | Raw `{latitude?,longitude?,remarks?}`; 201 E(tracking). |
| POST | `/api/delivery/:id/delivered` | deliverDelivery | `DELIVERY_COMPLETE` | No body; 200 E(delivery). |
| POST | `/api/delivery/:id/failed` | failDelivery | `DELIVERY_FAIL` | Raw `{failureReason? or reason?}`; 200 E(delivery). |
| POST | `/api/delivery/:id/returned` | returnDelivery | `DELIVERY_RETURN` | Raw `{returnReason? or reason?}`; 200 E(delivery). |
| GET | `/api/notifications/me` | getMyNotifications | None | 200 E(current user's Notification array). |
| GET | `/api/notifications/me/unread` | getMyUnreadNotifications | None | 200 E(current user's unread Notification array). |
| PATCH | `/api/notifications/:id/read` | markNotificationAsRead | None | 200 E(current user's Notification). |
| POST | `/api/notifications` | createNotification | None | Notification schema; 201 E(Notification). |
| GET | `/api/reports/orders/summary` | getOrderSummary | None | Optional `fromDate`,`toDate` YYYY-MM-DD; 200 E(report). |

## Support aliases

These are separately mounted APIs, not redirects. They reuse existing handlers and permissions.

| Method | Endpoint | Permission | Reused handler |
| --- | --- | --- | --- |
| GET | `/api/support/orders` | `ORDER_VIEW` | getOrders |
| GET | `/api/support/orders/:id` | `ORDER_VIEW_DETAILS` | getOrderById |
| POST | `/api/support/orders/:id/cancel` | `ORDER_CANCEL` | cancelOrder |
| GET | `/api/support/deliveries` | `DELIVERY_VIEW` | getDeliveries |
| GET | `/api/support/deliveries/:id/tracking` | `DELIVERY_TRACKING` | getDeliveryTracking |
| GET | `/api/support/deliveries/:id` | `DELIVERY_VIEW` | getDeliveryById |
| GET | `/api/support/customers` | `CUSTOMER_VIEW` | getCustomers |
| GET | `/api/support/customers/:id` | `CUSTOMER_VIEW` | getCustomerById |
| PATCH | `/api/support/customers/:id` | `CUSTOMER_UPDATE` | updateCustomer; its controller validates the same update schema despite PATCH route. |

## Contract and implementation cautions

- Zod validators are applied to auth, order, customer, product, warehouse, zone, shelf, bin, inventory, inventory transactions, picking, notification, and report input. Active packing/delivery controllers do not import their validator files.
- All collection APIs are unpaginated; no generic list query contracts were found.
- Order, reservation, stock movement and several task/delivery services have status gates detailed in `WORKFLOW_STATUS_MATRIX.md`.
- Active repositories establish actual output casing. Warehouse, zone, shelf, bin, inventory, task, package and delivery rows commonly use PascalCase; orders/customers/products/notifications use camelCase mapping.
- `gatewayHandler`, gateway target settings, and `gatewayRequestLogger` are not mounted, so no proxy API is listed.

## Source files inspected

All `backend/src/routes/*.ts`, `backend/src/controllers/*.ts`, `backend/src/services/*.ts`, `backend/src/repositories/*.ts`, `backend/src/validators/*.ts`, `backend/src/domain/**/*.ts`, `backend/src/{app,server}.ts`, `backend/src/middleware/*.ts`, `backend/src/config/*.ts`, `backend/src/gateway/*.ts`, plus every checked-in SQL script and backend manifest/deployment file.
