# Research: OtakuHub Platform

**Feature Branch**: `001-otakuhub-platform`

## Technical Decisions & Rationale

### 1. Authentication & Session Management
- **Decision**: JWT (JSON Web Tokens) with secure HTTP-only cookies or Bearer tokens.
- **Rationale**: Stateless authentication fits the Go REST backend and Next.js frontend architecture well, allowing secure API access and easy session validation.
- **Alternatives Considered**: Session cookies with Redis (adds deployment overhead for local workshop/dev environments).

### 2. Database Schema & ORM
- **Decision**: PostgreSQL with native SQL queries or lightweight query builders (like `sqlx` or `pgx`) in Go.
- **Rationale**: Direct PostgreSQL usage with credentials supplied through environment variables ensures control over complex relations while keeping secrets out of source files.
- **Alternatives Considered**: GORM (can introduce abstraction overhead for complex relational queries and graph-like character relationships).

### 3. Real-Time Chat & File Uploads
- **Decision**: WebSockets (`gorilla/websocket` or Go standard `net/http` WebSocket upgrade) for real-time messaging, with multipart form uploads capped at 50MB for chat attachments and media validation for posts (images/videos only).
- **Rationale**: Provides instant messaging and live chat room support with minimal latency, while strict middleware enforces file size limits.
- **Alternatives Considered**: Polling HTTP endpoints (inefficient and introduces latency for chat).

### 4. Frontend UI & Styling
- **Decision**: Next.js App Router with TypeScript and Tailwind CSS.
- **Rationale**: Fully aligns with existing repository setup, provides excellent responsiveness, component reusability, and fast client-side navigation.
- **Alternatives Considered**: Vanilla HTML/CSS (rejected since Next.js structure and TypeScript are already configured in the repo).
