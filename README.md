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
- **Storage**: JSON File Storage (MVP phase, preparing for PostgreSQL)
- **Infrastructure**: Docker, Docker Compose

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm
- [Docker](https://www.docker.com/) (optional, for containerized deployment)

### Local Development

To run the project locally without Docker, you need to start both the backend and frontend servers.

**1. Start the Backend**
```bash
cd backend
npm install
npm run start:dev
```
The API will be available at `http://localhost:4000`.

**2. Start the Frontend**
Open a new terminal window in the root of the project:
```bash
npm install
npm run dev
```
The web application will be available at `http://localhost:5173`.

### Running with Docker

To run the entire application stack using Docker Compose:

```bash
docker compose up -d
```

- The frontend will be available at `http://localhost` (port 80).
- The backend API will be available at `http://localhost:4000`.

## API Documentation

A fully configured Postman collection containing all API endpoints is available at `docs/SupervisorMatch_Postman.json`. You can import this file directly into Postman to interact with the API.
