# Functional Smoke Test Report

Date: 2026-09-24
Branch: `migration/app-layouts`
Scope: post-migration verification only. No application or backend code changed.

## Environment

- Frontend: Vite responded on `http://localhost:5173`.
- Backend: `http://localhost:3001`; `GET /health` returned `200` with `database: "connected"`.
- Frontend base URL: `VITE_API_BASE_URL`, with fallback `http://localhost:3001`.
- No browser automation surface was available. UI rendering, browser console, mobile drawer, and authenticated workflow actions could not run.
- No valid non-production credentials were available in checked-in source. No credentials were guessed or used.

## Route Availability

Every configured frontend route returned Vite's application document with `200`:

`/login`, `/`, `/orders`, `/warehouses`, `/zones`, `/shelves`, `/bins`, `/inventory`, `/picking`, `/packing`, `/delivery`, `/customers`, `/products`, `/notifications`, `/reports`, `/system`.

This confirms dev-server fallback availability. It does not prove React Router rendering or protected-route redirects without a browser.

## API Results

| Feature | Route | Endpoint | Result | Error / cause | Migration-related |
| --- | --- | --- | --- | --- | --- |
| System | `/system` | `GET /health` | PASS | `200`; backend and database reported healthy. | No |
| System | `/system` | `GET /api/health` | PASS | `200`. | No |
| Authentication | `/login` | `POST /api/auth/login` with invalid credentials | FAIL | `500 {"success":false,"message":"API Gateway error"}`. Expected invalid-credential response is `401`. Gateway error handler hides root exception. | No evidence; backend response |
| Authentication | protected routes | `GET /api/auth/me` without token | PASS | `401`; authorization boundary responds. Browser redirect not testable. | No |
| Customers | `/customers` | `GET /api/customers` without token | BLOCKED | `401` expected without valid token. | No |
| Products | `/products` | `GET /api/products` without token | BLOCKED | `401` expected without valid token. | No |
| Warehouse | `/warehouses` | `GET /api/warehouses` without token | BLOCKED | `401` expected without valid token. | No |
| Zones | `/zones` | `GET /api/zones` without token | BLOCKED | `401` expected without valid token. | No |
| Shelves | `/shelves` | `GET /api/shelves` without token | BLOCKED | `401` expected without valid token. | No |
| Bins | `/bins` | `GET /api/bins` without token | BLOCKED | `401` expected without valid token. | No |
| Inventory | `/inventory` | `GET /api/inventory` without token | BLOCKED | `401` expected without valid token. Reservations and transactions require login. | No |
| Orders | `/orders` | `GET /api/orders` without token | BLOCKED | `401` expected without valid token. Details, filters, status, and mutations require login/data. | No |
| Picking | `/picking` | `GET /api/picking` without token | BLOCKED | `401` expected without valid token. | No |
| Packing | `/packing` | `GET /api/packing` without token | BLOCKED | `401` expected without valid token. | No |
| Delivery | `/delivery` | `GET /api/delivery` without token | BLOCKED | `401` expected without valid token. Tracking and mutations require login/data. | No |
| Notifications | `/notifications` | `GET /api/notifications/me` without token | BLOCKED | `401` expected without valid token. | No |
| Reports | `/reports` | `GET /api/reports/orders/summary` without token | BLOCKED | `401` expected without valid token. | No |
| Dashboard | `/` | orders, inventory, picking, packing, delivery, reports APIs | BLOCKED | Dashboard fan-out requires valid authenticated session. | No |

No mutation endpoint was called. No operational data changed.

## Source-Level Migration Checks

- Router retains all audited URLs and wraps authenticated branch in `ProtectedRoute` and `AdminLayout`.
- Login, logout, session restoration, expiry handling, and `warehouse:unauthorized` event handling retain prior storage keys and logic.
- `GET /api/auth/me` returns `401` without token. Browser-side interceptor and redirect could not execute without a browser surface.
- Header, sidebar, page templates, feature pages, API modules, status guards, and reload-after-mutation code were moved without behavior edits.
- No console or runtime error could be captured because no supported browser surface was available.

## Validation

| Check | Result | Notes |
| --- | --- | --- |
| `npm.cmd run build` | PASS | TypeScript and Vite production build passed. |
| `npm.cmd run lint` | WARNINGS | Exit code `0`. Existing state-effect, Fast Refresh, immutability, and legacy template warnings remain. No lint fixes made. |
| `git diff --check` | PASS | Exit code `0`; Git emitted LF-to-CRLF notices. |

## Failures and Blockers

1. Invalid-login API response is `500` with `API Gateway error`, not expected `401`. Backend gateway error wrapper masks root cause. This is not proven migration-related.
2. No valid test credentials. Authenticated lists, details, mutations, session restoration, logout, dashboard data, and workflow status actions remain blocked.
3. No browser automation surface. UI rendering, navigation, drawer behavior, refresh clicks, toast/error UI, console errors, protected-route redirect, and 401 client interceptor remain blocked.

## Recommended Fixes

1. Inspect backend process logs for failed `POST /api/auth/login`; restore expected `401 Invalid username or password` behavior before frontend login testing.
2. Provide disposable non-production credentials and test records.
3. Provide an available browser surface, then run authenticated UI smoke tests without calling destructive mutations.

## Summary

- STRUCTURE: PASS
- AUTH: FAIL
- ROUTING: BLOCKED
- API INTEGRATION: BLOCKED
- FEATURES: BLOCKED
- BUILD: PASS
- LINT: WARNINGS
