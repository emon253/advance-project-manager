# Carbarn APM — Backend Requirements & Implementation Plan

Target repo: `/Volumes/workspace/yasin/apm-app-service` · Frontend: this repo (React, mock provider in `src/app/providers.jsx` is the API contract).

Every requirement below was derived from the working UI. The mock provider's exported actions ARE the endpoint list; the permission matrix in `src/app/permissions.js` and the plan catalog in `src/modules/Billing/util/billingUtils.js` must be mirrored server-side exactly.

---

## 1. Technology Stack

* **Runtime:** Java 17 (LTS)
* **Framework:** Spring Boot 3.x
* **Database:** MySQL 8.0+
* **Persistence:** Spring Data JPA (Hibernate)
* **Mapping/Boilerplate:** Lombok + hand-coded Converters (skip MapStruct unless converters get repetitive)
* **Security:** Spring Security, stateless JWT (access + refresh token)
* **Validation:** spring-boot-starter-validation (Hibernate Validator)
* **Build:** Maven
* **Migrations:** Flyway (`src/main/resources/db/migration`) — never `ddl-auto=update` beyond local dev
* **API docs:** springdoc-openapi (swagger-ui) — free documentation for the frontend

## 2. Layered Architecture

```
src/main/java/com/carbarn/projectmanager
├── config/                  # SecurityConfig, JwtConfig, CorsConfig, OpenApiConfig
├── controller/              # REST controllers — thin: validate, delegate, return DTO
├── domain/                  # JPA entities
│   ├── audit/               # BaseAuditEntity (createdAt/updatedAt/createdBy), AuditListener
│   └── enums/               # WorkspaceRole, WorkspaceType, TaskPriority, InviteStatus, PlanId, SubscriptionStatus, NotificationType, ProjectStatus
├── dto/
│   ├── request/             # CreateTaskDto, InviteMemberDto, ChangePlanDto…
│   └── response/            # TaskResponseDto, PageResponse<T>…
├── exception/               # GlobalExceptionHandler (@RestControllerAdvice), ApiException hierarchy
├── repository/              # Spring Data interfaces
├── service/                 # Interfaces + impls; ALL business rules live here
├── converter/               # dtoToEntity / entityToDto / patch-update helpers
└── util/                    # JwtUtil, DateUtil, TokenGenerator
```

**Clean-code ground rules (no over-engineering):**
- One service per aggregate (WorkspaceService, TaskService…), constructor injection, no field injection.
- No generic "BaseService", no CQRS, no events/queues, no microservices, no caching layer in v1.
- Controllers never touch repositories; services never build HTTP responses.
- All authorization checks in the service layer via a single `PermissionService` (see §5).
- Consistent envelopes (§7). DTOs only over the wire — never expose entities.

## 3. Data Model (MySQL via JPA entities)

All tables: `id BIGINT AUTO_INCREMENT PK`, `created_at`, `updated_at` (from `BaseAuditEntity`). FKs indexed. `ON DELETE` behavior noted.

| Entity | Key fields | Relations / notes |
|---|---|---|
| **User** | name, email (unique), password_hash, avatar_initials, avatar_color, phone, email_verified (bool), enabled | soft requirements: email lowercase-unique |
| **Workspace** | name, logo_key (string — the frontend maps it to an icon), description, type (`PERSONAL`/`COMPANY`), archived (bool), owner → User | delete cascades memberships/projects (service-orchestrated, not DB cascade) |
| **WorkspaceMember** | workspace FK, user FK, role (`OWNER/ADMIN/MANAGER/MEMBER/VIEWER`) | unique(workspace,user). Owner row kept in sync with `workspace.owner` |
| **Invitation** | workspace FK, email, invitee_name, role, token (unique, 32+ chars random), status (`PENDING/ACCEPTED/REVOKED/EXPIRED`), invited_by → User, expires_at | dedupe: unique(workspace,email) where status=PENDING (enforce in service) |
| **Project** | workspace FK, name, description, icon_key, color (#hex), status (`PLANNING/ACTIVE/ON_HOLD/COMPLETED/ARCHIVED`), start_date, deadline | members: `project_member(project_id,user_id)` join table |
| **TaskStatus** | workspace FK, name, style keys (bg/text/border strings as stored by UI), icon_key, is_default, is_system, sort_order | per-workspace custom statuses; rename propagates to tasks (single UPDATE) |
| **Task** | project FK, title, description, status → TaskStatus, priority (`LOW/MEDIUM/HIGH/URGENT`), assignee → User (nullable), start_date, due_date, estimated_hours, actual_hours (decimal 6,2), recurring (bool) | tags: `task_tag(task_id, tag_id)`; watchers: `task_watcher(task_id,user_id)`; dependencies: `task_dependency(task_id, depends_on_task_id)` |
| **Tag** | workspace FK, name, color_style | |
| **ChecklistItem** | task FK, title, completed (bool), sort_order | |
| **Comment** | task FK, author → User, body TEXT | |
| **Attachment** | owner_type (`TASK/PROJECT`), owner_id, file_name, size_bytes, content_type, storage_key, uploaded_by → User | multipart upload → local disk in dev (`storage/` folder), path behind a `FileStorageService` interface so S3 can swap in later. **Replaces the frontend's base64 hack.** Max 10 MB v1 |
| **TaskActivity** | task FK, actor → User, text | append-only |
| **WorkspaceActivity** | workspace FK, actor → User, text | append-only feed, keep latest N=200 per workspace (scheduled cleanup optional, not v1) |
| **Notification** | recipient → User, workspace FK, type (enum: ASSIGNED, MENTION, DUE_SOON, OVERDUE, STATUS_CHANGED, FILE_ATTACHED, MILESTONE_RESCHEDULED, PROJECT_UPDATE, REMINDER, PLAN_UPDATED, INVITE), title, message, task FK (nullable), project FK (nullable), read (bool) | |
| **NotificationPreference** | user FK (unique), in_app, email, push, daily_summary, weekly_summary, due_reminders, mentions, project_updates (bools) | one row per user, created on signup |
| **Subscription** | workspace FK (unique), plan (`FREE/PRO/BUSINESS`), billing_interval (`MONTHLY/YEARLY`), seats, status (`ACTIVE/TRIALING/CANCELED`), renews_at, trial_ends_at, pm_brand, pm_last4 | plan limits are **code constants** (PlanCatalog class mirroring `billingUtils.js`), not DB rows |
| **Invoice** | subscription FK, description, amount_cents, currency, status (`PAID`), issued_at | v1 mock-generates on plan change; Stripe integration later replaces the write path only |
| **RefreshToken** | user FK, token (unique), expires_at, revoked | rotation on refresh |
| **VerificationToken** | user FK, token, purpose (`EMAIL_VERIFY/PASSWORD_RESET`), expires_at, used | |
| **Template** + **TemplateTask** | workspace-agnostic seed data (name, task titles) | read-only v1, seeded by Flyway |
| **AutomationRule** | workspace FK, rule_key (`COMPLETE_CLEANUP`, `URGENT_ALERT`), active (bool) | evaluated synchronously in TaskService on create/update |

## 4. Authentication & Account Lifecycle

JWT stateless: access token 15 min, refresh token 30 days (rotated). `Authorization: Bearer`. BCrypt passwords.

| Endpoint | Notes |
|---|---|
| `POST /api/v1/auth/register` | `{name, email, password, accountType: PERSONAL\|COMPANY, companyName?}` → creates user (unverified), provisions workspace: company → `companyName` (type COMPANY), personal → "<First>'s Space" (PERSONAL); creates FREE subscription + default TaskStatuses + NotificationPreference; sends verification email. Returns tokens (login allowed pre-verification; UI shows verify screen). |
| `POST /api/v1/auth/login` | `{email, password}` → `{accessToken, refreshToken, user}` |
| `POST /api/v1/auth/refresh` | rotate refresh token |
| `POST /api/v1/auth/logout` | revoke refresh token |
| `POST /api/v1/auth/verify-email` | `{token}` (from emailed link `/verify-email?...`) |
| `POST /api/v1/auth/resend-verification` | rate-limit 1/min |
| `POST /api/v1/auth/forgot-password` | always 200 (no user enumeration); emails reset link |
| `POST /api/v1/auth/reset-password` | `{token, newPassword}` |
| `GET /api/v1/me` / `PATCH /api/v1/me` | profile read/update (name, phone, avatar color) |
| `PATCH /api/v1/me/password` | `{currentPassword, newPassword}` |
| `DELETE /api/v1/me` | account deletion: remove memberships, unassign tasks (`assignee=null`), anonymize comments author to "Deleted user", block if sole OWNER of a workspace with other members (must transfer first) → 409 |
| SSO (Google/Apple/Microsoft) | **Phase 5 / optional** — spring-oauth2-client; UI buttons exist but mock |

Session expiry: 401 with `code: "TOKEN_EXPIRED"` → frontend redirects `/login?expired=1`.

## 5. Authorization (RBAC) — mirror of `src/app/permissions.js`

Roles: `OWNER > ADMIN > MANAGER > MEMBER > VIEWER` (workspace-scoped, from WorkspaceMember).

| Permission | Roles |
|---|---|
| manageBilling | OWNER, ADMIN |
| manageWorkspace | OWNER, ADMIN |
| archiveWorkspace | OWNER, ADMIN |
| deleteWorkspace | OWNER |
| transferOwnership | OWNER |
| manageMembers | OWNER, ADMIN |
| manageProjects | OWNER, ADMIN, MANAGER |
| editTasks | OWNER, ADMIN, MANAGER, MEMBER |

Implementation: single `PermissionService.check(userId, workspaceId, Permission.X)` throwing `ForbiddenException` (→ 403). Called at the top of every service method. A custom `@RequiresPermission` annotation + aspect is acceptable later; start with explicit calls (simpler, debuggable). Every task/project op resolves its workspace first — **objects are always authorized through their workspace**.

## 6. API Catalog (prefix `/api/v1`, all auth'd unless noted)

**Workspaces** — `GET /workspaces` (mine) · `POST /workspaces` · `GET/PATCH /workspaces/{id}` · `POST /workspaces/{id}/archive` + `/restore` · `DELETE /workspaces/{id}` · `POST /workspaces/{id}/transfer-ownership {newOwnerId}` · `POST /workspaces/{id}/leave` (409 if owner or last workspace) · members: `GET /workspaces/{id}/members`, `PATCH .../members/{userId} {role}`, `DELETE .../members/{userId}`.

**Invitations** — `POST /workspaces/{id}/invites {email, name?, role}` (dedupes pending + members → 409; **seat check: members + pending invites < plan member limit** → 402 `PLAN_LIMIT`) · `GET /workspaces/{id}/invites?status=PENDING` · `POST /invites/{id}/resend` · `DELETE /invites/{id}` (revoke) · **public** `GET /invites/token/{token}` (workspace name/logo, inviter, role, member count — for the accept page) · **public** `POST /invites/token/{token}/accept {name?, password?}` — a **signed-in invitee** (Bearer token whose account matches the invite's email) joins one-click, body optional; **anonymous accepts require `password`** (verifies the existing account matched by email → 401 without it; else creates the account → 400 without it). Required because the endpoint mints auth tokens and invite tokens are visible to workspace admins in create/list responses — a password-less anonymous join would let an admin mint tokens for an invited existing user. → returns tokens + workspaceId. Expiry: 14 days → status EXPIRED on read.

**Projects** — `GET /workspaces/{id}/projects` · `POST /workspaces/{id}/projects` (**plan limit: project count** → 402) · `GET/PATCH/DELETE /projects/{id}` · `POST /projects/{id}/archive|restore` · members add/remove · `POST /projects/{id}/instantiate-template/{templateId}`.

**Task statuses** — `GET/POST /workspaces/{id}/task-statuses` · `PATCH /task-statuses/{id}` (rename propagates; set-default clears others) · `DELETE /task-statuses/{id}` (reassign its tasks to default) — Pro-plan feature (`customStatuses`) → 402 on Free.

**Tasks** — `GET /workspaces/{id}/tasks?projectId&status&priority&assigneeId&segment=mine|today|upcoming|completed&page&size` (paginated, filtered server-side — matches UI filter toolbar + "Load more") · `POST /projects/{id}/tasks` · `GET/PATCH/DELETE /tasks/{id}` · `POST /tasks/{id}/duplicate` · checklist CRUD (`/tasks/{id}/checklist`, `PATCH /checklist/{itemId}` toggle) · comments (`GET/POST /tasks/{id}/comments`) · attachments (`POST /tasks/{id}/attachments` multipart, `GET /attachments/{id}/download`, `DELETE`) · watchers add/remove · time: `POST /tasks/{id}/time {hours}` (manual log; the UI timer submits accumulated hours on stop — no server-side running timers).
Side-effects in TaskService: status change → TaskActivity + notification to assignee/watchers; assignment → ASSIGNED notification; due-date change on milestone-tagged task → MILESTONE_RESCHEDULED; automation rules (§3) evaluated after each mutation.

**Tags** — `GET/POST /workspaces/{id}/tags`.

**Notifications** — `GET /me/notifications?unread&type&search&page&size` · `PATCH /notifications/{id} {read}` · `POST /me/notifications/mark-all-read` · `DELETE /me/notifications/read` (clear read) · `DELETE /notifications/{id}` · `GET/PUT /me/notification-preferences`. Preferences gate creation server-side (mirror of `pushNotification` filtering in providers.jsx). Email/push delivery: log-only in v1.

**Activity** — `GET /workspaces/{id}/activity?page&size` · `GET /tasks/{id}/activity`.

**Billing** — `GET /workspaces/{id}/subscription` (plan, status, seats, renewsAt, trialEndsAt, pm, usage: projectCount/memberCount/pendingInvites vs limits) · `POST /workspaces/{id}/subscription/change {plan, interval, seats}` (validates seats ≥ current members; generates Invoice; v1 mock-pays) · `POST .../subscription/cancel` (→ FREE at period end; v1: immediate CANCELED) · `POST .../subscription/trial {plan}` (14 days, once per workspace, no card) · `GET .../invoices`. `PlanCatalog` constants = `billingUtils.js` (Free: 3 projects/5 members; Pro: ∞/25 + AI + custom statuses + automation; Business: ∞/∞). Limit violations → **402** `{code:"PLAN_LIMIT", limit, current}` — the UI's UpgradeModal trigger. Stripe: Phase 5 (checkout session + webhook), schema already compatible.

**Search** — `GET /workspaces/{id}/search?q&type=tasks|projects|people` — `LIKE %q%` on names/titles/emails, grouped result DTO. No Elasticsearch.

**Dashboard** — `GET /workspaces/{id}/dashboard` — one endpoint returning: project totals by status, per-project progress (done/total tasks, %), per-member open-task counts (workload dials), recent activity (top 10). Single service with a few aggregate queries.

**AI (optional, Phase 5)** — `POST /ai/plan` and `POST /ai/refine` proxying Gemini with the server-held API key (frontend currently mocks; `.env.example` already anticipates a key).

## 7. Conventions

- **Pagination:** Spring `Pageable` (`?page=0&size=8&sort=`) → `PageResponse<T> {content, page, size, totalElements, totalPages, hasNext}`. UI's "Load more (N remaining)" needs `totalElements`.
- **Errors:** RFC-ish envelope from `GlobalExceptionHandler`: `{timestamp, status, code, message, fieldErrors?[]}`. Codes the UI switches on: `TOKEN_EXPIRED` 401, `FORBIDDEN` 403, `PLAN_LIMIT` 402, `DUPLICATE` 409, `VALIDATION` 400, `NOT_FOUND` 404.
- **Naming:** plural resources, kebab-free camelCase JSON, ISO-8601 UTC datetimes.
- **Validation:** annotations on request DTOs (`@NotBlank`, `@Email`, `@Size`); business rules in services.
- **Transactions:** `@Transactional` on service methods that write; read-only where applicable.
- **Testing:** service-layer unit tests (JUnit 5 + Mockito) for permission checks, plan limits, invite lifecycle, ownership transfer; one `@SpringBootTest` + Testcontainers-MySQL smoke per controller group. No 100%-coverage theater — test the rules that can lose data or money.
- **Seed data:** Flyway `R__seed_dev.sql` (dev profile only) reproducing the frontend mock dataset (Yasin/Rakib/Nadia/Mehnaz/Sohan, 3 workspaces incl. roles, 5 projects, tasks, pro/trial subscriptions) so the UI drops in with familiar data.

## 8. Implementation Phases

| Phase | Scope | Exit criteria |
|---|---|---|
| **1. Foundation** | Project skeleton, Flyway baseline schema, User/auth (register+workspace provisioning, login, refresh, verify, forgot/reset), JWT filter, GlobalExceptionHandler, OpenAPI | Register→verify→login round-trip from the real UI |
| **2. Workspace core** | Workspaces CRUD/archive, members, roles, PermissionService, transfer ownership, leave, invitations (full lifecycle incl. public accept), activity feed | Invite flow works end-to-end from UI |
| **3. Work management** | Projects, task statuses, tasks + filters/pagination, checklist, comments, attachments (FileStorageService), tags, time logging, task activity, automation rules, templates | Tasks page fully live incl. Load more |
| **4. Notifications + billing + dashboard** | Notifications + preferences, subscription/plan limits (402 flow), invoices (mock pay), trial, dashboard aggregates, search | Billing page + paywalls live |
| **5. Later / optional** | Stripe checkout + webhooks, real email (SES/SMTP → templates), SSO OAuth2, AI proxy, S3 storage, rate limiting | — |

**Explicitly NOT in scope (avoid over-engineering):** microservices, Kafka/queues, Redis, WebSockets (UI toasts are client-side; polling `GET /me/notifications` is fine in v1), soft-delete framework, multi-tenancy beyond workspace scoping, GraphQL, audit-log framework beyond the two activity tables.

## 9. Frontend Integration Checklist (when backend lands)

Backend is **built and committed** (`/Volumes/workspace/yasin/apm-app-service`, Phases 1–4, 72 endpoints, 95 tests, Flyway V1–V6). Base URL `http://localhost:8080/api/v1`, Swagger at `/swagger-ui.html`. Boot: `SPRING_PROFILES_ACTIVE=dev ./mvnw spring-boot:run`.

1. Replace `useMockQuery` internals with real fetch/React Query — the `{isLoading, isError, retry}` contract is already threaded through every list. Pagination envelope is `{content, page, size, totalElements, totalPages, hasNext}` (use `totalElements` for "Load more (N remaining)").
2. Swap provider actions to API calls 1:1 (names match this doc §4–§6).
3. Map error codes: **402 `PLAN_LIMIT`** (body `{code, message, limit, current}`) → UpgradeModal; **401 `TOKEN_EXPIRED`** → `/login?expired=1`; **403 `FORBIDDEN`** → "admin access required" states; **409** codes (`DUPLICATE`, `OWNERSHIP_TRANSFER_REQUIRED`, `LAST_WORKSPACE`, `INVITE_ACCEPTED/REVOKED/EXPIRED`); **400 `VALIDATION`** (with `fieldErrors[]`).
4. Attachments: switch from base64 to `multipart/form-data` (`file` part, 10 MB cap) on `POST /tasks/{id}/attachments`; render via `GET /attachments/{id}/download`.
5. Keep `permissions.js` and `billingUtils.js` in sync with `PermissionService`/`PlanCatalog` (source of truth is now the backend; the frontend copies stay for optimistic UI).
6. InvitePage: one-click accept for signed-in invitees (send Bearer on `POST /invites/token/{token}/accept`); anonymous accepts require name+password (§6).
7. **Enum casing — the one real adapter needed.** The API returns enum *names* UPPERCASE: `plan:"PRO"`, `status:"ACTIVE"/"TRIALING"/"CANCELED"`, `interval:"YEARLY"`, `priority:"URGENT"`, `role:"OWNER"`, workspace `type:"COMPANY"`, notification `type:"ASSIGNED"`, project `status:"ACTIVE"`. The mock uses mixed casing (billingUtils lowercase `"pro"`, priorities title-case `"High"`). Add one normalization layer in the API adapter (e.g. lowercase for billing enums, title-case where `PriorityBadge`/`StatusBadge` expect it) rather than changing the backend — the backend is intentionally consistent (standard REST enum-name serialization). Request bodies accept the same UPPERCASE names.
8. **Money & invoices.** `InvoiceResponse` returns `amountCents` (integer) + `issuedAt` + `status:"PAID"` via the separate `GET /workspaces/{id}/invoices`; the mock reads `inv.amount` (dollars) inline on the subscription. Adapter: fetch the invoices endpoint, map `amountCents/100 → amount`, `issuedAt → date`. `GET /workspaces/{id}/subscription` returns `usage {projects, members, pendingInvites, projectLimit, memberLimit}` for the meters.
9. **Task status flags.** `TaskStatusResponse` carries `isCompleted/isCancelled/isStarted` (seeded on the 6 system statuses) — use these instead of matching the literal name "Completed" (statuses are renamable). Completion, project progress %, and the task segments (`mine/today/upcoming/completed`) are all flag-keyed server-side and match `useTasksState`.
10. **Notifications delivery model.** In-app rows only in v1 (email/push are logged, not sent). Poll `GET /me/notifications?unread=true` for the badge count (no WebSockets in v1); the frontend toast stays client-side. Preference gating is enforced server-side, mirroring `pushNotification`.
11. **Archived-project count divergence** (minor): the backend excludes archived projects from the billing usage meter and dashboard stats; the mock's `canAddProject` counts all. Align the frontend to exclude archived (recommended) or accept the boundary difference.
