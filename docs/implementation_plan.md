# Frontend-Backend Integration Plan

This plan outlines the steps to migrate the frontend of SupervisorMatch from using `localStorage` to communicating with the fully functional NestJS backend API.

## Proposed Changes

### `src/lib/api.js`
- Create a new API utility file to handle HTTP requests (using `fetch`), attach the `Authorization: Bearer <token>` header, and parse JSON responses.

### `src/context/AppContext.jsx`
- Remove `seededSupervisors`, `defaultUsers`, and `localStorage` generic wrappers for entities.
- Rewrite all state mutation functions to be `async` and use the API:
  - `loginUser` -> `POST /auth/login`
  - `registerUser` -> `POST /auth/register`
  - `logoutUser` -> `POST /auth/logout`
  - `sendRequest` -> `POST /requests`
  - `updateRequestStatus` -> `PATCH /requests/:id/status`
  - `updateStudentProfile` -> `PATCH /users/me`
  - `updateSupervisorProfile` -> `PATCH /supervisors/:id/profile`
  - `addSupervisorTopic` -> `POST /supervisors/:id/topics`
  - `removeSupervisorTopic` -> `DELETE /supervisors/:id/topics/:topicId`
- Add initial data fetching (e.g. `useEffect` that calls `/users/me` if an access token exists to restore the session).

### UI Components
- Update components that call context methods to handle `async` behavior (using `await` where necessary) and manage possible API errors.
