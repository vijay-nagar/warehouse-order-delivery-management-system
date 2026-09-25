# Frontend Structure Migration: Before and After

Audit date: 2026-09-24  
Branch: `migration/app-layouts`  
Evidence: five approved audit documents, current working tree, `HEAD` comparison, import search, and route/API source review. This audit made no code changes.

## Verdict

**STRUCTURE MIGRATION: PASS WITH WARNINGS**

The source now follows the approved Feature-First Hybrid structure. Feature ownership is primary; `app/` owns shell and routing; `shared/` owns cross-feature technical code. Compatibility modules intentionally preserve old paths. No route, storage key, permission rule, workflow status, endpoint URL, or HTTP method change was found.

Warnings are deferred cleanup items: compatibility modules remain, `supportApi` remains in the legacy barrel, and backup/starter files remain under `src/`.

## Before Structure

```text
src/
  app/{config,router}
  layouts/{AdminLayout,AuthLayout}/
  components/{common,forms,tables,workflow}/
  features/<feature>/pages/
  hooks/
  permissions/
  services/{api,storage}/
  types/
  index.css
  assets/
  main.tsx
```

Important before facts:

- `services/api/backend.ts` owned every endpoint object.
- `services/api/{client,request,errors}.ts` owned transport.
- Auth storage, session hook, and auth types lived in cross-feature directories.
- Header, Sidebar, and ProtectedRoute lived in `components/common/`.
- Shared primitives, tables, and page templates shared `components/` directories.
- Feature pages already lived under `features/<feature>/pages/`.
- `src/index.css` was active global stylesheet.

## Current Structure

```text
src/
  app/
    config/env.ts
    layouts/{AdminLayout,AuthLayout,components/{Header,Sidebar}}
    providers/ToastProvider.tsx
    router/{index,ProtectedRoute}.tsx
  features/
    auth/{api,hooks,pages,storage,types.ts}
    customers/{api,pages}
    dashboard/{components,pages}
    delivery/{api,pages}
    inventory/{api,pages}
    notifications/{api,pages}
    orders/{api,pages}
    packing/{api,pages}
    picking/{api,pages}
    products/{api,pages}
    reports/{api,pages}
    system/{api,pages}
    warehouse/{api,pages}
  shared/
    api/{client,request,errors}.ts
    components/{feedback,forms,overlay,table}/
    hooks/
    page-templates/
    permissions/
    styles/index.css
    types/api.ts
  assets/
  main.tsx
```

Old top-level directories remain only as compatibility paths or intentionally retained files.

## File Migration Map

| Category | Before Path | After Path | Migration Type | Status |
| --- | --- | --- | --- | --- |
| App shell | `layouts/AdminLayout/AdminLayout.tsx` | `app/layouts/AdminLayout.tsx` | Move + default re-export | Complete |
| App shell | `layouts/AuthLayout/AuthLayout.tsx` | `app/layouts/AuthLayout.tsx` | Move + default re-export | Complete |
| App shell | `components/common/Header.tsx` | `app/layouts/components/Header.tsx` | Move + default re-export | Complete |
| App shell | `components/common/Sidebar.tsx` | `app/layouts/components/Sidebar.tsx` | Move + default re-export | Complete |
| Router | `components/common/ProtectedRoute.tsx` | `app/router/ProtectedRoute.tsx` | Move + default re-export | Complete |
| Router | `app/router/index.tsx` | `app/router/index.tsx` | Canonical imports updated | Complete |
| Provider | `components/common/Toast.tsx` | `app/providers/ToastProvider.tsx` | Move + named re-export | Complete |
| Config | `app/config/env.ts` | `app/config/env.ts` | Unchanged | Complete |
| Auth API | `services/api/backend.ts: authApi` | `features/auth/api/authApi.ts` | Extract + barrel export | Complete |
| Auth storage | `services/storage/authStorage.ts` | `features/auth/storage/authStorage.ts` | Move + star re-export | Complete |
| Session hook | `hooks/useSession.ts` | `features/auth/hooks/useSession.ts` | Move + named re-export | Complete |
| Auth types | `types/auth.ts` | `features/auth/types.ts` | Move + star re-export | Complete |
| Login page | `features/auth/pages/LoginPage.tsx` | Same path | Canonical imports updated | Complete |
| API transport | `services/api/client.ts` | `shared/api/client.ts` | Move + named re-export | Complete |
| API transport | `services/api/request.ts` | `shared/api/request.ts` | Move + named re-export | Complete |
| API transport | `services/api/errors.ts` | `shared/api/errors.ts` | Move + named re-export | Complete |
| API registry | `services/api/backend.ts` | Same path | Compatibility barrel; support API retained | Complete |
| Shared hooks | `hooks/useAsyncRequest.ts` | `shared/hooks/useAsyncRequest.ts` | Move + named re-export | Complete |
| Shared hooks | `hooks/useResourceList.ts` | `shared/hooks/useResourceList.ts` | Move + named re-export | Complete |
| Shared types | `types/api.ts` | `shared/types/api.ts` | Move + star re-export | Complete |
| Permissions | `permissions/access.ts` | `shared/permissions/access.ts` | Move + star re-export | Complete |
| Permissions | `permissions/PermissionGuard.tsx` | `shared/permissions/PermissionGuard.tsx` | Move + star re-export | Complete |
| Feedback | `components/common/AsyncStates.tsx` | `shared/components/feedback/AsyncStates.tsx` | Move + star re-export | Complete |
| Overlay | `components/common/Dialog.tsx` | `shared/components/overlay/Dialog.tsx` | Move + named re-export | Complete |
| Forms | `components/forms/FormField.tsx` | `shared/components/forms/FormField.tsx` | Move + named re-export | Complete |
| Tables | `components/tables/DataTable.tsx` | `shared/components/table/DataTable.tsx` | Move + star re-export | Complete |
| Tables | `components/tables/Pagination.tsx` | `shared/components/table/Pagination.tsx` | Move + named re-export | Complete |
| Page template | `components/tables/CrudResourcePage.tsx` | `shared/page-templates/CrudResourcePage.tsx` | Move + star re-export | Complete |
| Page template | `components/tables/ResourceTablePage.tsx` | `shared/page-templates/ResourceTablePage.tsx` | Move + default/star re-export | Complete |
| Page template | `components/workflow/WorkflowWorkspace.tsx` | `shared/page-templates/WorkflowWorkspace.tsx` | Move + star re-export | Complete |
| Styles | `index.css` | `shared/styles/index.css` | Move; old path imports canonical CSS | Complete |
| Customer API | `services/api/backend.ts: customersApi` | `features/customers/api/customersApi.ts` | Extract + barrel export | Complete |
| Product API | `services/api/backend.ts: productsApi` | `features/products/api/productsApi.ts` | Extract + barrel export | Complete |
| Warehouse APIs | `services/api/backend.ts: warehousesApi/zonesApi/shelvesApi/binsApi` | `features/warehouse/api/warehouseApi.ts` | Extract + barrel export | Complete |
| Inventory APIs | `services/api/backend.ts: inventoryApi/inventoryReservationApi/inventoryTransactionsApi` | `features/inventory/api/inventoryApi.ts` | Extract + barrel export | Complete |
| Order API | `services/api/backend.ts: ordersApi` | `features/orders/api/ordersApi.ts` | Extract + barrel export | Complete |
| Picking API | `services/api/backend.ts: pickingApi` | `features/picking/api/pickingApi.ts` | Extract + barrel export | Complete |
| Packing API | `services/api/backend.ts: packingApi` | `features/packing/api/packingApi.ts` | Extract + barrel export | Complete |
| Delivery API | `services/api/backend.ts: deliveryApi` | `features/delivery/api/deliveryApi.ts` | Extract + barrel export | Complete |
| Notification API | `services/api/backend.ts: notificationsApi` | `features/notifications/api/notificationsApi.ts` | Extract + barrel export | Complete |
| Reports API | `services/api/backend.ts: reportsApi` | `features/reports/api/reportsApi.ts` | Extract + barrel export | Complete |
| System API | `services/api/backend.ts: healthApi` | `features/system/api/healthApi.ts` | Extract + barrel export | Complete |
| Dashboard | `features/dashboard/*` | Same paths | Imports feature APIs directly | Complete |
| Feature pages | `features/*/pages/*` | Same paths | Imports canonical modules | Complete |

## Compatibility Files

| Old Path | Re-export / Forwarding Target | Why Retained | Safe Later? |
| --- | --- | --- | --- |
| `layouts/AdminLayout/AdminLayout.tsx` | `app/layouts/AdminLayout` | Preserve old default import | Yes, after import/dynamic-import audit |
| `layouts/AuthLayout/AuthLayout.tsx` | `app/layouts/AuthLayout` | Preserve old default import | Yes |
| `components/common/Header.tsx` | `app/layouts/components/Header` | Preserve old default import | Yes |
| `components/common/Sidebar.tsx` | `app/layouts/components/Sidebar` | Preserve old default import | Yes |
| `components/common/ProtectedRoute.tsx` | `app/router/ProtectedRoute` | Preserve old default import | Yes |
| `components/common/AsyncStates.tsx` | `shared/components/feedback/AsyncStates` | Preserve named primitive imports | Yes |
| `components/common/Dialog.tsx` | `shared/components/overlay/Dialog` | Preserve named import | Yes |
| `components/common/Toast.tsx` | `app/providers/ToastProvider` | Preserve provider and hook imports | Yes |
| `components/forms/FormField.tsx` | `shared/components/forms/FormField` | Preserve named import | Yes |
| `components/tables/DataTable.tsx` | `shared/components/table/DataTable` | Preserve type/component exports | Yes |
| `components/tables/Pagination.tsx` | `shared/components/table/Pagination` | Preserve named import | Yes |
| `components/tables/CrudResourcePage.tsx` | `shared/page-templates/CrudResourcePage` | Preserve template exports | Yes |
| `components/tables/ResourceTablePage.tsx` | `shared/page-templates/ResourceTablePage` | Preserve default and named exports | Yes |
| `components/workflow/WorkflowWorkspace.tsx` | `shared/page-templates/WorkflowWorkspace` | Preserve workflow template exports | Yes |
| `hooks/useAsyncRequest.ts` | `shared/hooks/useAsyncRequest` | Preserve named import | Yes |
| `hooks/useResourceList.ts` | `shared/hooks/useResourceList` | Preserve named import | Yes |
| `hooks/useSession.ts` | `features/auth/hooks/useSession` | Preserve named import | Yes |
| `permissions/access.ts` | `shared/permissions/access` | Preserve permission vocabulary import | Yes |
| `permissions/PermissionGuard.tsx` | `shared/permissions/PermissionGuard` | Preserve guard/action exports | Yes |
| `types/api.ts` | `shared/types/api` | Preserve type imports | Yes |
| `types/auth.ts` | `features/auth/types` | Preserve type imports | Yes |
| `services/storage/authStorage.ts` | `features/auth/storage/authStorage` | Preserve storage import | Yes |
| `services/api/client.ts` | `shared/api/client` | Preserve transport import | Yes |
| `services/api/request.ts` | `shared/api/request` | Preserve transport import | Yes |
| `services/api/errors.ts` | `shared/api/errors` | Preserve error import | Yes |
| `index.css` | `@import "./shared/styles/index.css"` | Preserve CSS entry import | Yes, after external-import audit |

`services/api/backend.ts` is not a pure re-export file. It is an intentional compatibility barrel and retains verified `supportApi` because no support feature exists.

## Import Verification

Canonical consumer examples found:

- Router imports `app/router/ProtectedRoute` and `app/layouts/*`.
- `main.tsx` imports `app/providers/ToastProvider` and `shared/styles/index.css`.
- Login imports `features/auth/api`, `storage`, and `types`.
- API client imports `features/auth/storage/authStorage`.
- Dashboard imports six feature API modules.
- Orders and inventory import `shared` feedback/hooks/types and their feature APIs.
- Picking, packing, delivery import `shared/page-templates/WorkflowWorkspace` and local API modules.
- Masters import `shared/page-templates/CrudResourcePage` and local APIs.

Repository search found no non-compatibility consumer importing old paths. Old-path matches are compatibility modules themselves. Internal `shared/*` relative imports are canonical, not legacy imports.

## Route Verification

Before and after route URLs are identical:

`/login`, `/`, `/orders`, `/warehouses`, `/zones`, `/shelves`, `/bins`, `/inventory`, `/picking`, `/packing`, `/delivery`, `/customers`, `/products`, `/notifications`, `/reports`, `/system`.

Before and after route shape is identical: public `/login` under `AuthLayout`; every other route remains under `ProtectedRoute`, then `AdminLayout`. Lazy page imports remain in `app/router/index.tsx`.

## API Verification

- Shared transport is now centralized in `shared/api/{client,request,errors}.ts`.
- Feature endpoint modules now live under their matching `features/<feature>/api/` folders.
- `services/api/backend.ts` re-exports every migrated API object and retains `supportApi`.
- Source comparison found no endpoint URL or HTTP method change in extracted APIs.
- `request()` still unwraps `{ success, data }`, otherwise returns raw response body.
- Axios still uses `env.apiBaseUrl`, JSON headers, Bearer token attachment, and clears auth/emits `warehouse:unauthorized` on `401`.

## Auth and Permission Verification

| Concern | Before | After | Changed? | Evidence |
| --- | --- | --- | --- | --- |
| Storage | `services/storage/authStorage.ts` | `features/auth/storage/authStorage.ts` | Location only | Same `warehouse_access_token`, `warehouse_user`, store precedence, expiry, clear behavior |
| Session | `hooks/useSession.ts` | `features/auth/hooks/useSession.ts` | Location only | Same storage and `warehouse:unauthorized` listeners |
| Route guard | `components/common/ProtectedRoute.tsx` | `app/router/ProtectedRoute.tsx` | Location only | Router nesting unchanged |
| Roles | `types/auth.ts`, `permissions/access.ts` | `features/auth/types.ts`, `shared/permissions/access.ts` | Location only | `hasRole()` still checks stored role list |
| Permissions | `permissions/access.ts` | `shared/permissions/access.ts` | No behavior change | `hasPermission()` remains fail-closed and returns `false` |

## Functionality Protection Matrix Comparison

| Area | Before | After | Changed? | Evidence |
| --- | --- | --- | --- | --- |
| Startup | `main.tsx`, old Toast/CSS paths | `main.tsx`, provider/styles canonical paths | Imports only | React Strict Mode, provider order, RouterProvider retained |
| Login contract | `authApi` in backend registry | `features/auth/api/authApi.ts` | Location only | Same `POST /api/auth/login` and response type |
| Auth persistence | Old storage path | Auth feature storage | Location only | Storage keys and algorithm unchanged |
| Expiry and 401 | Old session/client paths | Auth hook/shared client | Location only | Same expiry check, clear, event dispatch/listener |
| Protected routes | Common component path | Router component path | Location only | Same nested route branch |
| Role/permission policy | Old type/permission paths | Auth/shared paths | Location only | No role mapping added; permission helper still false |
| Dashboard | Feature page plus registry APIs | Feature page plus feature APIs | Imports only | Same page/component files and six APIs |
| Master pages | Feature pages plus shared CRUD template | Same pages plus canonical template/local APIs | Imports only | Page routes/actions unchanged |
| Inventory/orders | Feature workspace pages plus old shared/API paths | Same pages plus canonical shared/local API paths | Imports only | Validation, status checks, reload flow unchanged |
| Picking/packing/delivery | Feature pages plus workflow template/registry APIs | Same pages plus canonical template/local APIs | Imports only | Status/action configuration unchanged |
| Notifications/reports/system | Feature pages plus registry API | Same pages plus local API | Imports only | Existing load/retry/reload code unchanged |
| Dialog/toast/feedback/tables | Old component paths | Shared/provider paths | Location only | Component bodies moved unchanged |
| Global styles | `index.css` | `shared/styles/index.css` | Location only | `main.tsx` imports canonical stylesheet; old CSS path forwards |
| Workflow statuses and payloads | Feature/template code | Same code at canonical paths | No | Protection matrix conditions remain present; no status literals changed |

## Added, Moved, Retained, Deleted

### Added canonical files

- `app/layouts/**`, `app/providers/ToastProvider.tsx`, `app/router/ProtectedRoute.tsx`
- `shared/api/**`, `shared/components/**`, `shared/hooks/**`, `shared/page-templates/**`, `shared/permissions/**`, `shared/styles/index.css`, `shared/types/api.ts`
- `features/auth/{api,hooks,storage,types.ts}`
- `features/{customers,delivery,inventory,notifications,orders,packing,picking,products,reports,system,warehouse}/api/**`

### Moved

Every file listed in File Migration Map moved to its canonical path. Feature pages themselves stayed in their feature folders; imports changed only.

### Retained compatibility copies

All files in Compatibility Files remain. They are small forwarders, except `services/api/backend.ts`.

### Unmigrated or intentionally unchanged

| File / area | Reason |
| --- | --- |
| `app/config/env.ts` | Already canonical |
| `app/router/index.tsx` | Already canonical router owner; imports only changed |
| `features/*/pages/*` | Already feature-owned; no route/page rename needed |
| `features/dashboard/components/*` | Already dashboard-owned |
| `assets/*` | Already under target asset directory; no reference cleanup in this migration |
| `src/App.css` | Unused starter stylesheet; cleanup deferred |
| `DashboardPage.backup.tsx` | Backup remains under compile tree; cleanup deferred |
| `index.css.before-dashboard-design.css`, `index.css.dark-backup` | Backup styles remain; cleanup deferred |
| `utils/` | Empty; no replacement needed |
| `supportApi` in backend barrel | Verified API has no matching support feature or routed page |

### Deleted

No application file deleted. Old paths were replaced by forwarders.

## Structural Issues

1. `supportApi` remains in `services/api/backend.ts`; it lacks feature ownership because no support feature exists.
2. Backup/starter files remain in `src/`, including compiled/linted `DashboardPage.backup.tsx`.
3. Compatibility forwarders trigger Fast Refresh lint advisories. They are expected during compatibility period, not migration failures.
4. Approved target proposed optional `routeDefinitions.tsx`, `bootstrap.tsx`, and split style files. They were not created because current files remain small and migration scope forbids redesign.

## Final Summary

Migration moved app shell, auth ownership, shared infrastructure, reusable UI, active styles, and routed-feature APIs into approved canonical locations. Feature pages and route URLs did not change. Auth storage keys, token handling, permissions, workflow status rules, API contracts, request behavior, and mutation reload behavior did not change.

Compatibility forwarders remain intentionally. Later cleanup needs a separate import and dynamic-import audit, build/lint check, then reviewed deletion of forwarders and backup/starter files.
