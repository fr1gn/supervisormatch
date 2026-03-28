# SupervisorMatch

A complete React + Vite application for connecting students with academic supervisors.

## Stack

- `react`
- `react-dom`
- `react-router-dom`
- `lucide-react`
- `tailwindcss` + `@tailwindcss/vite`
- `vite`

## Implemented Pages

- `Login`
- `Register`
- `Search (Student Dashboard)`
- `Requests (Student)`
- `Supervisor Dashboard (Requests + Topics)`
- `About`
- `Profile (Student + Supervisor)`

## Key Functionality

- Authentication flow with register and login screens
- Session persistence via `localStorage`
- Search supervisors by:
	- keyword
	- department
	- research area
	- availability-only toggle
- Supervisor cards with:
	- photo
	- title and department
	- real-time slot availability (`free/capacity`)
	- research area tags
	- request message + send action
- Request tracking page with status support:
	- `pending`
	- `under review`
	- `accepted`
	- `rejected`
- Supervisor dashboard with:
	- supervisor summary card (slots, pending requests, topics)
	- request inbox with status actions (`under review`, `accepted`, `rejected`)
	- topic management (add/remove topics)
- Role-connected communication:
	- student requests appear in supervisor dashboard
	- supervisor status updates are reflected in student request tracking
- Editable supervisor profile:
	- name, title, phone, department, areas, biography
- Editable student profile:
	- editable: full name, phone, department, group name, study level, interests, bio
	- non-editable: login credentials (email/password)
- About page with full mission, feature lists, workflow steps, and contact info
- Responsive layout for desktop and mobile
- Purple gradient visual system aligned with your design direction

## Project Structure

```text
src/
	components/
		StatusPill.jsx
		SupervisorCard.jsx
	context/
		AppContext.jsx
	data/
		supervisors.js
	layouts/
		AppLayout.jsx
	pages/
		AboutPage.jsx
		LoginPage.jsx
		ProfilePage.jsx
		RegisterPage.jsx
		RequestsPage.jsx
		SearchPage.jsx
		SupervisorDashboardPage.jsx
	App.jsx
	index.css
	main.jsx
docs/
	BACKEND_PLAN.md
```

## Run Locally

```bash
npm install
npm run dev
```

## Run Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

Backend base URL: `http://localhost:4000`

Detailed backend notes are in `backend/README.md` and defence notes are in `docs/BACKEND_DEFENCE_GUIDE.md`.

## Build and Lint

```bash
npm run lint
npm run build
```

## Demo Login

- Student: `student@test.com` (or any new student email)
- Supervisor: `johnson@university.edu`
- Password: any password

## Backend and Database Expansion

The project includes a practical backend migration plan in `docs/BACKEND_PLAN.md`.
It describes a JavaScript backend stack, API modules, PostgreSQL schema suggestions,
and how to transition this frontend from local state to real API persistence.
