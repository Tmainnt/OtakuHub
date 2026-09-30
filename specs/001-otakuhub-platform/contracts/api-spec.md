# API Contracts: OtakuHub Platform

**Feature Branch**: `001-otakuhub-platform`

## REST API Endpoints

### Authentication
- `POST /api/auth/register`
  - Body: `{ "username": "string", "password": "string" }`
  - Response: `201 Created` with JWT token
- `POST /api/auth/login`
  - Body: `{ "username": "string", "password": "string" }`
  - Response: `200 OK` with JWT token

### User Profile & Favorites
- `GET /api/users/{id}/profile`
  - Response: User info, radar chart metrics, post history
- `GET /api/users/{id}/favorites`
  - Response: List of favorite media and characters
- `POST /api/users/favorites`
  - Body: `{ "item_id": "string", "item_type": "media|character" }`
- `DELETE /api/users/favorites/{id}`

### Media & Characters
- `GET /api/media?query=...&genre=...&type=...`
- `GET /api/media/{id}`
- `POST /api/media` (Admin only)
- `PUT /api/media/{id}` (Admin only)
- `DELETE /api/media/{id}` (Admin only)
- `GET /api/characters/{id}`
- `POST /api/characters` (Admin only)

### Community Posts
- `GET /api/posts`
- `POST /api/posts` (Multipart: text, image/video file)
- `PUT /api/posts/{id}`
- `DELETE /api/posts/{id}`
- `GET /api/users/{id}/recommendations`

### Chat & Messaging
- `GET /api/chat/rooms`
- `POST /api/chat/rooms` (Create room)
- `POST /api/chat/rooms/{id}/join`
- `POST /api/chat/rooms/{id}/leave`
- `WS /api/chat/ws?token=...` (WebSocket connection for real-time messaging & file transfer up to 50MB)
