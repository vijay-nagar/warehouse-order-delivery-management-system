# Recommended Frontend Structure

## Recommendation

Use a **hybrid architecture with feature ownership as the primary boundary**:

- `app/` owns bootstrap, routing, providers, configuration, and layouts.
- `features/` owns domain pages, feature API adapters, types, hooks, and components.
- `shared/` owns reusable UI primitives and technical infrastructure that has no domain policy.
- Role-specific presentation is a composition concern in navigation and route metadata, not a top-level folder tree.

The evidence supports this approach: users work across orders, inventory, picking, packing, and delivery; the source proves named roles but does not prove a role-to-permission matrix consumable by the frontend. Creating `admin/`, `picker/`, or `delivery-boy/` copies of the same domain pages would duplicate API calls and status logic without a verified authorization basis.

## Proposed structure

```text
src/
├── app/
│   ├── bootstrap.tsx                 # current main composition, if separated
│   ├── config/
│   │   └── env.ts
│   ├── providers/
│   │   └── ToastProvider.tsx
│   ├── router/
│   │   ├── index.tsx
│   │   ├── routeDefinitions.tsx
│   │   └── routeGuards.tsx
│   └── layouts/
│       ├── AdminLayout.tsx
│       └── AuthLayout.tsx
├── features/
│   ├── auth/
│   │   ├── api/authApi.ts
│   │   ├── components/LoginForm.tsx
│   │   ├── hooks/useSession.ts
│   │   ├── pages/LoginPage.tsx
│   │   └── types.ts
│   ├── dashboard/
│   │   ├── api/dashboardApi.ts        # composition only; calls verified feature APIs
│   │   ├── components/
│   │   └── pages/DashboardPage.tsx
│   ├── orders/
│   │   ├── api/ordersApi.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/OrdersPage.tsx
│   │   └── types.ts
│   ├── inventory/
│   │   ├── api/inventoryApi.ts
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/InventoryPage.tsx
│   │   └── types.ts
│   ├── warehouse/
│   │   ├── api/
│   │   │   ├── warehousesApi.ts
│   │   │   └── locationsApi.ts        # zones, shelves, bins
│   │   ├── components/
│   │   ├── pages/
│   │   └── types.ts
│   ├── picking/
│   ├── packing/
│   ├── delivery/
│   ├── customers/
│   ├── products/
│   ├── notifications/
│   ├── reports/
│   └── system/
├── shared/
│   ├── api/
│   │   ├── client.ts
│   │   ├── request.ts
│   │   └── errors.ts
│   ├── auth/
│   │   └── storage.ts
│   ├── components/
│   │   ├── feedback/                 # Toast, loading, empty, error states
│   │   ├── forms/                    # field and form primitives only
│   │   ├── overlay/                  # Dialog
│   │   └── table/                    # DataTable, Pagination primitives
│   ├── hooks/
│   │   └── useAsyncRequest.ts
│   ├── permissions/
│   │   ├── access.ts
│   │   └── PermissionGuard.tsx
│   ├── types/
│   │   └── api.ts
│   └── styles/
│       ├── tokens.css
│       ├── base.css
│       ├── layouts.css
│       └── components.css
├── assets/
└── main.tsx
```

`shared/` is a proposed target name; the current `components/`, `services/`, `hooks/`, `permissions/`, and `types/` directories are valid and do not need to move together. The value is explicit ownership, not the word `shared`.

## Role-facing organization

Keep feature pages canonical. If a future verified permission payload is added, add role-aware navigation metadata rather than duplicate role folders:

```text
app/router/routeDefinitions.tsx
  route: /inventory
  page: InventoryPage
  requiredPermission: INVENTORY_VIEW
  navigationGroup: Warehouse operations
```

This permits Super Admin, Warehouse Manager, Inventory Manager, Picker, Packer, Delivery Manager, Delivery Boy, and Support Staff to receive different menus while each page remains owned by its business feature. The values must come from backend-provided effective permissions; no role mapping should be hard-coded from assumptions.

## Current-to-proposed mapping

| Current file or folder | Proposed location | Migration note |
| --- | --- | --- |
| `src/main.tsx` | `src/main.tsx` or `app/bootstrap.tsx` | Keep entry file stable; extract only provider composition if it becomes large. |
| `src/app/config/env.ts` | `src/app/config/env.ts` | Already appropriate. |
| `src/app/router/index.tsx` | `src/app/router/index.tsx` + `routeDefinitions.tsx` | Keep router export stable while route metadata is extracted. |
| `src/layouts/AdminLayout/AdminLayout.tsx` | `src/app/layouts/AdminLayout.tsx` | Flatten only with an import compatibility step. |
| `src/layouts/AuthLayout/AuthLayout.tsx` | `src/app/layouts/AuthLayout.tsx` | Same as above. |
| `src/components/common/{Header,Sidebar,ProtectedRoute}.tsx` | `src/app/router/routeGuards.tsx`, `src/app/layouts/components/` | Header/Sidebar belong to the authenticated shell; ProtectedRoute belongs near route guards. |
| `src/components/common/{AsyncStates,Dialog,Toast}.tsx` | `src/shared/components/{feedback,overlay}/` | Keep as small reusable primitives. |
| `src/components/forms/FormField.tsx` | `src/shared/components/forms/FormField.tsx` | Already a true primitive. |
| `src/components/tables/{DataTable,Pagination}.tsx` | `src/shared/components/table/` | Already reusable. |
| `src/components/tables/{CrudResourcePage,ResourceTablePage}.tsx` | Feature-specific list/page components or a clearly documented `shared/page-templates/` | These contain domain/page behavior and should not be treated as table primitives. |
| `src/components/workflow/WorkflowWorkspace.tsx` | `shared/page-templates/WorkflowWorkspace.tsx` initially; later feature components | Retain until picking, packing, and delivery can be independently validated. |
| `src/services/api/{client,request,errors}.ts` | `src/shared/api/` | Transport layer is cross-feature infrastructure. |
| `src/services/api/backend.ts` | Split into `features/*/api/*.ts` with a temporary barrel | Preserve existing exports until all importers move. |
| `src/services/storage/authStorage.ts` | `src/shared/auth/storage.ts` or `features/auth/storage.ts` | Choose feature ownership if no non-auth consumer writes tokens. |
| `src/hooks/useAsyncRequest.ts` | `src/shared/hooks/useAsyncRequest.ts` | Cross-feature hook. |
| `src/hooks/useResourceList.ts` | `src/shared/hooks/` initially | Move into a feature only if it gains domain policy. |
| `src/hooks/useSession.ts` | `src/features/auth/hooks/useSession.ts` | Auth-specific. |
| `src/permissions/*` | `src/shared/permissions/` | Keep fail-closed behavior unchanged. |
| `src/types/api.ts` | `src/shared/types/api.ts` | Transport-only types. |
| `src/types/auth.ts` | `src/features/auth/types.ts` | Auth contract. |
| `src/features/orders/{OrdersPage,OrderWorkspacePage}.tsx` | `src/features/orders/pages/OrdersPage.tsx` | Merge only after route/build/manual checks. |
| `src/features/inventory/{InventoryPage,InventoryWorkspacePage}.tsx` | `src/features/inventory/pages/InventoryPage.tsx` | Merge only after route/build/manual checks. |
| `src/features/dashboard/components/*` | Unchanged | Correct local feature components. |
| `src/App.css` | Archive/remove after reference audit | It is not an active application stylesheet. |
| `src/index.css` | `src/shared/styles/*` gradually | Split by responsibility, retaining a stable top-level import. |
| `*.backup.tsx`, `*.backup.css`, `*.dark-backup` in `src` | Version history or an explicit non-compiled archive directory | Do not delete during the first migration. |
| `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png` | Remove/archive only after repository-wide reference audit | They appear unused, but no deletion is justified by this audit alone. |

## Design constraints

1. Do not create `features/admin`, `features/users`, or role-specific copies until APIs and effective permission contracts exist.
2. Do not split an endpoint into a new client method unless the current backend endpoint is verified.
3. Do not replace `ResourceRow` with guessed field types. Derive types from captured endpoint contracts or source-verified controller responses.
4. Do not mix a styling refactor with API, workflow, or authorization changes.
5. Preserve all route paths, storage keys, HTTP methods, status guards, and current API base URL behavior throughout the migration.
