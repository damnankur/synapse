# Synapse Authentication and Authorization Integration Guide

This document describes the current frontend-only mock auth flow and how to connect real backend authentication and authorization later.

## Current State (Dummy API Mode)

The login and landing experience is implemented in:

- `src/app/components/LandingPage.tsx`

Current behavior:

1. User submits sign-in/sign-up form.
2. `mockAuthenticate(...)` simulates identity verification and returns:
   - `accessToken`
   - `refreshToken`
   - user payload
3. `mockAuthorize(...)` simulates permission lookup and returns scopes:
   - `projects.read`
   - `projects.apply`
   - `projects.publish`
   - `profile.update`
4. Session data is stored in `localStorage`:
   - `synapse_access_token`
   - `synapse_refresh_token`
   - `synapse_permissions`
   - `synapse_session_user`

Authentication gate:

- `src/app/App.tsx` checks for `synapse_access_token`.
- If token exists, app shell renders.
- If not, `LandingPage` renders.

## Suggested Backend API Contract

Use these endpoints (example paths):

1. `POST /api/auth/register`
2. `POST /api/auth/login`
3. `POST /api/auth/refresh`
4. `POST /api/auth/logout`
5. `GET /api/auth/me`
6. `GET /api/auth/permissions`

### Example Request/Response

`POST /api/auth/login`

Request:

```json
{
  "email": "jordan.patel@university.edu",
  "password": "securePassword"
}
```

Response:

```json
{
  "accessToken": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "expiresIn": 3600,
  "user": {
    "id": "user_123",
    "name": "Jordan Patel",
    "email": "jordan.patel@university.edu",
    "role": "researcher"
  }
}
```

`GET /api/auth/permissions`

Response:

```json
{
  "permissions": [
    "projects.read",
    "projects.apply",
    "projects.publish",
    "profile.update"
  ]
}
```

## Where To Replace Mock Calls

In `src/app/components/LandingPage.tsx`:

- Replace `mockAuthenticate(...)` with real API call to:
  - `POST /api/auth/login` (sign-in)
  - `POST /api/auth/register` (sign-up)
- Replace `mockAuthorize(...)` with:
  - `GET /api/auth/permissions` (or include permissions in login response)

Suggested extraction:

- Move auth API calls to `src/app/services/authService.ts`
- Keep UI component focused on form + state only

## Authorization Model Recommendation

Use RBAC + permission scopes:

1. Role level:
   - `researcher`
   - `project_owner`
   - `admin`
2. Permission scope level:
   - `projects.read`
   - `projects.apply`
   - `projects.publish`
   - `profile.update`
   - `admin.users.manage` (future)

Frontend checks:

- Keep permission list in memory and/or context.
- Gate UI actions by permission checks before rendering action buttons.

## Token and Session Strategy

For production, recommended security model:

1. Store `accessToken` in memory (preferred) or short-lived secure storage.
2. Store `refreshToken` in secure HTTP-only cookie.
3. Refresh tokens using `POST /api/auth/refresh` when access token expires.
4. Clear session on `401 Unauthorized` or logout.

Current demo uses `localStorage` only for simplicity.

## Middleware / Guarding (Future)

When real backend is connected:

1. Add a central fetch/axios wrapper that:
   - attaches bearer token
   - handles 401
   - refreshes token once
   - retries original request
2. Add route/page guards:
   - unauthenticated users -> landing/login page
   - unauthorized users -> hide/disable protected actions

## Error Handling Expectations

Handle these backend error classes in UI:

1. Invalid credentials (401)
2. Account blocked/suspended (403)
3. Validation errors (400)
4. Rate limiting (429)
5. Service outage (5xx)

Show user-friendly messages and keep technical details in logs.

## Next Integration Checklist

1. Create `authService.ts` with real HTTP calls.
2. Replace mock functions in `LandingPage.tsx`.
3. Add refresh-token flow in a request interceptor.
4. Move auth state to context store if multi-page role checks increase.
5. Add unit tests for:
   - login success/failure
   - permission load
   - token refresh path
