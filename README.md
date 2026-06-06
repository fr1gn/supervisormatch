# SupervisorMatch

SupervisorMatch is a full-stack web application designed to help students find and connect with academic supervisors for their projects or thesis work.

## Features

- **Role-based Access**: Separate interfaces and capabilities for Students and Supervisors.
- **Supervisor Directory**: Browse available supervisors, their research areas, and current capacity.
- **Request System**: Students can send application requests; supervisors can review, accept, or reject them.
- **Profile Management**: Update personal information, research topics, and availability status.

## Tech Stack

- **Frontend**: React, Vite, React Router, Context API
- **Backend**: NestJS, TypeScript, JWT Authentication
- **Database & Storage**: PostgreSQL (hosted on Supabase), Prisma ORM
- **Infrastructure**: Docker, Docker Compose

## Getting Started (A to Z Guide)

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (comes with Node.js)
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### 1. Environment Configuration

Before starting the backend, you need to configure the environment variables for database access.
Ensure that the `.env` file is placed inside the `backend/` directory. *(Note: The `.env` file containing the Supabase database credentials has already been provided to the team).*

The `.env` structure looks like this:
```env
DATABASE_URL="postgres://..."
DIRECT_URL="postgres://..."
JWT_SECRET="super-secret-key-for-local-development"
```

### 2. Local Development (Running without Docker)

To run the project locally, you can now start both the backend and frontend servers with a single command.

#### Step 2.1: Initialize the Database

Open a terminal and navigate to the backend directory to set up the database schema:
```bash
cd backend

# 1. Install all dependencies
npm install

# 2. Push the database schema and generate Prisma client
npx prisma db push
npx prisma generate
```

#### Step 2.2: Start the Application

Navigate back to the root of the project:
```bash
cd ..

# 1. Install frontend dependencies and the concurrently package
npm install

# 2. Start both the backend and frontend simultaneously
npm start
```
The web application will be available at `http://localhost:5173` and the backend at `http://localhost:4000`.

### 3. Running with Docker

To run the entire application stack (Frontend and Backend) using Docker Compose:

1. Ensure your `.env` file is present in the `backend/` folder so the backend container can connect to the database.
2. Run the following command in the root directory:

```bash
docker compose up -d --build
```

- The frontend will be available at `http://localhost` (port 80).
- The backend API will be available at `http://localhost:4000`.

## API Documentation

A fully configured Postman collection containing all API endpoints is available at `docs/SupervisorMatch_Postman.json`. You can import this file directly into Postman to interact with the API.
