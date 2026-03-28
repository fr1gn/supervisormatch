# SupervisorMatch Backend (NestJS + JSON + TypeScript)

This is a backend implementation of the plan in [../docs/BACKEND_PLAN.md](../docs/BACKEND_PLAN.md), using JSON file storage for diploma pre-defence.

## Stack

- Node.js
- NestJS
- Zod validation
- JWT auth (access token + refresh token cookie)
- JSON persistence in [data/db.json](data/db.json)

## Run

```bash
cd backend
npm install
npm run build
npm start
```

Server URL: `http://localhost:4000`

For auto-reload during development:

```bash
npm run start:dev
```

## Environment Variables

Copy `.env.example` to `.env` and set values.

## Demo Credentials

- Student: `student@test.com` / `demo123`
- Supervisor: `johnson@university.edu` / `demo123`

## Implemented Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh` (extra helper)

### Users

- `GET /users/me`
- `PATCH /users/me`

### Supervisors

- `GET /supervisors`
- `GET /supervisors/:id`
- `PATCH /supervisors/:id/profile`
- `POST /supervisors/:id/topics`
- `DELETE /supervisors/:id/topics/:topicId`

### Requests

- `POST /requests`
- `GET /requests/student`
- `GET /requests/supervisor`
- `PATCH /requests/:id/status`

## Business Rules Covered

- One user has one role (`student` or `supervisor`).
- Duplicate active request is blocked unless previous was `rejected`.
- Accepting a request increases `currentStudents` only when capacity is available.
- Availability can be filtered with `availableOnly=true` on supervisors list.

## Notes

- This backend is intentionally database-free for rapid demonstration.
- Data survives server restarts because it is saved in JSON.
- The service layer and entity structure are prepared for easy migration to PostgreSQL later.
- Backend source is TypeScript in `src/` and compiles to `dist/`.
