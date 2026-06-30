# Campus Hiring Notification System

This repository contains a campus hiring notification platform with a React frontend and Node.js/Express backend.

## Structure

- `frontend/` - React + Vite + Material UI client app
- `backend/` - Node.js + Express API server with authentication and notification routes

## Local development

1. Install dependencies
   - `cd backend && npm install --legacy-peer-deps`
   - `cd frontend && npm install --legacy-peer-deps`

2. Start services
   - Backend: `cd backend && PORT=5001 npm run dev`
   - Frontend: `cd frontend && VITE_API_URL=http://localhost:5001/api VITE_WS_URL=http://localhost:5001 npm run dev`

3. Open UI
   - Visit `http://localhost:5173`

## Docker

Start the stack with:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:4173`
- Backend: `http://localhost:5000`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

## Notes

- Backend currently includes a scaffolded in-memory notification engine and support for Prisma.
- Add actual database migrations via `prisma migrate` once `DATABASE_URL` is configured.
- Extend the Redis/BullMQ queue for bulk notification processing.
