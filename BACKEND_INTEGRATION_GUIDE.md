# Backend Integration Guide — SupervisorMatch Admin Panel

This guide provides everything a backend developer needs to connect the admin panel frontend to a real API.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Authentication Flow](#authentication-flow)
- [API Client Setup](#api-client-setup)
- [Entity Models](#entity-models)
- [Required Endpoints](#required-endpoints)
- [Request/Response Formats](#requestresponse-formats)
- [Pagination Structure](#pagination-structure)
- [Filtering & Sorting](#filtering--sorting)
- [Token Handling](#token-handling)
- [Frontend Integration Notes](#frontend-integration-notes)
- [Recommended Backend Architecture](#recommended-backend-architecture)

---

## Architecture Overview

The admin panel is a client-side React SPA that communicates with a REST API.

```
Frontend (React + Vite)
    |
    ├── src/admin/api/client.js   <-- API client (connect here)
    ├── src/admin/data/mockData.js <-- Replace with API calls
    └── src/admin/hooks/           <-- Data fetching hooks
         |
     REST API (JSON)
         |
     Backend Server (Express / NestJS / Django / etc.)
         |
     Database (PostgreSQL / MongoDB / etc.)
```

### Key File: `src/admin/api/client.js`

This file contains the API client with all endpoint methods already defined. Each method currently throws a fetch error (since no backend exists). Replace the mock data imports in page components with these API calls when the backend is ready.

**Environment Variable:**

```env
VITE_API_URL=http://localhost:3000/api/v1
```

---

## Authentication Flow

### Login Flow

1. Admin submits credentials (`email` + `password`)
2. Backend validates and returns a JWT access token
3. Frontend stores the token in `localStorage` as `admin_token`
4. All subsequent API requests include `Authorization: Bearer <token>`
5. On 401 response, frontend clears token and redirects to `/admin/login`

### Expected Login Endpoint

```
POST /api/v1/admin/auth/login
```

**Request:**

```json
{
  "email": "admin@university.edu",
  "password": "securePassword123"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr-001",
    "name": "Alex Morgan",
    "email": "admin@university.edu",
    "role": "super_admin",
    "avatar": null
  },
  "expiresIn": 86400
}
```

### Token Structure (JWT Payload)

```json
{
  "sub": "usr-001",
  "email": "admin@university.edu",
  "role": "super_admin",
  "iat": 1716652800,
  "exp": 1716739200
}
```

---

## Entity Models

### Student

```typescript
interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;         // e.g., "STU-20240156"
  department: string;
  program: "MSc" | "PhD";
  year: number;
  gpa: number;
  status: "active" | "pending" | "inactive";
  supervisor: string | null;  // Supervisor name or null
  applicationDate: string;    // ISO date
  avatar: string | null;      // URL or null
  researchInterests: string[];
}
```

### Supervisor

```typescript
interface Supervisor {
  id: string;
  name: string;
  email: string;
  department: string;
  title: string;              // e.g., "Associate Professor"
  specializations: string[];
  totalSlots: number;
  availableSlots: number;
  activeStudents: number;
  status: "available" | "full" | "on-leave";
  rating: number;             // 0-5
  yearsExperience: number;
  avatar: string | null;
}
```

### Application

```typescript
interface Application {
  id: string;
  student: {
    name: string;
    id: string;
    email: string;
  };
  supervisor: {
    name: string;
    id: string;
  };
  department: string;
  researchTopic: string;
  status: "pending" | "under-review" | "approved" | "rejected";
  priority: "high" | "medium" | "low";
  submittedAt: string;        // ISO timestamp
  updatedAt: string;          // ISO timestamp
  timeline: TimelineEvent[];
  documents: string[];        // Filenames or URLs
}

interface TimelineEvent {
  status: string;
  timestamp: string;
  note: string;
}
```

### Department

```typescript
interface Department {
  id: string;
  name: string;
  head: string;
  totalSupervisors: number;
  totalStudents: number;
  activeProjects: number;
  color: string;              // Hex color
}
```

### Notification

```typescript
interface Notification {
  id: string;
  title: string;
  message: string;
  type: "application" | "success" | "warning" | "error" | "info";
  read: boolean;
  timestamp: string;          // ISO timestamp
}
```

---

## Required Endpoints

### Authentication

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| POST   | `/admin/auth/login`          | Admin login           |
| POST   | `/admin/auth/logout`         | Invalidate token      |
| GET    | `/admin/auth/profile`        | Get current admin     |

### Dashboard

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| GET    | `/admin/dashboard/stats`     | Summary statistics    |
| GET    | `/admin/dashboard/activity`  | Activity feed         |

### Students

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| GET    | `/admin/students`            | List students         |
| GET    | `/admin/students/:id`        | Get student details   |
| PATCH  | `/admin/students/:id`        | Update student        |
| DELETE | `/admin/students/:id`        | Delete student        |

### Supervisors

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| GET    | `/admin/supervisors`         | List supervisors      |
| GET    | `/admin/supervisors/:id`     | Get supervisor detail |
| PATCH  | `/admin/supervisors/:id`     | Update supervisor     |

### Applications

| Method | Endpoint                           | Description          |
| ------ | ---------------------------------- | -------------------- |
| GET    | `/admin/applications`              | List applications    |
| GET    | `/admin/applications/:id`          | Get application      |
| POST   | `/admin/applications/:id/approve`  | Approve application  |
| POST   | `/admin/applications/:id/reject`   | Reject application   |

### Departments

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| GET    | `/admin/departments`         | List departments      |
| POST   | `/admin/departments`         | Create department     |
| PATCH  | `/admin/departments/:id`     | Update department     |

### Analytics

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| GET    | `/admin/analytics`           | Get analytics data    |

### Notifications

| Method | Endpoint                             | Description         |
| ------ | ------------------------------------ | ------------------- |
| GET    | `/admin/notifications`               | List notifications  |
| POST   | `/admin/notifications/:id/read`      | Mark as read        |
| POST   | `/admin/notifications/read-all`      | Mark all as read    |

### Settings

| Method | Endpoint                     | Description           |
| ------ | ---------------------------- | --------------------- |
| GET    | `/admin/settings`            | Get admin settings    |
| PATCH  | `/admin/settings`            | Update settings       |

---

## Request/Response Formats

### List Response (Paginated)

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 47,
    "totalPages": 5
  }
}
```

### Single Item Response

```json
{
  "data": { ... }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}
```

### Success Action Response

```json
{
  "success": true,
  "message": "Application approved successfully"
}
```

---

## Pagination Structure

All list endpoints should accept these query parameters:

| Parameter  | Type   | Default | Description                        |
| ---------- | ------ | ------- | ---------------------------------- |
| `page`     | number | 1       | Current page number                |
| `pageSize` | number | 10      | Items per page                     |
| `search`   | string | ""      | Global text search                 |
| `sortBy`   | string | ""      | Field to sort by                   |
| `sortDir`  | string | "asc"   | Sort direction: `asc` or `desc`    |

**Example:**

```
GET /admin/students?page=2&pageSize=10&search=sarah&sortBy=name&sortDir=asc
```

---

## Filtering & Sorting

### Filter Parameters

Filters are passed as query parameters:

```
GET /admin/students?status=active&program=PhD&department=Computer%20Science
```

### Sort Parameters

```
GET /admin/supervisors?sortBy=rating&sortDir=desc
```

### Frontend Hook

The `useTableState` hook in `src/admin/hooks/useTableState.js` currently handles client-side operations. To switch to server-side:

1. Remove the client-side data processing logic
2. Pass the search/sort/filter/page params to the API
3. Return the server response directly

```javascript
// Before (client-side):
const { data } = useTableState(mockStudents, { pageSize: 10 });

// After (server-side):
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  adminApi.getStudents({ page, pageSize, search, sortBy, sortDir, ...filters })
    .then(res => {
      setData(res.data);
      setTotalItems(res.pagination.total);
    })
    .finally(() => setLoading(false));
}, [page, search, sortBy, sortDir, filters]);
```

---

## Token Handling

### Storage

```javascript
// Set token after login
localStorage.setItem('admin_token', response.token);

// Get token for requests
const token = localStorage.getItem('admin_token');

// Clear on logout
localStorage.removeItem('admin_token');
```

### Request Headers

Every authenticated request includes:

```
Authorization: Bearer <token>
Content-Type: application/json
```

### Token Refresh (Optional)

If implementing token refresh:

```
POST /api/v1/admin/auth/refresh
Authorization: Bearer <refresh_token>
```

---

## Frontend Integration Notes

### Where to Connect

1. **Page components** (`src/admin/pages/`) import mock data from `src/admin/data/mockData.js`
2. Replace these imports with API calls from `src/admin/api/client.js`
3. Add loading/error states using the `Skeleton` component from `src/admin/components/ui.jsx`

### Step-by-Step Integration

For each page:

```
1. Open the page component (e.g., StudentsPage.jsx)
2. Find the mock data import: import { students } from '../data/mockData'
3. Replace with an API call:
   - Add useState for data, loading, error
   - Add useEffect to fetch data
   - Use the adminApi methods from ../api/client.js
   - Show Skeleton components while loading
   - Show error state if fetch fails
```

### Components Ready for Dynamic Data

| Component        | File                          | Props Expected         |
| ---------------- | ----------------------------- | ---------------------- |
| `StatCard`       | `components/ui.jsx`           | `{ label, value, ... }` |
| `StatusBadge`    | `components/ui.jsx`           | `{ status }`           |
| `Avatar`         | `components/ui.jsx`           | `{ name, src? }`       |
| `Pagination`     | `components/ui.jsx`           | `{ currentPage, ... }` |
| `SearchInput`    | `components/ui.jsx`           | `{ value, onChange }`  |
| `FilterSelect`   | `components/ui.jsx`           | `{ options, ... }`     |
| `Modal`          | `components/ui.jsx`           | `{ isOpen, ... }`      |

### Environment Variables

```env
# .env.local
VITE_API_URL=http://localhost:3000/api/v1

# .env.production
VITE_API_URL=https://api.supervisormatch.com/api/v1
```

---

## Recommended Backend Architecture

### Technology Options

| Layer       | Recommended                          |
| ----------- | ------------------------------------ |
| Runtime     | Node.js 20+                          |
| Framework   | Express.js / NestJS / Fastify        |
| Database    | PostgreSQL (recommended) / MongoDB   |
| ORM         | Prisma / Sequelize / TypeORM         |
| Auth        | JWT (jsonwebtoken / jose)            |
| Validation  | Zod / Joi / class-validator          |
| File Upload | Multer + S3 / Cloudinary             |

### Folder Structure (Node.js)

```
backend/
  ├── src/
  │   ├── modules/
  │   │   ├── auth/
  │   │   ├── students/
  │   │   ├── supervisors/
  │   │   ├── applications/
  │   │   ├── departments/
  │   │   ├── analytics/
  │   │   ├── notifications/
  │   │   └── settings/
  │   ├── middleware/
  │   │   ├── auth.js          # JWT verification
  │   │   ├── adminGuard.js    # Admin role check
  │   │   └── errorHandler.js
  │   ├── utils/
  │   │   ├── pagination.js    # Pagination helper
  │   │   └── validation.js
  │   └── config/
  │       ├── database.js
  │       └── env.js
  ├── prisma/
  │   └── schema.prisma
  └── package.json
```

### Database Schema (Simplified)

```sql
-- Core tables
CREATE TABLE admins (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  program VARCHAR(10),
  year INTEGER,
  gpa DECIMAL(3,2),
  status VARCHAR(20) DEFAULT 'pending',
  supervisor_id UUID REFERENCES supervisors(id),
  application_date DATE,
  research_interests TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE supervisors (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  department_id UUID REFERENCES departments(id),
  title VARCHAR(100),
  specializations TEXT[],
  total_slots INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'available',
  rating DECIMAL(2,1),
  years_experience INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  supervisor_id UUID REFERENCES supervisors(id),
  research_topic TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  priority VARCHAR(10) DEFAULT 'medium',
  submitted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE departments (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  head VARCHAR(255),
  color VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES admins(id),
  title VARCHAR(255),
  message TEXT,
  type VARCHAR(20),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### CORS Configuration

```javascript
// Express CORS setup
app.use(cors({
  origin: ['http://localhost:5173', 'https://supervisormatch.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

---

## Quick Start Checklist

- [ ] Set up backend framework (Express/NestJS)
- [ ] Configure database and run migrations
- [ ] Implement JWT authentication
- [ ] Create admin user seeder
- [ ] Implement CRUD endpoints for each entity
- [ ] Add pagination middleware
- [ ] Add filtering/sorting support
- [ ] Configure CORS for frontend origin
- [ ] Set `VITE_API_URL` in frontend `.env`
- [ ] Replace mock data imports with API calls in page components
- [ ] Add loading states using `Skeleton` component
- [ ] Add error handling and retry logic
- [ ] Test all endpoints with the frontend
