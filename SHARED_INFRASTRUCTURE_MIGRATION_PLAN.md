# Shared Infrastructure Migration Plan

Scope: `frontend/src/services`, `hooks`, `types`, `components/common`, `permissions`, and `utils` on branch `migration/app-layouts`. This document is an audit and migration recommendation only. No shared-infrastructure files were moved or changed.

## Current dependency shape

```text
types/api, types/auth
  ├─ services/storage/authStorage
  ├─ services/api/errors
  └─ services/api/backend

app/config/env ──────────────┐
authStorage ─────────────────┼─ services/api/client ─ services/api/request ─ services/api/backend
                              │
services/api/errors ─────────┼─ hooks/useAsyncRequest ─ hooks/useResourceList
authStorage ─────────────────┴─ hooks/useSession

hooks/useSession ─ components/common/ProtectedRoute
authStorage + permissions/access ─ components/common/Header, Sidebar
authStorage + permissions/access ─ permissions/PermissionGuard
```

No circular imports were found in the inspected files. The graph is layered, although `services/api/backend.ts` is a high fan-in aggregation point and `authStorage.ts` participates in session restoration, HTTP authorization, logout, sidebar/header rendering, and permission guards.

## Current file mapping and recommended ownership

| Current file | Current responsibility | Classification | Recommended target location | Migration safety |
| --- | --- | --- | --- | --- |
| `services/api/client.ts` | Axios instance, base URL, Bearer header, 401 cleanup/event | Shared transport infrastructure | `shared/api/client.ts` | Move only with a compatibility re-export; high risk due to all API requests. |
| `services/api/request.ts` | Envelope unwrapping and generic request dispatch | Shared transport infrastructure | `shared/api/request.ts` | Move with `client.ts`; retain export path. |
| `services/api/errors.ts` | Converts Axios errors into safe `ApiError` messages | Shared transport infrastructure | `shared/api/errors.ts` | Low logic risk, medium import fan-in. |
| `services/api/backend.ts` | One API object per backend domain | Transitional API registry, not a transport primitive | Keep temporarily at current location; later split into feature API modules with a compatibility barrel | Highest API migration risk. It contains verified endpoint names, paths, methods, and response unwrapping assumptions. |
| `services/storage/authStorage.ts` | Token/user persistence, expiry inspection, session/local storage choice | Authentication infrastructure | `features/auth/storage/authStorage.ts` or `shared/auth/authStorage.ts` | High behavioral risk. Preserve browser keys `warehouse_access_token` and `warehouse_user`, cleanup behavior, and store precedence. |
| `hooks/useAsyncRequest.ts` | Shared loading/data/error wrapper | Shared hook | `shared/hooks/useAsyncRequest.ts` | Safe after `errors.ts` compatibility export exists. |
| `hooks/useResourceList.ts` | Shared list loader built on `useAsyncRequest` | Shared hook/template support | `shared/hooks/useResourceList.ts` | Medium risk; used by resource and workflow page templates. |
| `hooks/useSession.ts` | Session restoration and unauthorized/storage listeners | Auth-specific hook | `features/auth/hooks/useSession.ts` | High behavioral risk; used by `ProtectedRoute`. |
| `types/api.ts` | API envelope, API error, generic resource row | Shared transport types | `shared/types/api.ts` | Low logic risk, high import fan-in. |
| `types/auth.ts` | Login request/response and stored user shape | Auth contract | `features/auth/types.ts` | Medium risk; used by login, API registry, storage, session, and permissions. |
| `components/common/AsyncStates.tsx` | Loading, empty, error, status badge, page header primitives | Shared UI primitives | `shared/components/feedback/AsyncStates.tsx` | Low risk when import paths are updated atomically. |
| `components/common/Dialog.tsx` | Dialog semantics, Escape/focus handling | Shared UI primitive | `shared/components/overlay/Dialog.tsx` | Medium visual/accessibility risk; preserve global class names and behavior. |
| `components/common/Toast.tsx` | Toast provider, context hook, live region | Shared UI/provider | `app/providers/ToastProvider.tsx` plus `shared/hooks/useToast.ts`, only if split deliberately | Medium provider risk. It is imported at application bootstrap and by mutation pages. |
| `components/common/ProtectedRoute.tsx` | Authentication-only route guard | Application routing concern | `app/router/ProtectedRoute.tsx` | High route/auth risk; move only with router smoke verification. |
| `components/common/Header.tsx` | Authenticated-shell identity display, logout, mobile-menu trigger | Application-shell component | `app/layouts/components/Header.tsx` | Medium risk; depends on auth storage and Router navigation. |
| `components/common/Sidebar.tsx` | Authenticated navigation/drawer and optional role filter | Application-shell component | `app/layouts/components/Sidebar.tsx` | Medium risk; preserve all navigation paths and do not add inferred role rules. |
| `permissions/access.ts` | Permission-name union, role helper, fail-closed permission helper | Shared authorization vocabulary | `shared/permissions/access.ts` | Do not change logic. The backend does not expose effective permissions. |
| `permissions/PermissionGuard.tsx` | Permission guard and action alias | Shared authorization UI | `shared/permissions/PermissionGuard.tsx` | Move with `access.ts` and auth-storage compatibility paths. |
| `utils/` | Empty directory | No current responsibility | Do not create a replacement solely for structure | No migration required. |

## Duplication and boundary findings

1. There is no duplicate implementation in the inspected infrastructure. The main concern is ambiguous ownership rather than duplicated code.
2. `Header`, `Sidebar`, and `ProtectedRoute` are currently under `components/common`, but each is application-shell or routing-specific, not a general reusable UI primitive.
3. `Toast.tsx` combines a provider component and the `useToast` hook. This is functional but explains the existing Fast Refresh lint advisory. A future split is optional and must preserve the provider context identity.
4. `backend.ts` is correctly centralized for current behavior but mixes every domain API. It should be treated as a compatibility registry during a gradual feature-API split, not moved as a normal shared primitive.
5. `useSession` is feature-specific authentication logic; `useAsyncRequest` and `useResourceList` are genuinely cross-feature.
6. The permission helper’s `hasPermission()` deliberately returns `false`. Its placement can change, but its behavior must not change until a verified backend effective-permission contract exists.

## Files that should remain unchanged during the first shared-infrastructure migration

| File or behavior | Reason |
| --- | --- |
| `services/api/backend.ts` endpoint implementations | The API inventory is verified; splitting methods is a separate domain migration. |
| `services/storage/authStorage.ts` storage keys and logic | A structural move must not sign out users or change remember-me behavior. |
| `services/api/client.ts` 401 interceptor | It is the current unauthorized-session boundary. |
| `permissions/access.ts` permission result | Changing the false result would invent authorization information. |
| `components/common/ProtectedRoute.tsx` route behavior | Keep the exact redirect path and `state.from` handling. |
| `components/common/Header.tsx` logout sequence | Preserve `clearAuth()` before navigation to `/login`. |
| `components/common/Sidebar.tsx` navigation data | Preserve every current route path and empty role restrictions. |

## Recommended migration order

Each numbered item should be its own commit. Keep the current module as a one-line re-export until all internal imports have moved and checks pass.

1. **Shared types:** move `types/api.ts` to `shared/types/api.ts`; retain a re-export at `types/api.ts`. Do not move `auth.ts` in the same commit.
2. **Transport utilities:** move `errors.ts`, then `client.ts` and `request.ts`, preserving `services/api/*` compatibility modules. Build after each move because `client.ts` depends on app config and auth storage.
3. **Generic hooks:** move `useAsyncRequest.ts`, then `useResourceList.ts`, retaining compatibility modules under `hooks/`.
4. **Feedback and overlay primitives:** move `AsyncStates.tsx` and `Dialog.tsx` into shared UI folders. Verify pages that use errors, dialogs, and status badges.
5. **Application-shell components:** move `Header.tsx` and `Sidebar.tsx` to `app/layouts/components/`, then update only `AdminLayout` imports. Preserve old module re-exports until build and navigation checks pass.
6. **Route guard:** move `ProtectedRoute.tsx` to `app/router/` and update the router import. Verify signed-out redirect before proceeding.
7. **Auth ownership:** move `auth.ts`, `authStorage.ts`, and `useSession.ts` as a single authenticated-session unit, using compatibility re-exports. Verify login, remembered session, session-only login, logout, expiry, and 401 handling.
8. **Permissions:** move `access.ts` and `PermissionGuard.tsx` after auth storage paths are stable. No logic changes.
9. **Toast organization:** only if desired, separate provider and hook in a dedicated commit. This is optional and should not be combined with any other provider move.
10. **Feature API split:** only after all preceding infrastructure moves are stable. Split `backend.ts` one domain at a time while preserving its exports as a barrel.

## Dependency updates by phase

| Phase | Imports requiring review |
| --- | --- |
| Types | API files, hooks, storage, auth page, permissions, feature pages that import `ResourceRow`. |
| Transport | `backend.ts`, `useAsyncRequest.ts`, every direct `toApiError` consumer. |
| Hooks | `ProtectedRoute`, `CrudResourcePage`, `ResourceTablePage`, `WorkflowWorkspace`, order/inventory pages, login page. |
| Common UI | Every page importing dialog/toast/async states; `main.tsx` for ToastProvider. |
| Shell | `app/layouts/AdminLayout.tsx`, router imports for ProtectedRoute. |
| Auth | LoginPage, API client, Header, Sidebar, ProtectedRoute, PermissionGuard, `permissions/access.ts`. |
| Permissions | Sidebar and PermissionGuard only, plus any future guarded actions. |

## Validation plan

After each migration commit:

1. Run `npm.cmd run build` from `frontend/`.
2. Run `npm.cmd run lint` from `frontend/`; distinguish pre-existing warnings from new warnings.
3. Run `git diff --check`.
4. Use `rg` to confirm old paths are either absent from imports or intentionally retained as compatibility re-exports.
5. Perform focused smoke checks for the moved concern:
   - transport: public health plus safe authenticated test requests;
   - auth: login, reload, logout, protected route, expired session, 401;
   - shell: sidebar open/close, navigation routes, mobile menu;
   - dialog/toast: one detail dialog and one mutation feedback event on disposable data.

The repository currently has no frontend `test` script. Do not claim automated coverage until a separately approved testing effort adds it.

## Rollback plan

- Keep each move isolated to one commit.
- Retain one-line compatibility re-exports at the old path until all consumers are migrated and validated.
- If build, route, auth, or API behavior fails, revert only the most recent infrastructure move.
- Do not rename persisted browser storage keys, route paths, API methods, or permission logic as part of a location-only rollback.
- Do not remove old compatibility modules until a later dedicated cleanup commit, after a repository-wide import search and a successful full build/lint cycle.
