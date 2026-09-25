# Frontend audit

Audit date: 2026-09-23. This is a source-only audit of the current working tree. No application code, backend code, database, dependencies, or runtime configuration was changed. Existing local changes were preserved.

## Architecture

The frontend is a React 19 + TypeScript single-page application built with Vite. `src/main.tsx` creates the React root inside `index.html#root`, loads `index.css`, and supplies the browser router. React Router v7 owns navigation. Axios is the only HTTP client. No Redux, Zustand, React Query, context-based application store, or custom API hooks were found; pages use local `useState`, `useEffect`, and occasional `useMemo`.

`package.json` scripts are `dev`, `build`, `lint`, and `preview`. Runtime dependencies are Axios, React, React DOM, and React Router DOM. TypeScript project references split app and Vite configuration. `vite.config.ts` only enables the React plugin; it has no development proxy. `App.css` is leftover template CSS and is not imported by `main.tsx`.

## Entry points and routing

| Area | Verified implementation |
| --- | --- |
| HTML entry | `frontend/index.html` loads `/src/main.tsx` into `#root`. |
| React entry | `frontend/src/main.tsx` renders `<RouterProvider router={router}>` in `React.StrictMode`. |
| Router | `frontend/src/app/router/index.tsx` uses `createBrowserRouter`. |
| Public route | `/login` inside `AuthLayout`. |
| Protected routes | `/`, `/orders`, `/warehouses`, `/inventory`, `/picking`, `/packing`, `/delivery`, `/customers`, `/products`, `/notifications`, `/reports`, `/system`, all inside `ProtectedRoute` then `AdminLayout`. |
| Layout | `AdminLayout` renders `Sidebar`, `Header`, and an `Outlet`; `AuthLayout` renders an `Outlet`. |
| Route access | `ProtectedRoute` checks only whether a token exists. There is no route-level role or permission guard. |

The Sidebar renders links for every protected page for every signed-in user. It is not permission-aware.

## Authentication and token handling

`LoginPage` posts `{ username, password }` to `/api/auth/login` and expects `{ success, message, data: { accessToken, user } }`. `setAuth` stores the access token under `warehouse_access_token` and serialized user under `warehouse_user` in `localStorage`. Axios request interception sends `Authorization: Bearer <token>`. A 401 clears both keys, but does not navigate to login. Header logout clears those keys and navigates to `/login`.

The Remember me checkbox does not change token storage: authentication is always written to `localStorage`. When unchecked, it additionally writes `warehouse-session=active` to `sessionStorage`; no code reads it. No refresh token, backend logout, token-expiry handling, `/api/auth/me` request, permission hydration, or cross-tab synchronization was found.

The frontend `AuthUser.email` type is `string`, while backend source permits `email: string | null`. Frontend login user IDs use `id`; backend `/api/auth/me` returns `userId`.

## API client and actual calls

`src/services/api.ts` configures Axios with `VITE_API_BASE_URL`, falling back to `http://localhost:3001`, and JSON content type. There are no feature-specific service modules or reusable request hooks.

Active calls are:

| Frontend location | Call |
| --- | --- |
| LoginPage | `POST /api/auth/login` |
| ResourceTablePage (used by eight list pages) | GET configurable endpoint: orders, warehouses, inventory, picking, packing, delivery, customers, products |
| DashboardPage | GET orders, inventory, picking, packing, delivery, report summary in `Promise.all` |
| NotificationsPage | GET `/api/notifications/me`; PATCH `/api/notifications/:id/read` |
| ReportsPage | GET `/api/reports/orders/summary` |
| SystemPage | GET `/health` |

There is no frontend call for authenticated profile, order details/cancellation/creation, warehouse hierarchy, inventory writes/transactions/reservations, picking/packing/delivery transitions, support aliases, notification creation or unread-only retrieval.

## Pages and components

`ResourceTablePage` is the reusable listing component for Orders, Warehouse, Inventory, Picking, Packing, Delivery, Customers, and Products. It fetches entire collections, extracts `data/items/results/rows`, applies client-side text/status/date filtering, paginates 20 rows, refreshes, retries, and creates browser CSV downloads. It is read-only for backend resources.

Dashboard aggregates six responses and derives counts locally. Its refresh fails as a unit if any request fails. `RecentOrders`, `OrderStatusChart`, `StatCard`, and `StatusCard` are presentation components. Reports renders summary figures, status table, and top products, but does not expose backend date query parameters. Notifications supports its single verified mutation, Mark as Read. System renders health properties.

## Types, data-shape, state, and style findings

- Backend warehouse API output is PascalCase (`Id`, `Name`, `AddressLine1`, `IsActive`) but WarehousePage configures camelCase and nonexistent fields (`id`, `name`, `address`, `status`); the configured columns will not render values from the source-defined response.
- CustomersPage and ProductsPage configure a nonexistent `status` field; their APIs return `isActive` instead. InventoryPage repeats `AvailableQuantity`, making duplicate React column keys. Generic status filtering recognizes only a property named `status` or `Status`, not `isActive`.
- Picking, Packing, and Delivery pages use PascalCase table keys consistent with repository output, although domain TypeScript interfaces use camelCase in places.
- Dashboard's pending-order list includes `pending`, `processing`, `created`, `confirmed`, `assigned`, `picked`, and `packed`; backend order statuses are uppercase and include `STOCK_RESERVED`, `PICKING`, and `PACKING`. The derived dashboard counts therefore are not a verified workflow representation.
- `ResourceTablePage` maintains `toDate` and `dateError`, but renders no to-date control and never reads `dateError`. Frontend no-emit TypeScript check reports `dateError` as unused.
- SystemPage renders a green health dot even when health is unknown. A 503 health response is rejected by Axios, so its degraded payload is not retained.
- `index.css` is the active global stylesheet and contains app, auth, table, dashboard, responsive, and later dashboard overrides. `App.css` is unused template CSS. Backups and `DashboardPage.backup.tsx` are present but are not imported.

## Verification and limits

`node node_modules/typescript/bin/tsc -p tsconfig.app.json --noEmit --incremental false` reported one existing/current error: `ResourceTablePage.tsx(145,12): dateError is declared but never read`. Backend typecheck passed during the same audit. No browser, API server, database, migration, or request was started or executed.

## Files inspected

- `frontend/package.json`, `frontend/package-lock.json`, `frontend/vite.config.ts`, `frontend/tsconfig.json`, `frontend/tsconfig.app.json`, `frontend/tsconfig.node.json`, `frontend/.oxlintrc.json`, `frontend/index.html`, `frontend/README.md`
- `frontend/src/main.tsx`, `frontend/src/app/router/index.tsx`, `frontend/src/app/config/env.ts`, `frontend/src/services/api.ts`, `frontend/src/utils/authStorage.ts`, `frontend/src/types/auth.ts`
- `frontend/src/layouts/AuthLayout/AuthLayout.tsx`, `frontend/src/layouts/AdminLayout/AdminLayout.tsx`, `frontend/src/components/common/{Header,Sidebar,ProtectedRoute}.tsx`, `frontend/src/components/tables/ResourceTablePage.tsx`
- Every active feature page/component under `frontend/src/features`, plus `frontend/src/index.css` and `frontend/src/App.css`.
