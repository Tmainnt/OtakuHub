# Quickstart Validation Guide: OtakuHub Platform

**Feature Branch**: `001-otakuhub-platform`

## Prerequisites

- Node.js (v18+) and npm
- Go (v1.22+)
- PostgreSQL installed locally with user `postgres` and password `Reyzaburrel123@`

## Setup & Execution

### 1. Database Setup
```bash
psql -U postgres -c "CREATE DATABASE otakuhub;"
```

### 2. Backend Setup & Run (Go)
```bash
cd backend
go mod init otakuhub-backend
go mod tidy
go run cmd/main.go
```
*(Runs Go API server on port 8080)*

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
4. **Community Posts**: Create a new post with image/video attachments and verify it appears in the feed.
5. **Chat & File Upload**: Join a chat room, send a message and test uploading a file under 50MB.
