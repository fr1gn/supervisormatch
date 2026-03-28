# SupervisorMatch Backend Roadmap (JavaScript + PostgreSQL)

This project currently uses a local frontend state layer for fast development.

## Recommended Backend Stack

- Runtime: `Node.js`
- Framework: `Nest.js`
- ORM: `Prisma` (or `Drizzle`)
- DB: `PostgreSQL`
- Auth: `JWT` + refresh tokens (httpOnly cookies)
- Validation: `zod`

## Core API Modules

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /users/me`
- `PATCH /users/me`
- `GET /supervisors`
- `GET /supervisors/:id`
- `PATCH /supervisors/:id/profile`
- `POST /supervisors/:id/topics`
- `DELETE /supervisors/:id/topics/:topicId`
- `POST /requests`
- `GET /requests/student`
- `GET /requests/supervisor`
- `PATCH /requests/:id/status`

## Suggested PostgreSQL Tables

- `users(id, full_name, email, role, password_hash, phone, created_at)`
- `supervisors(id, user_id, title, department, bio, capacity, current_students, avatar_url)`
- `supervisor_areas(id, supervisor_id, area)`
- `topics(id, supervisor_id, title, area, description, created_at)`
- `requests(id, student_user_id, supervisor_id, message, status, created_at, updated_at)`

## Data Rules

- One user can be a `student` or `supervisor`.
- A request is unique per `(student_user_id, supervisor_id)` unless previous request is rejected.
- When request becomes `accepted`, supervisor capacity is decremented atomically.
- Supervisor availability is computed as `capacity - current_students`.

## Migration Path From Current Frontend

1. Keep current pages/components.
2. Replace AppContext localStorage calls with API service methods.
3. Keep same shape of entities to minimize UI refactor.
4. Add optimistic UI for status updates and topic creation.
5. Add role-based backend authorization middleware.

## Deployment Notes

- Host frontend on Vercel/Netlify.
- Host backend on Render/Railway/Fly.io.
- Use managed PostgreSQL (Neon/Supabase/Railway).
- Add environment variables for DB URL, JWT secrets, CORS origin.
