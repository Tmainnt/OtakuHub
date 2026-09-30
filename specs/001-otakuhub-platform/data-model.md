# Data Model: OtakuHub Platform

**Feature Branch**: `001-otakuhub-platform`

## Entities & Relationships

### 1. User
- **Fields**:
  - `id` (UUID / Primary Key)
  - `username` (String, Unique, Index)
  - `password_hash` (String)
  - `created_at` (Timestamp)
- **Relationships**:
  - Has many `Post`
  - Has many `Favorite` (Media and Character)
  - Participates in many `ChatRoom` (via RoomMembers)
  - Sends many `Message`

### 2. Media (Anime / Manga / Novel)
- **Fields**:
  - `id` (UUID / Primary Key)
  - `title` (String, Index)
  - `type` (Enum: `anime`, `manga`, `novel`)
  - `origin_country` (String)
  - `source_format` (String)
  - `release_year` (Integer)
  - `creator` (String)
  - `episodes_or_volumes` (Integer)
  - `watch_order_info` (JSON / Text)
  - `ost_list` (JSON / Text)
  - `social_links` (JSON / Text)
  - `created_at` (Timestamp)
- **Relationships**:
  - Has many related `Character` (via MediaCharacter)
  - Has many related `Media` (related works / franchises)

### 3. Character
- **Fields**:
  - `id` (UUID / Primary Key)
  - `name` (String, Index)
  - `personal_info` (Text)
  - `birthplace` (String)
  - `family_details` (Text)
  - `image_collection` (JSON / Array of URLs)
  - `related_media_songs_games` (JSON)
- **Relationships**:
  - Belongs to many `Media`
  - Has relationships with other `Character` (CharacterRelationship table)

### 4. CharacterRelationship
- **Fields**:
  - `id` (Primary Key)
  - `character_id_1` (Foreign Key -> Character)
  - `character_id_2` (Foreign Key -> Character)
  - `relation_type` (String, e.g., "rival", "sibling", "ally")

### 5. Favorite
- **Fields**:
  - `id` (Primary Key)
  - `user_id` (Foreign Key -> User)
  - `item_id` (Foreign Key -> Media or Character)
  - `item_type` (Enum: `media`, `character`)
  - `created_at` (Timestamp)

### 6. Post
- **Fields**:
  - `id` (Primary Key)
  - `user_id` (Foreign Key -> User)
  - `content` (Text)
  - `media_urls` (JSON / Array, restricted to images/videos)
  - `created_at` (Timestamp)
- **Relationships**:
  - Belongs to `User`

### 7. ChatRoom
- **Fields**:
  - `id` (Primary Key)
  - `name` (String)
  - `is_private` (Boolean)
  - `created_at` (Timestamp)
- **Relationships**:
  - Has many members (`User`)
  - Has many `Message`

### 8. Message
- **Fields**:
  - `id` (Primary Key)
  - `room_id` (Foreign Key -> ChatRoom, optional for direct message)
  - `sender_id` (Foreign Key -> User)
  - `recipient_id` (Foreign Key -> User, optional for direct message)
  - `content` (Text)
  - `file_url` (String, optional, max 50MB validation)
  - `file_type` (String, optional)
  - `created_at` (Timestamp)
