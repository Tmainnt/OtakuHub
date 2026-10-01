# Quickstart Validation Guide: OtakuHub Platform

**Feature Branch**: `001-otakuhub-platform`

## Prerequisites

- Node.js (v18+) and npm
- Go (v1.22+)
- PostgreSQL installed locally; credentials supplied in `backend/.env` (copy from `.env.example` and set a private password)

## Setup & Execution

### 1. Database Setup
```bash
psql -U postgres -c "CREATE DATABASE otakuhub;"
```

### 2. Backend Setup & Run (Go)
```bash
cd backend
go mod tidy
go run cmd/main.go
```
*(Runs Go API server on port 8081 by default; configure `PORT` in `backend/.env` to change it.)*

Before starting the backend, copy `backend/.env.example` to `backend/.env` and set `DB_PASSWORD` and a private `JWT_SECRET`. To grant the admin role, set `ADMIN_USERNAME` to an existing account username; restarting the backend applies the role, and the user must sign in again to receive the admin role in their token.

### 3. Frontend Setup & Run (Next.js)
```bash
cd /path/to/OtakuHub
npm install
npm run dev
```
*(Runs Next.js development server on port 3000)*

## Validation Scenarios

1. **Authentication**: Open `http://localhost:3000/register`, create a new account, and log in.
2. **Profile & Radar Chart**: Navigate to `/profile` to view user stats, radar chart, and user posts.
3. **Media & Character Catalog**: Search and browse anime/manga/novels and characters, verifying watch orders, OSTs, and relationships.
4. **Community Posts**: Create a text post and verify it appears in the feed. Post media upload and post editing/deletion are not implemented yet.
5. **Chat**: The current build lists rooms from PostgreSQL. Real-time messaging, joining/leaving rooms, direct messages, and persisted file uploads are not implemented yet.
