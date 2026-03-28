# Change Log

This file tracks implemented code changes in this workspace.

## 2026-03-28

### 1. URL Bar Sync for Frontend Navigation
- Issue: UI components were switching views, but browser URL was not changing.
- Root cause: Navigation was state-only (`activeTab`) with no browser history updates.
- Files changed:
  - `src/app/store/AppContext.tsx`
- What was added:
  - Tab-to-path mapping and path-to-tab mapping.
  - Initial tab resolution from `window.location.pathname`.
  - `window.history.pushState` on tab change.
  - `popstate` listener to sync back/forward browser actions with UI tab state.
- Validation:
  - Production build passed with `npm run build`.

### 2. Auth-Aware History Stack and Logout Route Guard
- Issue: Browser back/forward could traverse stale auth states, and logout did not reliably reset route history behavior.
- Root cause:
  - Logout flow in profile used a hard page reload and local tab state changes instead of centralized auth transition handling.
  - Login transition used push-style history, which retained previous logged-out route in stack.
  - No auth-state route guard to normalize URL while logged out.
- Files changed:
  - `src/app/App.tsx`
  - `src/app/store/AppContext.tsx`
  - `src/app/components/User.tsx`
- What was changed:
  - Extended `setTab` to support `{ replaceHistory: true }` and use `history.replaceState` when needed.
  - On successful authentication, route now transitions to dashboard with history replacement.
  - Centralized logout handling in `AppShell` (clear session + set auth false + replace URL to `/auth`).
  - Added unauthenticated URL guard effect to force `/auth` path while logged out.
  - Updated `UserProfile` logout to call parent `onLogout` callback.
- Validation:
  - Production build passed with `npm run build`.

### 3. Database-Backed Token Sync in App Context
- Issue: Token values in app state could be mutated locally, causing drift from database-backed user token state.
- Root cause:
  - App context included local token mutation actions for apply/complete/purchase flows.
  - Purchase flow updated tokens in frontend state without persisting through backend user profile API.
- Files changed:
  - `src/app/store/AppContext.tsx`
- What was changed:
  - Removed local token mutation in `APPLY_TO_PROJECT` reducer action.
  - Removed local token mutation in `COMPLETE_MY_ROLE` reducer action.
  - Removed `UPDATE_TOKENS` reducer action usage.
  - Updated `purchaseTokens` to persist updated token balance via `updateCurrentUserProfile(...)`.
  - Hydrated AppContext token state from backend response (`result.user`) after purchase.
- Validation:
  - Production build passed with `npm run build`.

### 4. Project Application and Completion Workflow Alignment
- Issue:
  - The application lifecycle in UI/backend was not fully aligned with the required flow:
    - user pending applications were session-local in the dashboard sidebar,
    - approved contributors could remain in active workspace until whole-project completion,
    - owner did not receive completion reward when marking project complete.
- Root cause:
  - Dashboard pending list used `appliedProjectIds` from frontend session state instead of backend application status.
  - Active project shaping included contributor applications even after owner approval.
  - Owner completion endpoint finalized project status without rewarding the owner account.
- Files changed:
  - `server/src/controllers/project.controller.js`
  - `server/src/routes/project.routes.js`
  - `src/app/services/projects.ts`
  - `src/app/types/index.ts`
  - `src/app/components/Dashboard.tsx`
- What was changed:
  - Added `GET /api/projects/applications/pending` for authenticated user pending applications.
  - Dashboard pending sidebar now loads from backend (`fetchPendingApplications`) and shows only truly pending records.
    - Rejected applications disappear from pending.
    - Accepted applications move into active workspace (via existing active-project flow).
  - Contributor active workspace shaping now excludes applications already approved by owner, so approved contributors move out of active.
  - Contributor archive now includes approved submissions immediately (even if owner project is still in-progress), satisfying user-side completion-on-approval.
  - Owner completion reward implemented in `completeProjectByOwner`:
    - owner gets +20 tokens on project completion,
    - owner token transaction is stored,
    - owner archive card now reflects reward.
  - Owner queue action label updated from `Select` to `Accept` for clarity.
  - Removed auto-approval dependency from active-project load path (`getActiveProjects`) so completion remains owner-approval driven.
  - Dashboard token-economy and owner-control text updated to match the new approval-based lifecycle.
- Validation:
  - Frontend production build passed with `npm run build`.
  - Backend syntax checks passed:
    - `node --check server/src/controllers/project.controller.js`
    - `node --check server/src/routes/project.routes.js`

### 5. Owner-Only Project Completion Gate for Publisher Reward
- Issue:
  - Projects could be auto-marked `completed` after contributor approvals, which could skip owner-triggered completion flow and owner reward timing.
- Root cause:
  - `recomputeProjectStatus(...)` promoted projects to `completed` when all accepted contributors had approved submissions.
- Files changed:
  - `server/src/controllers/project.controller.js`
- What was changed:
  - Updated `recomputeProjectStatus(...)` to never auto-complete projects.
  - Non-completed projects now recompute to:
    - `open` when no active contributors,
    - `in-progress` when active contributors exist.
  - Final `completed` transition remains exclusively in `completeProjectByOwner(...)`, where publisher reward is credited and persisted.
- Validation:
  - Backend syntax check passed with `node --check server/src/controllers/project.controller.js`.

### 6. Multi-Slot Same-Role Demand in Project Posting
- Issue:
  - Publishers could not request multiple contributors for the same role in one project post.
- Root cause:
  - Post Project UI prevented duplicate role entries.
  - Backend project creation deduplicated `requiredRoles`.
- Files changed:
  - `src/app/components/PostProject.tsx`
  - `src/app/components/ProjectCard.tsx`
  - `server/src/controllers/project.controller.js`
  - `server/src/models/db.js`
- What was changed:
  - Post Project form now supports role slot count input (e.g., `Data Analyst x3`).
  - Added one-click slot creation by expanding same role multiple times in `requiredRoles`.
  - Role chips in post form aggregate counts and allow decrementing one slot at a time.
  - Backend now preserves duplicate `requiredRoles` entries via a dedicated role sanitizer.
  - Feed project cards now aggregate duplicate roles for display as `Role xN`.
  - Added schema note clarifying duplicate `requiredRoles` entries represent multiple same-role slots.
- Validation:
  - Frontend production build passed with `npm run build`.
  - Backend syntax checks passed:
    - `node --check server/src/controllers/project.controller.js`
    - `node --check server/src/models/db.js`

### 7. User Contact Details with Visibility Controls
- Issue:
  - User profile did not support contact details (email/phone) and had no privacy controls for whether contact info should be visible to other users.
- Root cause:
  - User model and API response shape did not include phone or visibility flags.
  - Profile edit form did not expose contact fields or per-field visibility toggles.
- Files changed:
  - `server/src/models/db.js`
  - `server/src/controllers/auth.controller.js`
  - `server/src/controllers/user.controller.js`
  - `server/src/controllers/project.controller.js`
  - `src/app/types/index.ts`
  - `src/app/data/mockData.ts`
  - `src/app/store/AppContext.tsx`
  - `src/app/components/User.tsx`
- What was changed:
  - Added `phone`, `isEmailVisible`, and `isPhoneVisible` to user schema.
  - Included contact fields in backend user payload mapping across auth, user profile, and project controller responses.
  - Added backend profile update support for:
    - email update with format + uniqueness validation,
    - phone update with format validation,
    - boolean visibility updates for email and phone.
  - Extended frontend `User` type and default mock user with contact fields.
  - Extended app user normalization to preserve new contact values safely.
  - Updated profile UI to:
    - edit contact email and phone,
    - toggle visibility state per field (`Visible` / `Hidden`),
    - validate contact values before save,
    - persist these values through existing profile save API.
- Validation:
  - Backend syntax checks passed:
    - `node --check server/src/controllers/user.controller.js`
    - `node --check server/src/controllers/auth.controller.js`
    - `node --check server/src/controllers/project.controller.js`
  - Frontend production build passed with `npm run build`.

### 8. Contextual Profile Visibility Between Publisher and Applicants
- Issue:
  - Dashboard did not allow opening contextual user/publisher profiles from application workflows.
  - Contact information needed rule-based visibility:
    - hidden during pending stage,
    - unlocked only after proposal acceptance,
    - still controlled by each user’s visibility toggles.
- Root cause:
  - Pending and active project payloads lacked owner/publisher identifiers for profile lookup.
  - No backend endpoint existed to return a “platform profile” with project-context contact gating.
  - Dashboard cards/rows were not wired as clickable profile-entry points.
- Files changed:
  - `server/src/controllers/project.controller.js`
  - `server/src/controllers/user.controller.js`
  - `server/src/routes/user.routes.js`
  - `src/app/types/index.ts`
  - `src/app/services/user.ts`
  - `src/app/components/Dashboard.tsx`
- What was changed:
  - Enriched dashboard project payloads:
    - `GET /projects/applications/pending` now includes publisher identity fields (`publisherUserId`, `publisherName`, `publisherRole`).
    - `GET /projects/active` now includes owner identity fields for both owner and contributor workspace cards (`ownerUserId`, `ownerName`, `ownerRole`).
  - Added new authenticated profile endpoint:
    - `GET /api/users/:userId/platform-profile?projectId=<id>`
    - Returns platform profile details (basic info, skills, active/past project stats/lists).
    - Applies contact gating based on workflow context:
      - pending/no accepted link: contact stays hidden,
      - accepted owner↔contributor relation on that project: contact channel unlocks,
      - email/phone values are still shown only if target user enabled visibility in Manage Profile,
      - self-profile view always returns own contact values.
  - Added frontend typed service method `fetchPlatformProfile(...)`.
  - Added dashboard profile preview modal and click-through entry points:
    - applicant name clickable in owner applicant/review/contributor lists,
    - pending application project cards clickable to open publisher profile,
    - contributor active workspace includes “View Publisher Profile” action.
  - Added frontend type models for platform profile payloads.
- Validation:
  - Backend syntax checks passed:
    - `node --check server/src/controllers/user.controller.js`
    - `node --check server/src/controllers/project.controller.js`
    - `node --check server/src/routes/user.routes.js`
  - Frontend production build passed with `npm run build`.

## Entry Template (for next changes)

### N. <Short change title>
- Issue:
- Root cause:
- Files changed:
  - `<path/to/file>`
- What was changed:
  -
- Validation:
  -
