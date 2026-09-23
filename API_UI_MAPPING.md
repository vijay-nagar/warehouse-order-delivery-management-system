# API to UI mapping

Audit date: 2026-09-23. This maps every verified mounted backend API to active frontend call sites. “None” means no active frontend function, hook, page, or action was found. No custom hooks exist; hook entries name built-in hooks only. A row containing several endpoints has the same mapping for each literal endpoint listed.

Role requirements are not inferred from endpoint names. Permission-enforced routes require a database role that has the listed permission; there are no named-role route guards. See `ROLES_PERMISSIONS_MATRIX.md`.

| Endpoint | HTTP method | Frontend API function | Hook | Page | UI action | Role | Permission | Status requirement |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/health` | GET | `SystemPage.loadSystemData -> api.get<HealthResponse>` | `useEffect`, `useState` | SystemPage | Initial load / Refresh | Public | None | None |
| `/api/health` | GET | None | None | None | Uncovered | Public | None | None |
| `/api/auth/login` | POST | `LoginPage.handleSubmit -> api.post<LoginResponse>` | `useState`, `useNavigate`, `useLocation` | LoginPage | Sign in | Public | None | Active user and valid password |
| `/api/auth/me` | GET | None | None | None | Uncovered | DB role grant | `AUTH_VIEW_PROFILE` | Valid JWT |
| `/api/orders` | GET | `ResourceTablePage.loadData`; `DashboardPage.loadDashboard` | `useEffect`, local state; Dashboard `useMemo` | OrdersPage; DashboardPage | Load / refresh / retry; local filter, page, CSV | DB role grant | `ORDER_VIEW` | None |
| `/api/orders` | POST | None | None | None | Uncovered | DB role grant | `ORDER_CREATE` | Active products exist |
| `/api/orders/:id` | GET | None | None | None | Uncovered | DB role grant | `ORDER_VIEW_DETAILS` | Existing order |
| `/api/orders/:id/cancel` | POST | None | None | None | Uncovered | DB role grant | `ORDER_CANCEL` | Order `CREATED` |
| `/api/warehouses` | GET | `ResourceTablePage.loadData` | `useEffect`, local state | WarehousePage | Load / refresh / retry; local filter, page, CSV | DB role grant | `WAREHOUSE_VIEW` | None |
| `/api/warehouses`<br>`/api/zones`<br>`/api/shelves`<br>`/api/bins` | POST | None | None | None | All uncovered | DB role grant | `WAREHOUSE_CREATE` | Parent-existence checks for zone/shelf/bin; no active-parent check |
| `/api/warehouses/:id`<br>`/api/zones/:id`<br>`/api/shelves/:id`<br>`/api/bins/:id` | GET | None | None | None | All uncovered | DB role grant | `WAREHOUSE_VIEW` | Existing record |
| `/api/warehouses/:id`<br>`/api/zones/:id`<br>`/api/shelves/:id`<br>`/api/bins/:id` | PUT | None | None | None | All uncovered | DB role grant | `WAREHOUSE_UPDATE` | Existing record |
| `/api/warehouses/:id/status`<br>`/api/zones/:id/status`<br>`/api/shelves/:id/status`<br>`/api/bins/:id/status` | PATCH | None | None | None | All uncovered | DB role grant | `WAREHOUSE_STATUS_UPDATE` | Existing record; `isActive` boolean |
| `/api/zones`<br>`/api/shelves`<br>`/api/bins` | GET | None | None | None | Uncovered; no page for hierarchy resources | DB role grant | `WAREHOUSE_VIEW` | None |
| `/api/inventory` | GET | `ResourceTablePage.loadData`; `DashboardPage.loadDashboard` | `useEffect`, local state; Dashboard `useMemo` | InventoryPage; DashboardPage | Load / refresh / retry; local filter, page, CSV | DB role grant | `INVENTORY_VIEW` | None |
| `/api/inventory` | POST | None | None | None | Uncovered | DB role grant | `INVENTORY_CREATE` | Warehouse/product exist; no active check |
| `/api/inventory/:id` | GET | None | None | None | Uncovered | DB role grant | `INVENTORY_VIEW` | Existing record |
| `/api/inventory/:id` | PUT | None | None | None | Uncovered | DB role grant | `INVENTORY_UPDATE` | Existing record; merged reserved <= available |
| `/api/inventory/:id/status` | PATCH | None | None | None | Uncovered | DB role grant | `INVENTORY_STATUS_UPDATE` | Existing record |
| `/api/inventory/reservations/:orderId`<br>`/api/inventory-reservation/:orderId` | POST | None | None | None | Both uncovered | DB role grant | `INVENTORY_UPDATE` | Order `CREATED`, warehouse/items present, active stock sufficient |
| `/api/inventory-transactions/stock-in`<br>`/api/inventory-transactions/stock-out`<br>`/api/inventory-transactions/adjustment` | POST | None | None | None | All uncovered | DB role grant | `INVENTORY_UPDATE` | Active inventory; stock-out requires enough available stock; adjustment value > 0 |
| `/api/inventory-transactions/history/:inventoryId` | GET | None | None | None | Uncovered | DB role grant | `INVENTORY_VIEW` | Valid inventory ID only; no existence check in service |
| `/api/picking` | GET | `ResourceTablePage.loadData`; `DashboardPage.loadDashboard` | `useEffect`, local state; Dashboard `useMemo` | PickingPage; DashboardPage | Load / refresh / retry; local filter, page, CSV | DB role grant | `PICKING_VIEW` | None |
| `/api/picking` | POST | None | None | None | Uncovered | DB role grant | `PICKING_CREATE` | No active task for order except completed/cancelled |
| `/api/picking/:id` | GET | None | None | None | Uncovered | DB role grant | `PICKING_VIEW` | Existing task |
| `/api/picking/:id/assign` | POST | None | None | None | Uncovered | DB role grant | `PICKING_ASSIGN` | Task `PENDING` |
| `/api/picking/:id/start` | POST | None | None | None | Uncovered | DB role grant | `PICKING_START` | Task `ASSIGNED` |
| `/api/picking/:id/complete` | POST | None | None | None | Uncovered | DB role grant | `PICKING_COMPLETE` | Task `PICKING`; all items fully picked |
| `/api/picking/:id/items/:itemId` | PATCH | None | None | None | Uncovered | DB role grant | `PICKING_UPDATE_ITEM` | Task `PICKING`; item belongs to task |
| `/api/packing` | GET | `ResourceTablePage.loadData`; `DashboardPage.loadDashboard` | `useEffect`, local state; Dashboard `useMemo` | PackingPage; DashboardPage | Load / refresh / retry; local filter, page, CSV | DB role grant | `PACKING_VIEW` | None |
| `/api/packing` | POST | None | None | None | Uncovered | DB role grant | `PACKING_CREATE` | No picking/order status check |
| `/api/packing/:id` | GET | None | None | None | Uncovered | DB role grant | `PACKING_VIEW` | Existing task |
| `/api/packing/:id/assign` | POST | None | None | None | Uncovered | DB role grant | `PACKING_ASSIGN` | Task `PENDING` |
| `/api/packing/:id/start` | POST | None | None | None | Uncovered | DB role grant | `PACKING_START` | Task `ASSIGNED` |
| `/api/packing/:id/packages` | POST | None | None | None | Uncovered | DB role grant | `PACKING_CREATE_PACKAGE` | Task `PACKING` |
| `/api/packing/:id/complete` | POST | None | None | None | Uncovered | DB role grant | `PACKING_COMPLETE` | Task `PACKING`; at least one package |
| `/api/delivery` | GET | `ResourceTablePage.loadData`; `DashboardPage.loadDashboard` | `useEffect`, local state; Dashboard `useMemo` | DeliveryPage; DashboardPage | Load / refresh / retry; local filter, page, CSV | DB role grant | `DELIVERY_VIEW` | None |
| `/api/delivery` | POST | None | None | None | Uncovered | DB role grant | `DELIVERY_CREATE` | Package/task readiness and no active delivery for package |
| `/api/delivery/my-deliveries` | GET | None | None | None | Uncovered | DB role grant | `DELIVERY_VIEW` | DeliveryBoyUserId equals JWT userId |
| `/api/delivery/:id` | GET | None | None | None | Uncovered | DB role grant | `DELIVERY_VIEW` | Existing delivery |
| `/api/delivery/:id/assign` | POST | None | None | None | Uncovered | DB role grant | `DELIVERY_ASSIGN` | `PENDING` |
| `/api/delivery/:id/pickup` | POST | None | None | None | Uncovered | DB role grant | `DELIVERY_PICKUP` | `ASSIGNED` |
| `/api/delivery/:id/out-for-delivery` | POST | None | None | None | Uncovered | DB role grant | `DELIVERY_OUT_FOR_DELIVERY` | `PICKED_UP` |
| `/api/delivery/:id/tracking` | POST | None | None | None | Uncovered | DB role grant | `DELIVERY_TRACKING` | `PICKED_UP` or `OUT_FOR_DELIVERY` |
| `/api/delivery/:id/delivered` | POST | None | None | None | Uncovered | DB role grant | `DELIVERY_COMPLETE` | `OUT_FOR_DELIVERY` |
| `/api/delivery/:id/failed` | POST | None | None | None | Uncovered | DB role grant | `DELIVERY_FAIL` | `PICKED_UP` or `OUT_FOR_DELIVERY` |
| `/api/delivery/:id/returned` | POST | None | None | None | Uncovered | DB role grant | `DELIVERY_RETURN` | `FAILED` |
| `/api/customers` | GET | `ResourceTablePage.loadData` | `useEffect`, local state | CustomersPage | Load / refresh / retry; local filter, page, CSV | DB role grant | `CUSTOMER_VIEW` | Active customers only |
| `/api/customers` | POST | None | None | None | Uncovered | DB role grant | `CUSTOMER_CREATE` | Customer details valid |
| `/api/customers/:id` | GET | None | None | None | Uncovered | DB role grant | `CUSTOMER_VIEW` | Active customer |
| `/api/customers/:id` | PUT | None | None | None | Uncovered | DB role grant | `CUSTOMER_UPDATE` | Active customer |
| `/api/customers/:id` | DELETE | None | None | None | Uncovered | DB role grant | `CUSTOMER_DELETE` | Active customer |
| `/api/products` | GET | `ResourceTablePage.loadData` | `useEffect`, local state | ProductsPage | Load / refresh / retry; local filter, page, CSV | DB role grant | `PRODUCT_VIEW` | Active products only |
| `/api/products` | POST | None | None | None | Uncovered | DB role grant | `PRODUCT_CREATE` | Valid product and unique active SKU precheck |
| `/api/products/:id` | GET | None | None | None | Uncovered | DB role grant | `PRODUCT_VIEW` | Active product |
| `/api/products/:id` | PUT | None | None | None | Uncovered | DB role grant | `PRODUCT_UPDATE` | Active product |
| `/api/products/:id` | DELETE | None | None | None | Uncovered | DB role grant | `PRODUCT_DELETE` | Active product |
| `/api/notifications/me` | GET | `NotificationsPage.loadNotifications -> api.get` | `useEffect`, `useState` | NotificationsPage | Load / Refresh | Any authenticated user | None | JWT user's notifications |
| `/api/notifications/me/unread` | GET | None | None | None | Uncovered | Any authenticated user | None | JWT user's unread notifications |
| `/api/notifications/:id/read` | PATCH | `NotificationsPage.markAsRead -> api.patch` | `useState` | NotificationsPage | Mark as Read | Any authenticated user | None | Notification must be owned by JWT user |
| `/api/notifications` | POST | None | None | None | Uncovered | Any authenticated user | None | Valid notification body; submitted recipient not authorization-checked |
| `/api/reports/orders/summary` | GET | `ReportsPage.loadReport`; `DashboardPage.loadDashboard` | `useEffect`, `useState`; Dashboard `useMemo` | ReportsPage; DashboardPage | Load / Refresh; no date UI | Any authenticated user | None | Optional date format/order validation |
| `/api/support/orders` | GET | None | None | None | Uncovered alias | DB role grant | `ORDER_VIEW` | None |
| `/api/support/orders/:id` | GET | None | None | None | Uncovered alias | DB role grant | `ORDER_VIEW_DETAILS` | Existing order |
| `/api/support/orders/:id/cancel` | POST | None | None | None | Uncovered alias | DB role grant | `ORDER_CANCEL` | `CREATED` |
| `/api/support/deliveries` | GET | None | None | None | Uncovered alias | DB role grant | `DELIVERY_VIEW` | None |
| `/api/support/deliveries/:id/tracking` | GET | None | None | None | Uncovered alias | DB role grant | `DELIVERY_TRACKING` | Existing delivery |
| `/api/support/deliveries/:id` | GET | None | None | None | Uncovered alias | DB role grant | `DELIVERY_VIEW` | Existing delivery |
| `/api/support/customers` | GET | None | None | None | Uncovered alias | DB role grant | `CUSTOMER_VIEW` | Active customers only |
| `/api/support/customers/:id` | GET | None | None | None | Uncovered alias | DB role grant | `CUSTOMER_VIEW` | Active customer |
| `/api/support/customers/:id` | PATCH | None | None | None | Uncovered alias | DB role grant | `CUSTOMER_UPDATE` | Active customer |

## Coverage total and important mismatches

Active frontend calls cover 13 mounted method/path pairs: login, health, eight module-list endpoints, five Dashboard list/report calls with overlapping endpoints, reports summary, notifications list, and mark-as-read. All other mounted APIs are uncovered by active UI.

Coverage does not establish correct rendering. WarehousePage field names do not match its API response; CustomersPage/ProductsPage request a nonexistent `status`; InventoryPage has a duplicate column key. Dashboard needs all six requests to succeed and uses locally invented/non-source status labels for some aggregate logic. These observations are UI defects, not evidence of new backend requirements.
