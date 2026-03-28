# Frontend to Backend Connection Guide (MongoDB Atlas)

This project currently uses in-memory/mock state from:

- `src/app/data/mockData.ts`
- `src/app/store/AppContext.tsx`

You asked to move toward backend connectivity with Mongo Atlas. This guide gives a clean step-by-step migration path.

## 1) Environment Variables

I added these to your root `.env`:

```env
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@projects.73mpmux.mongodb.net/?appName=Projects
VITE_API_BASE_URL=http://localhost:5000/api
```

Notes:

- `MONGODB_URI` is for backend server use only.
- `VITE_API_BASE_URL` is for frontend API requests.
- Do not expose Mongo credentials in frontend browser code.

## 2) Frontend API Config (already added)

I added:

- `src/app/config/backend.ts`

Use this as the single source of truth for API endpoints in frontend code.

## 3) Create a Backend Service

Create a new folder `server/` (or separate repo) and initialize Node backend:

```bash
mkdir server
cd server
npm init -y
npm install express mongoose cors dotenv
npm install -D nodemon
```

### Suggested `server/.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://<db_username>:<db_password>@projects.73mpmux.mongodb.net/?appName=Projects
CLIENT_ORIGIN=http://localhost:5173
```

### Suggested `server/src/index.js`

```js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }));
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));

await mongoose.connect(process.env.MONGODB_URI);
console.log('MongoDB connected');

app.listen(process.env.PORT || 5000, () => {
  console.log(`API running on port ${process.env.PORT || 5000}`);
});
```

## 4) Create Mongo Models

Create collections that match current frontend structures:

1. `users`
2. `projects`
3. `active_projects` (or merge with projects + status)

Shape should align with:

- `src/app/types/index.ts`

## 5) Implement API Endpoints

Start with these endpoints:

1. `GET /api/bootstrap`
   - returns `{ user, projects, activeProject }` (replacement for `mockData.ts`)
2. `POST /api/projects/:id/apply`
3. `POST /api/projects`
4. `POST /api/active-projects/complete-role`
5. `POST /api/tokens/purchase`
6. `PATCH /api/users/me`

## 6) Controllers and Middleware to Create

To keep the backend maintainable, use this structure:

```text
server/
  package.json
  .env
  src/
    app.js
    server.js
    config/
      db.js
      env.js
    modules/
      auth/
        auth.controller.js
        auth.service.js
        auth.repository.js
        auth.routes.js
        auth.validation.js
      users/
        user.model.js
        user.controller.js
        user.service.js
        user.repository.js
        user.routes.js
        user.validation.js
      projects/
        project.model.js
        project.controller.js
        project.service.js
        project.repository.js
        project.routes.js
        project.validation.js
      activeProjects/
        activeProject.model.js
        activeProject.controller.js
        activeProject.service.js
        activeProject.repository.js
        activeProject.routes.js
      tokens/
        token.controller.js
        token.service.js
        token.routes.js
      bootstrap/
        bootstrap.controller.js
        bootstrap.service.js
        bootstrap.routes.js
    middleware/
      auth.middleware.js
      permission.middleware.js
      validate.middleware.js
      error.middleware.js
      notFound.middleware.js
      asyncHandler.middleware.js
      requestLogger.middleware.js
    utils/
      ApiError.js
      logger.js
    constants/
      permissions.js
      httpStatus.js
```

### Controllers (what to implement)

1. `bootstrap.controller.js`
   - `getBootstrapData(req, res)`
   - Return `{ user, projects, activeProject }` for app initialization.
2. `project.controller.js`
   - `listProjects(req, res)`
   - `createProject(req, res)`
   - `applyToProject(req, res)`
3. `activeProject.controller.js`
   - `completeRole(req, res)` (updates milestone/progress and token reward)
4. `token.controller.js`
   - `purchaseTokens(req, res)` (for now can be dummy payment-backed)
5. `user.controller.js`
   - `getMyProfile(req, res)`
   - `updateMyProfile(req, res)`
6. `auth.controller.js` (recommended)
   - `register(req, res)`
   - `login(req, res)`
   - `refresh(req, res)`
   - `logout(req, res)`

### Middleware (what to implement)

1. `auth.middleware.js`
   - Verify JWT/access token from `Authorization: Bearer <token>`.
   - Attach `req.user = { id, role, permissions }`.
2. `permission.middleware.js`
   - `requirePermission('projects.publish')` style middleware.
   - Return `403` if user lacks permission.
3. `validate.middleware.js`
   - Validate body/params/query with Joi/Zod/express-validator.
   - Return `400` with structured validation errors.
4. `asyncHandler.middleware.js`
   - Wrap async controllers to avoid repeated `try/catch`.
5. `error.middleware.js`
   - Centralized error handling (`500`, custom codes, clean response shape).
6. `notFound.middleware.js`
   - Handle unknown routes with `404`.
7. `requestLogger.middleware.js` (recommended)
   - Request method/path/status/timing logs for debugging.

### Suggested middleware order in `index.js`

1. `requestLogger`
2. `cors`
3. `express.json`
4. route handlers
5. `notFound`
6. `errorHandler`

### Route wiring pattern (example)

```js
router.post(
  '/projects',
  authMiddleware,
  requirePermission('projects.publish'),
  validate(createProjectSchema),
  asyncHandler(createProject)
);
```

This order ensures:

1. user is authenticated,
2. user is authorized,
3. request is valid,
4. controller stays clean and business-focused.

### How controllers should be layered

Use this flow for each feature:

1. `Route`:
   - receives request and attaches middleware chain.
2. `Controller`:
   - handles req/res and calls service.
3. `Service`:
   - contains business logic and orchestration.
4. `Repository`:
   - talks to MongoDB models only.
5. `Model`:
   - Mongoose schema definitions.

This keeps your controllers thin and testable.

## 7) Replace Mock Data in Frontend

Current mock-data bootstrap happens inside:

- `src/app/store/AppContext.tsx`

### Migration order

1. Add loading bootstrap in `AppContext` using `API_ENDPOINTS.bootstrap`.
2. Replace reducer-side fake delays (`setTimeout`) with real `fetch`/API calls.
3. On API success, dispatch existing actions (or create new hydrate actions).
4. Keep toasts as-is for UX continuity.

## 8) Recommended Frontend Service Layer

Create:

- `src/app/services/apiClient.ts`
- `src/app/services/appApi.ts`

This keeps API logic out of UI/state files and makes future auth easier.

## 9) Minimal Example for Bootstrap Fetch

```ts
import { API_ENDPOINTS } from '../config/backend';

export async function fetchBootstrapData() {
  const res = await fetch(API_ENDPOINTS.bootstrap);
  if (!res.ok) throw new Error('Failed to load bootstrap data');
  return res.json();
}
```

## 10) Security Checklist

1. Never expose `MONGODB_URI` via `VITE_` variables.
2. Restrict Atlas network access to trusted IPs.
3. Use dedicated DB user with least privilege.
4. Add request validation on backend (Joi/Zod/express-validator).
5. Add auth middleware before write endpoints.

## 11) What To Update Next (Concrete)

1. Build backend `GET /api/bootstrap` first.
2. Add frontend bootstrap fetch in `AppContext`.
3. Remove direct import of `mockData.ts` once bootstrap works.
4. Migrate each action (`apply`, `publish`, `complete role`, `purchase tokens`) one by one.

## 12) Final End-to-End Example: Users Data from MongoDB to Frontend

This is the full connection flow for user profile data.

### Step 1: Create user model (MongoDB)

`server/src/modules/users/user.model.js`

```js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    initials: { type: String, required: true },
    tokens: { type: Number, default: 0 },
    university: { type: String, required: true },
    department: { type: String, required: true },
    bio: { type: String, required: true },
    skills: [{ type: String }],
    completedProjects: { type: Number, default: 0 },
    joinDate: { type: String, required: true },
    email: { type: String, unique: true, required: true }
  },
  { timestamps: true }
);

export const UserModel = mongoose.model('User', userSchema);
```

### Step 2: Create repository/service/controller

`server/src/modules/users/user.repository.js`

```js
import { UserModel } from './user.model.js';

export async function findUserById(userId) {
  return UserModel.findById(userId).lean();
}

export async function updateUserById(userId, payload) {
  return UserModel.findByIdAndUpdate(userId, payload, { new: true }).lean();
}
```

`server/src/modules/users/user.service.js`

```js
import { findUserById, updateUserById } from './user.repository.js';

export async function getMyProfile(userId) {
  return findUserById(userId);
}

export async function updateMyProfile(userId, payload) {
  return updateUserById(userId, payload);
}
```

`server/src/modules/users/user.controller.js`

```js
import * as userService from './user.service.js';

export async function getMyProfile(req, res) {
  const profile = await userService.getMyProfile(req.user.id);
  return res.json({ user: profile });
}

export async function patchMyProfile(req, res) {
  const updated = await userService.updateMyProfile(req.user.id, req.body);
  return res.json({ user: updated });
}
```

### Step 3: Add routes + middleware

`server/src/modules/users/user.routes.js`

```js
import { Router } from 'express';
import { getMyProfile, patchMyProfile } from './user.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';

const router = Router();

router.get('/me', authMiddleware, requirePermission('profile.update'), getMyProfile);
router.patch('/me', authMiddleware, requirePermission('profile.update'), patchMyProfile);

export default router;
```

Register in `app.js`:

```js
app.use('/api/users', userRoutes);
```

### Step 4: Connect frontend service to `/users/me`

You already have endpoint config in:

- `src/app/config/backend.ts` -> `API_ENDPOINTS.userProfile`

Create frontend service:

`src/app/services/userApi.ts`

```ts
import { API_ENDPOINTS } from '../config/backend';

export async function fetchMyProfile(token?: string) {
  const res = await fetch(API_ENDPOINTS.userProfile, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed to fetch user profile');
  return res.json();
}
```

### Step 5: Hydrate AppContext with backend user data

In `AppContext.tsx`, replace initial user-only bootstrap from `mockData.ts` with API call during app startup:

1. Add a `HYDRATE_BOOTSTRAP` action.
2. On mount, call `fetchMyProfile` (and later full `/bootstrap` endpoint).
3. Dispatch user data to state.

Conceptual flow:

1. Frontend loads app.
2. `AppContext` calls backend.
3. Backend controller reads MongoDB data.
4. Response returns `{ user: {...} }`.
5. Frontend stores it in context and UI updates.

### Step 6: Keep fallback during migration

Until backend endpoints are complete:

1. try API call first,
2. if it fails, fallback to `INITIAL_USER` from `mockData.ts`,
3. log the failure and continue with UI.

This avoids breaking the app while migrating features endpoint-by-endpoint.
