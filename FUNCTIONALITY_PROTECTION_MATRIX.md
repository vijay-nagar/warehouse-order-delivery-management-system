# Functionality Protection Matrix

This matrix identifies what must remain stable during a frontend-only structure migration. It records observed source behavior, not new product requirements.

## Application shell, authentication, and authorization

| Capability | Current source owner | Observable contract | Migration protection | Verification |
| --- | --- | --- | --- | --- |
| Application startup | `main.tsx` | React Strict Mode wraps `ToastProvider` and `RouterProvider`; `index.css` is global entry CSS. | Preserve provider order and global CSS import. | Build and load `/login`. |
| Public login | `features/auth/pages/LoginPage.tsx`, `authApi.login` | `POST /api/auth/login`; username/password are submitted and response token/user persisted. | Preserve request body, safe errors, and redirect-from behavior. | Test only with an authorized test account. |
| Auth persistence | `services/storage/authStorage.ts` | Uses `warehouse_access_token` and `warehouse_user` in local or session storage. | Do not rename keys or alter local/session precedence during a location-only migration. | Login, reload, logout, and browser-session behavior. |
| Token expiry | `authStorage.isAccessTokenExpired`, `hooks/useSession.ts` | Decodes JWT expiry locally and clears invalid/expired storage. | Keep expiry check and cleanup event behavior intact. | Seed expired test token or use a test token. |
| 401 handling | `services/api/client.ts` | Axios interceptor clears auth and emits `warehouse:unauthorized`. | Retain interceptor before moving API modules. | Cause a safe authenticated 401 in test environment. |
| Protected routes | `components/common/ProtectedRoute.tsx`, router | All shell routes are nested under `ProtectedRoute`. | Keep route nesting and login redirect state. | Navigate to protected URL while signed out. |
| Roles | `types/auth.ts`, `permissions/access.ts`, `Sidebar.tsx` | Stored role names can be read; no current route/nav entry supplies role restrictions. | Do not introduce inferred role mappings. | Source review and backend contract review. |
| Permissions | `permissions/access.ts`, `PermissionGuard.tsx` | Permission name union exists; `hasPermission()` is fail-closed because effective permissions are absent. | Do not turn it into guessed role grants or remove server authorization assumptions. | Compile and verify no permission mapping was introduced. |

## Routes and feature pages

| Route | Routed page | API/service dependencies | Preserve during migration |
| --- | --- | --- | --- |
| `/login` | `LoginPage` | `authApi.login`, auth storage | Form submit, safe errors, redirect state. |
| `/` | `DashboardPage` | Orders, inventory, picking, packing, delivery, reports APIs | Six-call dashboard load, refresh, aggregate rendering. |
| `/orders` | `OrdersPage` → `OrderWorkspacePage` | `ordersApi` | List/detail/create/cancel and `CREATED` cancel visibility. |
| `/warehouses` | `WarehousePage` | `warehousesApi`, `CrudResourcePage` | List/detail/create/update/status update. |
| `/zones` | `ZonesPage` | `zonesApi`, `CrudResourcePage` | List/detail/create/update/status update. |
| `/shelves` | `ShelvesPage` | `shelvesApi`, `CrudResourcePage` | List/detail/create/update/status update. |
| `/bins` | `BinsPage` | `binsApi`, `CrudResourcePage` | List/detail/create/update/status update. |
| `/inventory` | `InventoryPage` → `InventoryWorkspacePage` | Inventory, reservation, transaction APIs | List, reserve, stock in/out, adjustment, history, refetch after mutation. |
| `/picking` | `PickingPage` | `pickingApi`, `WorkflowWorkspace` | Status-specific assign/start/update-item/complete actions. |
| `/packing` | `PackingPage` | `packingApi`, `WorkflowWorkspace` | Status-specific assign/start/create-package/complete actions. |
| `/delivery` | `DeliveryPage` | `deliveryApi`, `WorkflowWorkspace` | Status-specific assignment, tracking, completion, failure, return actions. |
| `/customers` | `CustomersPage` | `customersApi`, `CrudResourcePage` | CRUD/deactivate flow. |
| `/products` | `ProductsPage` | `productsApi`, `CrudResourcePage` | CRUD/deactivate flow. |
| `/notifications` | `NotificationsPage` | `notificationsApi` | Mine list, mark-read, reload after mutation. |
| `/reports` | `ReportsPage` | `reportsApi` | Summary load/refresh and report rendering. |
| `/system` | `SystemPage` | `healthApi.health` | Health load/retry and display. |

## API layer and request invariants

| Layer | Current files | Protection rule |
| --- | --- | --- |
| HTTP client | `services/api/client.ts` | Preserve base URL from `app/config/env.ts`, JSON header, Bearer attachment, and response interceptor. |
| Envelope handling | `services/api/request.ts` | Preserve unwrapping of `{ success, data }`; controllers with non-envelope responses rely on the fallback body. |
| Safe errors | `services/api/errors.ts` | Preserve generic messaging for 401, 403, 429, and 500; do not surface raw server exceptions. |
| API inventory | `services/api/backend.ts` | Preserve existing exported API object names as compatibility exports until every importer migrates. |
| Generic responses | `types/api.ts` | Do not narrow `ResourceRow` without verified response-shape evidence. |

## Workflow state protections

The following visibility checks are source-backed frontend guards. They supplement, but do not replace, backend authorization and workflow validation.

| Feature | Action | UI status condition | Payload safeguards |
| --- | --- | --- | --- |
| Orders | Cancel | `CREATED` | Confirmation before request; reload/detail refresh after success. |
| Inventory | Stock in/out/adjustment | No local inventory-status gate | Positive whole quantity; request completion followed by list reload. |
| Inventory | Reserve | No local order-status gate | Positive whole order ID; request completion followed by list reload. |
| Picking | Assign | `PENDING` | Positive picker user ID. |
| Picking | Start | `ASSIGNED` | No request body. |
| Picking | Update item | `PICKING` | Positive item ID; integer picked quantity of zero or more. |
| Picking | Complete | `PICKING` | Notes capped at 1000 characters. |
| Packing | Assign | `PENDING` | Positive packer user ID. |
| Packing | Start | `ASSIGNED` | No request body. |
| Packing | Create package | `PACKING` | Optional positive weight. |
| Packing | Complete | `PACKING` | Notes capped at 1000 characters. |
| Delivery | Assign | `PENDING` | Positive delivery user ID. |
| Delivery | Pickup | `ASSIGNED` | No request body. |
| Delivery | Out for delivery | `PICKED_UP` | No request body. |
| Delivery | Tracking | `PICKED_UP` or `OUT_FOR_DELIVERY` | Latitude -90..90, longitude -180..180, remarks max 500. |
| Delivery | Deliver | `OUT_FOR_DELIVERY` | No request body. |
| Delivery | Fail | `PICKED_UP` or `OUT_FOR_DELIVERY` | Required failure reason max 1000; confirmation. |
| Delivery | Return | `FAILED` | Required return reason max 1000; confirmation. |

## Shared UI and visual protections

| Component | Current location | Behavior to retain |
| --- | --- | --- |
| Dialog | `components/common/Dialog.tsx` | Modal semantics, click-outside close, Escape close, focus restoration/trapping, responsive height. |
| Toast | `components/common/Toast.tsx` | Four-second visible feedback and `aria-live` region. |
| Async states | `components/common/AsyncStates.tsx` | Loading, empty, retryable error, and status badge output. |
| Header and Sidebar | `components/common/` | Logout, role display, responsive drawer, active route links. |
| Table primitives | `components/tables/` | Responsive horizontal overflow, pagination behavior, current labels and key selection. |
| Global styles | `index.css` | Existing class names, responsive breakpoints, focus-visible styling, mobile actions/forms. |

## Tests and checkpoints

| Checkpoint | Current availability | Protection action |
| --- | --- | --- |
| Type checking | Included in `npm.cmd run build` through `tsc -b` | Required after every migration commit. |
| Production bundle | `npm.cmd run build` | Required after every migration commit. |
| Lint | `npm.cmd run lint` | Record pre-existing warnings; avoid adding new warnings. |
| Automated tests | No `test` script in `frontend/package.json` | Do not claim automated test coverage. Add tests only in a separately approved effort. |
| Public integration | `/health` available | Read-only health check can confirm backend reachability. |
| Authenticated integration | Requires valid test account and disposable data | Never mutate operational records to validate a structure-only migration. |
| Visual regression | No visual test tooling found | Manually inspect desktop, tablet, and mobile layouts after CSS/layout moves. |

## Known boundaries that migration must not conceal

- The current frontend has no verified role-to-page or permission-to-action mapping.
- The backend API inventory documents endpoints without suitable UI, including user/role/permission administration, reservation lookup, package listing/details, several support routes, and server-side query/export capabilities.
- The dashboard contains status aggregation logic and client-side data shaping. Its behavior must be preserved or separately audited; a file move is not an opportunity to introduce new status rules.
- Backup and template files are currently part of the compile/lint source tree. Their removal is a separate behavior/tooling change, even if they are not routed.
