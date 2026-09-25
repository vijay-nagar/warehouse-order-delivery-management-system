# Frontend Structure Before and After

## 1. Architecture Change Overview

**Before:** Feature pages were already grouped by domain, but application shell, authentication, shared UI, hooks, permissions, types, and API modules were spread across top-level `layouts/`, `components/`, `hooks/`, `permissions/`, `services/`, and `types/`. One `services/api/backend.ts` file owned nearly every endpoint.

**After:** Feature-First Hybrid architecture. `app/` owns application shell and routing. `features/` owns domain pages and feature API modules. `shared/` owns reusable infrastructure and UI primitives. Compatibility forwarders preserve old imports during the transition.

Main difference: ownership is explicit. Domain endpoint modules sit with their feature; cross-feature code has one shared location; shell code sits under `app/`.

## 2. Complete Before Structure

```text
src/
├── app/
│   ├── config/env.ts
│   └── router/index.tsx
├── assets/
│   ├── hero.png
│   ├── react.svg
│   └── vite.svg
├── components/
│   ├── common/
│   │   ├── AsyncStates.tsx
│   │   ├── Dialog.tsx
│   │   ├── Header.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── Sidebar.tsx
│   │   └── Toast.tsx
│   ├── forms/FormField.tsx
│   ├── tables/
│   │   ├── CrudResourcePage.tsx
│   │   ├── DataTable.tsx
│   │   ├── Pagination.tsx
│   │   └── ResourceTablePage.tsx
│   └── workflow/WorkflowWorkspace.tsx
├── features/
│   └── <feature>/pages/
├── hooks/
│   ├── useAsyncRequest.ts
│   ├── useResourceList.ts
│   └── useSession.ts
├── layouts/
│   ├── AdminLayout/AdminLayout.tsx
│   └── AuthLayout/AuthLayout.tsx
├── permissions/
│   ├── access.ts
│   └── PermissionGuard.tsx
├── services/
│   ├── api/{backend,client,errors,request}.ts
│   └── storage/authStorage.ts
├── types/{api,auth}.ts
├── App.css
├── index.css
├── index.css.before-dashboard-design.css
├── index.css.dark-backup
└── main.tsx
```

## 3. Complete After Structure

```text
src/
├── app/
│   ├── config/env.ts
│   ├── layouts/
│   │   ├── AdminLayout.tsx
│   │   ├── AuthLayout.tsx
│   │   └── components/{Header,Sidebar}.tsx
│   ├── providers/ToastProvider.tsx
│   └── router/{index,ProtectedRoute}.tsx
├── features/
│   ├── auth/
│   │   ├── api/authApi.ts
│   │   ├── hooks/useSession.ts
│   │   ├── pages/LoginPage.tsx
│   │   ├── storage/authStorage.ts
│   │   └── types.ts
│   ├── customers/{api/customersApi.ts,pages/CustomersPage.tsx}
│   ├── dashboard/{components/,pages/{DashboardPage,DashboardPage.backup}.tsx}
│   ├── delivery/{api/deliveryApi.ts,pages/DeliveryPage.tsx}
│   ├── inventory/{api/inventoryApi.ts,pages/{InventoryPage,InventoryWorkspacePage}.tsx}
│   ├── notifications/{api/notificationsApi.ts,pages/NotificationsPage.tsx}
│   ├── orders/{api/ordersApi.ts,pages/{OrdersPage,OrderWorkspacePage}.tsx}
│   ├── packing/{api/packingApi.ts,pages/PackingPage.tsx}
│   ├── picking/{api/pickingApi.ts,pages/PickingPage.tsx}
│   ├── products/{api/productsApi.ts,pages/ProductsPage.tsx}
│   ├── reports/{api/reportsApi.ts,pages/ReportsPage.tsx}
│   ├── system/{api/healthApi.ts,pages/SystemPage.tsx}
│   └── warehouse/{api/warehouseApi.ts,pages/{WarehousePage,ZonesPage,ShelvesPage,BinsPage}.tsx}
├── shared/
│   ├── api/{client,errors,request}.ts
│   ├── components/
│   │   ├── feedback/AsyncStates.tsx
│   │   ├── forms/FormField.tsx
│   │   ├── overlay/Dialog.tsx
│   │   └── table/{DataTable,Pagination}.tsx
│   ├── hooks/{useAsyncRequest,useResourceList}.ts
│   ├── page-templates/{CrudResourcePage,ResourceTablePage,WorkflowWorkspace}.tsx
│   ├── permissions/{access,PermissionGuard}.ts(x)
│   ├── styles/index.css
│   └── types/api.ts
├── assets/{hero.png,react.svg,vite.svg}
└── main.tsx
```

Old paths still exist as compatibility files. They are not canonical ownership locations.

## 4. Before to After File Migration Map

| Before | After | What Changed | Status |
| --- | --- | --- | --- |
| `layouts/AdminLayout/AdminLayout.tsx` | `app/layouts/AdminLayout.tsx` | Shell layout moved | Complete |
| `layouts/AuthLayout/AuthLayout.tsx` | `app/layouts/AuthLayout.tsx` | Shell layout moved | Complete |
| `components/common/Header.tsx` | `app/layouts/components/Header.tsx` | Shell component moved | Complete |
| `components/common/Sidebar.tsx` | `app/layouts/components/Sidebar.tsx` | Shell component moved | Complete |
| `components/common/ProtectedRoute.tsx` | `app/router/ProtectedRoute.tsx` | Route guard moved | Complete |
| `components/common/Toast.tsx` | `app/providers/ToastProvider.tsx` | Provider and hook moved | Complete |
| `services/storage/authStorage.ts` | `features/auth/storage/authStorage.ts` | Auth persistence moved | Complete |
| `hooks/useSession.ts` | `features/auth/hooks/useSession.ts` | Auth session hook moved | Complete |
| `types/auth.ts` | `features/auth/types.ts` | Auth contract moved | Complete |
| `services/api/backend.ts: authApi` | `features/auth/api/authApi.ts` | Auth API extracted | Complete |
| `services/api/client.ts` | `shared/api/client.ts` | Axios transport moved | Complete |
| `services/api/request.ts` | `shared/api/request.ts` | Request/envelope transport moved | Complete |
| `services/api/errors.ts` | `shared/api/errors.ts` | Safe error mapper moved | Complete |
| `services/api/backend.ts` | Same path | Converted to compatibility barrel; keeps `supportApi` | Complete |
| `hooks/useAsyncRequest.ts` | `shared/hooks/useAsyncRequest.ts` | Shared hook moved | Complete |
| `hooks/useResourceList.ts` | `shared/hooks/useResourceList.ts` | Shared hook moved | Complete |
| `types/api.ts` | `shared/types/api.ts` | Shared API types moved | Complete |
| `permissions/access.ts` | `shared/permissions/access.ts` | Permission vocabulary moved | Complete |
| `permissions/PermissionGuard.tsx` | `shared/permissions/PermissionGuard.tsx` | Guard moved | Complete |
| `components/common/AsyncStates.tsx` | `shared/components/feedback/AsyncStates.tsx` | Feedback primitives moved | Complete |
| `components/common/Dialog.tsx` | `shared/components/overlay/Dialog.tsx` | Overlay primitive moved | Complete |
| `components/forms/FormField.tsx` | `shared/components/forms/FormField.tsx` | Form primitive moved | Complete |
| `components/tables/DataTable.tsx` | `shared/components/table/DataTable.tsx` | Table primitive moved | Complete |
| `components/tables/Pagination.tsx` | `shared/components/table/Pagination.tsx` | Table primitive moved | Complete |
| `components/tables/CrudResourcePage.tsx` | `shared/page-templates/CrudResourcePage.tsx` | Page template moved | Complete |
| `components/tables/ResourceTablePage.tsx` | `shared/page-templates/ResourceTablePage.tsx` | Page template moved | Complete |
| `components/workflow/WorkflowWorkspace.tsx` | `shared/page-templates/WorkflowWorkspace.tsx` | Workflow template moved | Complete |
| `index.css` | `shared/styles/index.css` | Active global stylesheet moved | Complete |
| `backend.ts: customersApi` | `features/customers/api/customersApi.ts` | Feature API extracted | Complete |
| `backend.ts: productsApi` | `features/products/api/productsApi.ts` | Feature API extracted | Complete |
| `backend.ts: warehousesApi/zonesApi/shelvesApi/binsApi` | `features/warehouse/api/warehouseApi.ts` | Warehouse APIs extracted | Complete |
| `backend.ts: inventory*` | `features/inventory/api/inventoryApi.ts` | Inventory APIs extracted | Complete |
| `backend.ts: ordersApi` | `features/orders/api/ordersApi.ts` | Feature API extracted | Complete |
| `backend.ts: pickingApi` | `features/picking/api/pickingApi.ts` | Feature API extracted | Complete |
| `backend.ts: packingApi` | `features/packing/api/packingApi.ts` | Feature API extracted | Complete |
| `backend.ts: deliveryApi` | `features/delivery/api/deliveryApi.ts` | Feature API extracted | Complete |
| `backend.ts: notificationsApi` | `features/notifications/api/notificationsApi.ts` | Feature API extracted | Complete |
| `backend.ts: reportsApi` | `features/reports/api/reportsApi.ts` | Feature API extracted | Complete |
| `backend.ts: healthApi` | `features/system/api/healthApi.ts` | Feature API extracted | Complete |

## 5. Feature-by-Feature Change

### Auth

Before: API, storage, hook, and types were cross-feature files. After: they live under `features/auth/`. `LoginPage.tsx` stays in place and imports canonical auth modules.

### Dashboard

Before: dashboard imported six APIs from `services/api/backend.ts`. After: dashboard imports each owning feature API. Dashboard page and components remain in place.

### Orders

Before: page imported registry API and old shared modules. After: local `ordersApi` plus canonical shared modules. Pages unchanged.

### Customers

Before: page used registry API and old CRUD template path. After: local `customersApi` plus shared CRUD template.

### Products

Before: page used registry API and old CRUD template path. After: local `productsApi` plus shared CRUD template.

### Warehouse

Before: four pages used registry exports. After: four pages use `features/warehouse/api/warehouseApi.ts` and shared CRUD template.

### Inventory

Before: workspace used registry inventory APIs and old shared modules. After: local inventory API and canonical shared modules. Pages unchanged.

### Picking

Before: page used registry API and old workflow template. After: local picking API and shared workflow template.

### Packing

Before: page used registry API and old workflow template. After: local packing API and shared workflow template.

### Delivery

Before: page used registry API and old workflow template. After: local delivery API and shared workflow template.

### Notifications

Before: page used registry API. After: local notifications API. Page behavior unchanged.

### Reports

Before: page used registry API. After: local reports API. Page behavior unchanged.

### System

Before: page used registry health API. After: local system health API. Page behavior unchanged.

## 6. Shared Code Change

| Shared Location | Contents | Why Shared |
| --- | --- | --- |
| `shared/api/` | Axios client, request wrapper, safe error mapper | Every feature uses same transport behavior |
| `shared/components/` | Feedback, form, dialog, table primitives | No domain policy |
| `shared/hooks/` | Async request and resource-list hooks | Cross-feature loading behavior |
| `shared/types/` | Generic API envelope, error, resource row types | Transport-level contracts |
| `shared/permissions/` | Role helper, fail-closed permission helper, guard | Shared authorization vocabulary |
| `shared/page-templates/` | CRUD, resource table, workflow workspaces | Reused page-level templates |
| `shared/styles/` | Active global stylesheet | Global classes and responsive rules |

## 7. App Shell Change

| Concern | Before | After |
| --- | --- | --- |
| Layouts | `layouts/` | `app/layouts/` |
| Header and Sidebar | `components/common/` | `app/layouts/components/` |
| Router | `app/router/index.tsx` | Same canonical file; imports updated |
| ProtectedRoute | `components/common/` | `app/router/` |
| Toast provider | `components/common/Toast.tsx` | `app/providers/ToastProvider.tsx` |
| Config | `app/config/env.ts` | Unchanged |

## 8. Compatibility Files

| Old Path | Canonical New Path | Reason Retained | Safe to Remove Later? |
| --- | --- | --- | --- |
| `layouts/{AdminLayout,AuthLayout}/*.tsx` | `app/layouts/*` | Preserve old default imports | Yes, after import/dynamic-import audit |
| `components/common/{Header,Sidebar}.tsx` | `app/layouts/components/*` | Preserve old shell imports | Yes |
| `components/common/ProtectedRoute.tsx` | `app/router/ProtectedRoute.tsx` | Preserve old guard import | Yes |
| `components/common/{AsyncStates,Dialog}.tsx` | `shared/components/{feedback,overlay}/*` | Preserve shared UI imports | Yes |
| `components/common/Toast.tsx` | `app/providers/ToastProvider.tsx` | Preserve provider/hook imports | Yes |
| `components/forms/FormField.tsx` | `shared/components/forms/FormField.tsx` | Preserve form import | Yes |
| `components/tables/*.tsx` | `shared/components/table/*`, `shared/page-templates/*` | Preserve table/template imports | Yes |
| `components/workflow/WorkflowWorkspace.tsx` | `shared/page-templates/WorkflowWorkspace.tsx` | Preserve workflow template import | Yes |
| `hooks/*.ts` | `shared/hooks/*`, `features/auth/hooks/useSession.ts` | Preserve hook imports | Yes |
| `permissions/*` | `shared/permissions/*` | Preserve permission imports | Yes |
| `types/{api,auth}.ts` | `shared/types/api.ts`, `features/auth/types.ts` | Preserve type imports | Yes |
| `services/storage/authStorage.ts` | `features/auth/storage/authStorage.ts` | Preserve storage import | Yes |
| `services/api/{client,request,errors}.ts` | `shared/api/*` | Preserve transport imports | Yes |
| `index.css` | `shared/styles/index.css` | Preserve old CSS entry import | Yes, after external-import audit |

`services/api/backend.ts` is an intentional compatibility barrel, not a pure forwarding file. It re-exports all migrated feature APIs and retains verified `supportApi`.

## 9. What Did Not Change

- Route URLs and authenticated route nesting.
- Endpoint URLs, HTTP methods, request payloads, and response envelope handling.
- `warehouse_access_token` and `warehouse_user` storage keys.
- Token expiry, logout, `401` interceptor, and `warehouse:unauthorized` event behavior.
- Role helper and fail-closed `hasPermission()` behavior.
- Status values, workflow conditions, field validation, confirmation behavior, and mutation reload behavior.
- Backend source and backend behavior.
- Feature page URLs and business logic.

## 10. Visual Summary

```text
BEFORE
Scattered shell, shared code, auth, and monolithic endpoint registry
        ↓
Migration
        ↓
AFTER
Feature-First Hybrid
app/ = shell and routing
features/ = domain pages and APIs
shared/ = reusable infrastructure
```

```text
OLD LOCATION                                  NEW LOCATION
layouts/                                      app/layouts/
components/common/Header, Sidebar             app/layouts/components/
components/common/ProtectedRoute              app/router/
components/common/Toast                       app/providers/
services/api/{client,request,errors}          shared/api/
hooks/, permissions/, types/api               shared/{hooks,permissions,types}/
components/forms, tables, workflow            shared/components/ and shared/page-templates/
services/storage/authStorage, hooks/useSession, types/auth
                                               features/auth/
services/api/backend.ts endpoint objects      features/<feature>/api/
index.css                                     shared/styles/index.css
```

## 11. Migration Statistics

Counts use current tree and uncommitted migration diff.

- Files moved: **26** implementation files moved to canonical locations.
- Files added: **38** canonical files: 26 moved implementations plus 12 extracted feature API modules.
- Compatibility files retained: **26** pure forwarders; plus **1** transitional backend compatibility barrel.
- Files deleted: **0** application files.
- Features migrated: **13** feature folders verified; 12 own extracted API modules, dashboard now composes feature APIs.
- Shared modules migrated: **17** files under `shared/`.

## 12. Final Verdict

**STRUCTURE MIGRATION: PASS WITH WARNINGS**

Migration completed approved Feature-First Hybrid ownership. Compatibility forwarders remain intentionally. Genuine deferred risks are one unowned `supportApi` barrel, backup/starter files under `src/`, and compatibility-related Fast Refresh lint advisories. Cleanup needs separate approval, import audit, build, and lint verification.
