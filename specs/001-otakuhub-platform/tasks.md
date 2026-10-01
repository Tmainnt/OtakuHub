---
description: "Task list for OtakuHub Platform implementation"
---

# Tasks: OtakuHub Platform

**Input**: Design documents from `/specs/001-otakuhub-platform/`

**Prerequisites**: plan.md, spec.md, data-model.md, contracts/api-spec.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` for Go API service, `src/` for Next.js frontend

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure for backend (`backend/cmd`, `backend/internal`) and frontend (`src/app`, `src/components`, `src/services`, `src/types`) per implementation plan
- [x] T002 Initialize Go backend module with `go mod init otakuhub-backend` in `backend/go.mod`
- [x] T003 [P] Configure TypeScript and Tailwind CSS configuration in `tsconfig.json` and `tailwind.config.ts`
- [x] T004 [P] Setup environment configuration templates in `.env.example` and `backend/.env.example`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T005 Setup PostgreSQL database connection and schema migration scripts in `backend/internal/database/db.go`
- [x] T006 [P] Implement JWT authentication and authorization middleware in `backend/internal/middleware/auth.go`
- [ ] T007 [P] Setup Go HTTP routing structure and middleware in `backend/internal/router/router.go` (the running server still declares routes directly in `backend/cmd/main.go`)
- [x] T008 Create base models (User, Media, Character, Favorite, Post, ChatRoom, Message) in `backend/internal/models/`
- [x] T009 Configure error handling and logging infrastructure in `backend/internal/utils/logger.go`
- [x] T010 Setup Next.js API client and base layout components in `src/services/api.ts` and `src/app/layout.tsx`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication & Profile Management (Priority: P1) 🎯 MVP

**Goal**: Enable users to register, log in, view/edit profiles, view radar charts of preferences, and manage saved favorites (media/characters) and user posts.

**Independent Test**: Can be fully tested by registering a new user, logging in, viewing/editing profile, checking radar chart, and managing favorites.

### Implementation for User Story 1

- [x] T011 [P] [US1] Create User database queries and repository in `backend/internal/models/user_repo.go`
- [x] T012 [P] [US1] Implement registration and login API endpoints in `backend/internal/handlers/auth_handler.go`
- [ ] T013 [US1] Implement User Profile and Favorite management API endpoints in `backend/internal/handlers/user_handler.go` (profile/favorites are available; genre aggregation and favorites metadata/edit flow remain incomplete)
- [x] T014 [P] [US1] Create frontend authentication pages (Login/Register) in `src/app/(auth)/login/page.tsx` and `src/app/(auth)/register/page.tsx`
- [ ] T015 [US1] Create frontend Profile page with radar chart and post history in `src/app/profile/page.tsx` (radar aggregation and post history remain incomplete)
- [ ] T016 [US1] Create Favorites management UI component with edit/delete controls in `src/components/FavoritesList.tsx` (currently displays raw item IDs and only supports removal)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP)

---

## Phase 4: User Story 2 - Media and Character Exploration & Details (Priority: P2)

**Goal**: Enable users to browse/search anime, manga, novels, and characters; view rich details including origins, watch orders, OSTs, and relationships; and allow admin CRUD operations.

**Independent Test**: Can be tested by searching catalog, viewing media/character detail pages, checking watch orders, and verifying admin management tools.

### Implementation for User Story 2

- [x] T017 [P] [US2] Create Media and Character database models and repositories in `backend/internal/models/media_repo.go` and `backend/internal/models/character_repo.go`
- [x] T018 [US2] Implement Media and Character catalog search and detail API endpoints in `backend/internal/handlers/media_handler.go` and `backend/internal/handlers/character_handler.go`
- [x] T019 [US2] Implement Admin CRUD API endpoints for media and characters in `backend/internal/handlers/admin_handler.go`
- [x] T020 [P] [US2] Create catalog browsing and search frontend page in `src/app/catalog/page.tsx`
- [x] T021 [US2] Create detailed Media page with watch order, OSTs, and character list in `src/app/media/[id]/page.tsx`
- [x] T022 [US2] Create detailed Character page with relationships and image collections in `src/app/characters/[id]/page.tsx`
- [ ] T023 [US2] Create Admin management dashboard in `src/app/admin/page.tsx` (dashboard currently only creates media; edit/delete, character management and role-gated access remain incomplete)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Community Posts and Chat Features (Priority: P3)

**Goal**: Enable users to create/CRUD community posts (text, image, video), receive friend recommendations based on style, participate in public/private chat rooms, send messages/files up to 50MB, and use direct messaging.

**Independent Test**: Can be tested by posting community updates, checking recommendations, joining chat rooms, and sending messages/files.

### Implementation for User Story 3

- [x] T024 [P] [US3] Create Post, ChatRoom, and Message database models and repositories in `backend/internal/models/post_repo.go` and `backend/internal/models/chat_repo.go`
- [ ] T025 [US3] Implement Community Post CRUD and friend recommendation API endpoints in `backend/internal/handlers/post_handler.go` (only list/create are implemented; recommendations currently return empty and update/delete are missing)
- [ ] T026 [US3] Implement WebSocket chat handler and file upload validation (<= 50MB) in `backend/internal/handlers/chat_handler.go` (upload is not persisted and WebSocket messaging is missing)
- [ ] T027 [P] [US3] Create Community Feed and Post creation UI in `src/app/community/page.tsx` and `src/components/PostCard.tsx` (post media URL is not uploaded and edit/delete controls are missing)
- [ ] T028 [US3] Create friend recommendations UI component in `src/components/FriendRecommendations.tsx` (component exists; recommendation data is not implemented)
- [ ] T029 [US3] Create Chat room and Direct Messaging UI with WebSocket integration in `src/app/chat/page.tsx` (messages are local-only; room membership, persistence, direct messaging and WebSocket are missing)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T030 [P] Update documentation and quickstart instructions in `specs/001-otakuhub-platform/quickstart.md`
- [ ] T031 Code cleanup and error handling hardening across backend handlers and frontend components (additional handlers still need validation and hardening)
- [ ] T032 Performance optimization for catalog search and chat message delivery (chat delivery is not implemented)
- [ ] T033 Responsive design audit across Tailwind CSS styles for mobile and desktop viewports (navigation was improved; a full viewport audit remains)
- [ ] T034 Run quickstart.md end-to-end validation scenarios (requires a configured PostgreSQL instance and backend service)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No blocking dependencies on US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - No blocking dependencies on US1/US2

---

## Implementation Strategy

### MVP First (User Story 1 Only)
1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Auth & Profile)
4. **STOP and VALIDATE**: Test User Story 1 independently

### Incremental Delivery
1. Setup + Foundational → Foundation ready
2. Add User Story 1 → MVP complete!
3. Add User Story 2 → Catalog & Details complete
4. Add User Story 3 → Community & Chat complete
5. Polish & Verification
