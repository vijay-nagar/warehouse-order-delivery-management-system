# Safe Migration Plan

This plan is a recommendation only. It does not authorize a file migration. Each phase should be a small, reversible frontend-only change with no backend edits and no contract changes.

## Preconditions

Before changing locations:

1. Record `git status --short` and preserve existing unrelated work.
2. Run the existing frontend build: `npm.cmd run build` from `frontend/`.
3. Run `npm.cmd run lint` and record existing warnings separately from new warnings.
4. Confirm the public health endpoint without mutating data: `GET /health`.
5. Identify a non-production account and disposable records before exercising any authenticated mutation. Do not test mutations against operational warehouse data merely to validate imports.
6. Freeze route paths, local/session storage keys, endpoint paths/methods, and source-defined status guards as migration invariants.

## Phase 0: Create a behavior baseline

| Check | Expected behavior to preserve |
| --- | --- |
| Public login route | `/login` renders without authenticated API calls. |
| Session restoration | Valid persisted session opens the authenticated shell; expired/missing session redirects to login. |
| 401 behavior | Axios interceptor clears stored auth and dispatches the existing unauthorized event. |
| Navigation | All current paths resolve: `/`, `/orders`, `/warehouses`, `/zones`, `/shelves`, `/bins`, `/inventory`, `/picking`, `/packing`, `/delivery`, `/customers`, `/products`, `/notifications`, `/reports`, `/system`. |
| API wiring | `backend.ts` retains the same path/method behavior until consumer imports have migrated. |
| Workflow UI | Only source-defined statuses reveal each picking, packing, and delivery action. |

Create a migration branch or commit at this point. Do not combine backup cleanup with the first structural move.

## Phase 1: Remove ambiguity without moving application code

Goal: document ownership and identify stale files.

- Add module-level ownership notes or a short architecture document if desired.
- Verify that `App.css`, `src/assets/react.svg`, `src/assets/vite.svg`, `src/assets/hero.png`, `DashboardPage.backup.tsx`, `index.css.before-dashboard-design.css`, and `index.css.dark-backup` have no intended runtime use.
- Do not delete or relocate them in the same phase. Their presence affects lint/TypeScript discovery and may be intentional local recovery material.

Exit criteria: no code behavior changes; build result unchanged.

Rollback: revert the documentation-only commit.

## Phase 2: Normalize the application shell

Goal: make ownership clear while preserving import compatibility.

1. Move one layout or shell component at a time, for example `AdminLayout` into `src/app/layouts/`.
2. Leave a short re-export at the former path temporarily, or update all known imports in the same commit.
3. Keep `main.tsx` and the router export path stable.
4. Build and open `/`, `/login`, and one protected route after each move.

Do not change markup, CSS class names, session behavior, or route definitions in this phase.

Rollback: revert only the commit that moved that shell unit.

## Phase 3: Move transport infrastructure

Goal: distinguish shared HTTP infrastructure from feature APIs.

1. Move `client.ts`, `request.ts`, and `errors.ts` into a shared infrastructure folder.
2. Preserve re-exports at `services/api/` until all current imports have been updated and verified.
3. Move `authStorage.ts` separately. Do not rename `warehouse_access_token` or `warehouse_user`.
4. Verify login, refresh, logout, an expired-token redirect, and a 401 response using a safe test environment.

Rollback: restore the compatibility re-export; no backend or stored-session migration is required.

## Phase 4: Split feature API modules incrementally

Goal: colocate endpoint methods with their feature without changing endpoint behavior.

Recommended order: auth, orders, inventory, warehouse hierarchy, picking, packing, delivery, customers/products, notifications/reports/system.

For each feature:

1. Copy the exact existing method implementation to the feature API module.
2. Add a barrel re-export from `services/api/backend.ts`; do not remove the legacy export yet.
3. Update only that feature’s pages/components to import from its feature API module.
4. Check exact URL, HTTP method, request body keys, response unwrapping, and status action visibility against `BACKEND_API_INVENTORY.md` and `API_UI_MAPPING.md`.
5. Run build and navigate to the feature list/detail page.

Avoid inventing query parameters, client-side roles, endpoint types, or status transitions while splitting files.

Rollback: switch the feature imports back to the barrel and revert the feature API module commit.

## Phase 5: Consolidate wrapper pages

Goal: remove only confirmed, low-risk indirection.

1. For orders, merge the routed `OrdersPage.tsx` and delegated `OrderWorkspacePage.tsx` into one `OrdersPage.tsx` only after route/build/manual checks.
2. Repeat separately for inventory.
3. Do not merge generic workflow/page templates into feature pages in the same phase. That is a larger behavior-preserving refactor.

Exit criteria: router default import still works, visual output and API calls are unchanged, build passes.

Rollback: restore the lightweight wrapper and workspace file from the same commit.

## Phase 6: Separate primitives from templates

Goal: make shared component boundaries explicit.

- Keep `Dialog`, `Toast`, `AsyncStates`, `DataTable`, `Pagination`, and `FormField` shared.
- Treat `CrudResourcePage`, `ResourceTablePage`, and `WorkflowWorkspace` as templates. Either retain a documented `shared/page-templates/` location or progressively replace them with feature-owned components.
- Migrate one template consumer at a time; do not rewrite customers, products, warehouse hierarchy, picking, packing, and delivery together.

For each consumer, compare DOM behavior, form validation, confirmation behavior, request payload, retry behavior, and post-mutation refetch behavior.

## Phase 7: CSS and archive cleanup

Goal: establish one active styling source without visual regressions.

1. Keep `index.css` as the stable imported entry point.
2. Extract tokens, reset/base styles, layouts, and component styles one file at a time, leaving `index.css` as import-only entry if preferred.
3. Use visual checks at desktop, tablet, and mobile widths after each extraction.
4. Remove or relocate backups and unused starter files only in a final dedicated commit after a repository-wide reference check and team approval.

Rollback: restore the previous CSS import order. Do not blend CSS cleanup with API or route changes.

## Phase 8: Introduce route metadata only after backend support exists

When and only when an authenticated response contains verified effective permissions, introduce route metadata for navigation/route guards. Until then, retain the existing auth-only route shell and server-side authorization enforcement. Do not infer access from role names.

## Required verification after every phase

```text
frontend> npm.cmd run build
frontend> npm.cmd run lint
```

Also inspect the changed import graph with `rg`, run the relevant pages in a browser, and use the following minimum smoke matrix:

| Area | Minimum smoke check |
| --- | --- |
| Auth | Login screen, protected-route redirect, logout, expired-session redirect |
| Masters | List, detail, create/update/deactivate only on disposable test data |
| Orders | List, detail, create/cancel only on disposable test data |
| Inventory | List, history, transactions/reservation only on disposable test data |
| Picking/Packing/Delivery | List/detail and each permitted status action only in a test workflow |
| Notifications | List and mark-read on test account |
| Reports/System | Load, retry, and responsive rendering |
| Mobile navigation | Open/close sidebar, keyboard focus, dialog Escape at narrow viewport |

## Rollback strategy

- Make one migration concern per commit.
- Keep compatibility re-exports while moving APIs and shared infrastructure.
- Never couple a frontend path move to a backend deployment.
- Revert the smallest affected commit when build, route resolution, API contract, or visual checks diverge.
- Preserve backups outside compiled `src` only after their recovery value is no longer needed and the team approves archival/deletion.
- If a production issue occurs after a structural release, deploy the last known-good frontend bundle/commit; persisted browser tokens and backend endpoints remain compatible because their names and contracts were not changed.
