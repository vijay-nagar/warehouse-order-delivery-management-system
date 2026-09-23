# Project Structure Audit

Audit scope: `frontend/` source, configuration, imports, and the existing API/RBAC organization. This is a read-only analysis of the repository as inspected on 2026-09-23. No source files were moved or changed for this audit.

## Current organization

The application is a single Vite + React + TypeScript frontend. `src/main.tsx` composes `ToastProvider` and `RouterProvider`; `src/app/router/index.tsx` defines all routes and lazy imports every routed page. The authenticated route branch uses `ProtectedRoute`, `AdminLayout`, `Header`, and `Sidebar`. Login uses `AuthLayout`.

| Area | Current location | Evidence and assessment |
| --- | --- | --- |
| Application bootstrap | `src/main.tsx` | Correct entry point. It imports global `index.css`, mounts React Strict Mode, and mounts the router. |
| Configuration and router | `src/app/config/env.ts`, `src/app/router/index.tsx` | Correct high-level location. The router is a single, explicit route registry, but imports all feature pages directly rather than consuming feature route definitions. |
| Layouts | `src/layouts/{AdminLayout,AuthLayout}/` | Correct separation of authenticated shell and auth shell. Folder naming is inconsistent: layout directories use PascalCase while feature directories use lowercase. |
| Features | `src/features/<domain>/pages` | Most business domains are correctly grouped: auth, customers, dashboard, delivery, inventory, notifications, orders, packing, picking, products, reports, system, warehouse. |
| Shared UI | `src/components/common`, `forms`, `tables`, `workflow` | Correct shared location, though `CrudResourcePage`, `ResourceTablePage`, and `WorkflowWorkspace` are page-level templates rather than small UI primitives. |
| Shared logic | `src/hooks`, `src/permissions`, `src/services`, `src/types` | Correct cross-feature location. The empty `src/utils/` directory is unused. |
| Styling | `src/index.css`, `src/App.css`, backup CSS files | `index.css` is the active global stylesheet. `App.css` contains starter-template nested CSS and has no import from the app entry. Two backup stylesheets are inside `src` and included by TypeScript tooling/file discovery. |
| Assets | `src/assets/{hero.png,react.svg,vite.svg}` and `public/{favicon.svg,icons.svg}` | `react.svg` and `vite.svg` are starter assets. No active import was found for the `src/assets` files. |

## Feature and role inventory

### Business features

| Domain | Files | Route(s) | Main dependencies |
| --- | --- | --- | --- |
| Auth | `features/auth/pages/LoginPage.tsx` | `/login` | `authApi`, storage, `useAsyncRequest` |
| Dashboard | `features/dashboard/pages/DashboardPage.tsx`, four local components | `/` | Orders, inventory, picking, packing, delivery, reports APIs |
| Orders | `OrdersPage.tsx`, `OrderWorkspacePage.tsx` | `/orders` | `ordersApi`, shared dialog/toast/states |
| Warehouse hierarchy | `WarehousePage.tsx`, `ZonesPage.tsx`, `ShelvesPage.tsx`, `BinsPage.tsx` | `/warehouses`, `/zones`, `/shelves`, `/bins` | Resource-specific API object and `CrudResourcePage` |
| Inventory | `InventoryPage.tsx`, `InventoryWorkspacePage.tsx` | `/inventory` | Inventory, reservations, transactions APIs |
| Picking | `PickingPage.tsx` | `/picking` | `pickingApi`, `WorkflowWorkspace` |
| Packing | `PackingPage.tsx` | `/packing` | `packingApi`, `WorkflowWorkspace` |
| Delivery | `DeliveryPage.tsx` | `/delivery` | `deliveryApi`, `WorkflowWorkspace` |
| Master data | `CustomersPage.tsx`, `ProductsPage.tsx` | `/customers`, `/products` | `CrudResourcePage` |
| Notifications | `NotificationsPage.tsx` | `/notifications` | `notificationsApi` with page-local async state |
| Reports | `ReportsPage.tsx` | `/reports` | `reportsApi` with page-local async state |
| System | `SystemPage.tsx` | `/system` | `healthApi` with page-local async state |

### Roles and workspaces

No frontend folder, route, or page exists for Super Admin, Warehouse Manager, Inventory Manager, Picker, Packer, Delivery Manager, Delivery Boy, or Support Staff. `AuthUser.roles` is stored and rendered by `Header`; `Sidebar` has an optional `roles` property but every navigation entry omits it. `hasPermission()` returns `false` by design because the login and profile contracts do not return effective permissions. This is consistent with the backend audit: no source-proven role-to-permission mapping can be safely encoded in the frontend.

Therefore the current project is **feature-oriented, not role-workspace-oriented**. The server remains the actual authorization boundary.

## Duplicates, misplaced items, and structural risks

| Finding | Evidence | Impact | Recommendation |
| --- | --- | --- | --- |
| Dashboard backup in source tree | `features/dashboard/pages/DashboardPage.backup.tsx` is included by `tsconfig.app.json` and appears in lint output, but router imports `DashboardPage.tsx`. | Stale code can create lint/type noise and confuse maintainers. | Preserve outside the compile source tree or remove only after a reviewed migration; do not import it. |
| CSS backups in source tree | `index.css.before-dashboard-design.css` and `index.css.dark-backup` sit beside the active `index.css`. | Multiple apparent design authorities; accidental imports are possible. | Preserve under a non-compiled archival location or version control history after review. |
| Starter stylesheet remains | `App.css` contains Vite starter selectors and is not imported by `main.tsx`. | Dead CSS and a misleading source of truth. | Remove after confirming no external import, or archive outside `src`. |
| Starter assets remain | `src/assets/react.svg`, `src/assets/vite.svg`, and likely `hero.png` have no active import found. | Low runtime risk, but increases search noise. | Confirm with a repository-wide reference search before removal. |
| Page/wrapper duplication | `OrdersPage.tsx` delegates to `OrderWorkspacePage.tsx`; `InventoryPage.tsx` delegates to `InventoryWorkspacePage.tsx`. | The paired names obscure the routed component and business implementation. | Consolidate each into a single named page during a dedicated refactor. |
| Shared templates contain business policy | `WorkflowWorkspace` receives status/action configuration; `CrudResourcePage` serializes arbitrary fields; `ResourceTablePage` embeds filtering, CSV export, and pagination. | Shared components become broad and hard to change safely; policy is split between pages and templates. | Keep primitives shared, but move domain workflows and feature-specific table policy into each feature. |
| Inconsistent naming | `AdminLayout/` and `AuthLayout/` use PascalCase directory names; feature/service directories are lowercase. | Minor discoverability and import-path inconsistency. | Choose a single directory convention in a migration. |
| Weak feature ownership of APIs/types | Every endpoint is in `services/api/backend.ts`; most data is `ResourceRow = Record<string, unknown>`. | Feature contracts are not colocated with their consumer and response keys vary by casing. | Keep transport client shared; move endpoint modules and response types to feature folders in stages. |
| Legacy generic table remains | `ResourceTablePage` has local search/filter/date/CSV behavior and is not the basis of the newer operational pages. | Duplicates list-page behavior and includes client-only controls where server support is absent. | Retire only after consumers are explicitly identified and migrated. |

## Routing, authentication, and RBAC

Routing is centralized and lazy-loads all page modules. Authentication organization is coherent: `authStorage` owns token/user persistence, `api/client.ts` attaches the Bearer token and dispatches `warehouse:unauthorized` on 401, and `useSession` restores or clears the session. `ProtectedRoute` guards the authenticated route branch.

RBAC organization is intentionally incomplete rather than fabricated. `permissions/access.ts` contains verified permission names, `PermissionGuard.tsx` is a fail-closed wrapper, and `Sidebar.tsx` supports role filters. However, no current route or navigation item supplies a role or permission rule, and the verified backend response does not give the client the permissions required to evaluate one. A restructure must retain this distinction; moving these files cannot make role authorization accurate.

## Dependencies and breaking points

The frontend runtime dependencies are React 19, React DOM, React Router DOM, and Axios. Tooling is Vite, TypeScript, the React Vite plugin, and Oxlint. No state-management, query-cache, test-runner, or UI-library dependency is installed.

| Breaking point | Why it matters during reorganization |
| --- | --- |
| Router paths and lazy imports | A moved page must retain its exact route path and default export until route tests pass. |
| `backend.ts` public object names | Pages and dashboard import names such as `ordersApi`, `inventoryApi`, and `deliveryApi`; moving them requires compatibility re-exports. |
| Storage keys | `warehouse_access_token` and `warehouse_user` are persisted browser keys. Renaming them silently logs users out. |
| Global CSS class names | Pages and shared components use global class strings extensively; CSS moves can change unrelated pages. |
| Backend field casing | Pages handle both `Id`/`id` in places. New feature types must match actual endpoint responses before replacing `ResourceRow`. |
| Dashboard fan-out | Dashboard performs six API calls in one `Promise.all`; changing API exports or error handling can make the entire dashboard fail. |
| Backup files under `src` | They are compiled/linted despite being unrouted. Removing/moving them changes tooling inputs and should be a distinct reviewed commit. |

## Conclusion

The current frontend has a sound foundation for a small feature-based application, but it is not yet consistently structured. The appropriate target is a **feature-based architecture with a thin application shell and optional role-facing composition**, not folders per role. Roles should remain data and navigation metadata until the backend exposes verified effective permissions. The most valuable low-risk reorganization is to remove ambiguity around backups and wrapper pages, then colocate feature APIs/types/hooks while retaining compatibility exports during migration.
