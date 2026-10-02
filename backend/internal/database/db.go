package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() (*sql.DB, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := os.Getenv("DB_PASSWORD")
	dbname := getEnv("DB_NAME", "otakuhub")
	databaseURL := os.Getenv("DATABASE_URL")
	if password == "" && databaseURL == "" {
		return nil, fmt.Errorf("DB_PASSWORD is required; set it in backend/.env or the process environment")
	}

	connStr := databaseURL
	if connStr == "" {
		sslMode := getEnv("DB_SSLMODE", "disable")
		connStr = fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
			host, port, user, password, dbname, sslMode)
	} else if strings.HasPrefix(connStr, "postgresql://") {
		connStr = "postgres://" + strings.TrimPrefix(connStr, "postgresql://")
	}

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		return nil, fmt.Errorf("error connecting to database: %v", err)
	}

	log.Println("Successfully connected to PostgreSQL database")
	if err := runMigrations(DB); err != nil {
		DB.Close()
		return nil, err
	}
	if adminUsername := os.Getenv("ADMIN_USERNAME"); adminUsername != "" {
		if _, err := DB.Exec(`UPDATE users SET role = 'admin' WHERE LOWER(username) = LOWER($1)`, adminUsername); err != nil {
			DB.Close()
			return nil, fmt.Errorf("could not apply ADMIN_USERNAME role: %w", err)
		}
	}
	return DB, nil
}

func runMigrations(db *sql.DB) error {
	schemaQuery := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		role VARCHAR(20) NOT NULL DEFAULT 'user',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

	CREATE TABLE IF NOT EXISTS media (
		id SERIAL PRIMARY KEY,
		title VARCHAR(255) NOT NULL,
		type VARCHAR(50) NOT NULL,
		origin_country VARCHAR(100),
		source_format VARCHAR(100),
		release_year INT,
		creator VARCHAR(255),
		episodes_or_volumes INT,
		watch_order_info TEXT,
		ost_list TEXT,
		social_links TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS characters (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		personal_info TEXT,
		birthplace VARCHAR(255),
		family_details TEXT,
		image_collection TEXT,
		related_media_songs_games TEXT
	);

	CREATE TABLE IF NOT EXISTS character_media (
		character_id INT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
		media_id INT NOT NULL REFERENCES media(id) ON DELETE CASCADE,
		PRIMARY KEY (character_id, media_id)
	);

	CREATE TABLE IF NOT EXISTS favorites (
		id SERIAL PRIMARY KEY,
		user_id INT REFERENCES users(id) ON DELETE CASCADE,
		item_id INT NOT NULL,
		item_type VARCHAR(50) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS posts (
		id SERIAL PRIMARY KEY,
		user_id INT REFERENCES users(id) ON DELETE CASCADE,
		content TEXT NOT NULL,
		media_urls TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS chat_rooms (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		is_private BOOLEAN DEFAULT FALSE,
		created_by INT REFERENCES users(id) ON DELETE SET NULL,
		invite_code VARCHAR(32) UNIQUE,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS created_by INT REFERENCES users(id) ON DELETE SET NULL;
	ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS invite_code VARCHAR(32);
	UPDATE chat_rooms SET invite_code = upper(substr(md5(random()::text || clock_timestamp()::text || id::text), 1, 12)) WHERE invite_code IS NULL;
	CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_rooms_invite_code ON chat_rooms(invite_code);

	CREATE TABLE IF NOT EXISTS chat_room_members (
		room_id INT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
		user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'leader')),
		joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (room_id, user_id)
	);
	CREATE TABLE IF NOT EXISTS messages (
		id SERIAL PRIMARY KEY,
		room_id INT REFERENCES chat_rooms(id) ON DELETE CASCADE,
		sender_id INT REFERENCES users(id) ON DELETE CASCADE,
		recipient_id INT,
		content TEXT,
		file_url TEXT,
		file_type VARCHAR(50),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	UPDATE chat_rooms cr SET created_by = (
		SELECT m.sender_id FROM messages m WHERE m.room_id = cr.id ORDER BY m.created_at, m.id LIMIT 1
	) WHERE cr.created_by IS NULL AND EXISTS (SELECT 1 FROM messages m WHERE m.room_id = cr.id);
	INSERT INTO chat_room_members(room_id, user_id, role)
		SELECT DISTINCT ON (room_id) room_id, sender_id, 'leader' FROM messages ORDER BY room_id, created_at, id
		ON CONFLICT (room_id, user_id) DO NOTHING;
	`
	_, err := db.Exec(schemaQuery)
	if err != nil {
		return fmt.Errorf("failed to run database migrations: %w", err)
	}
	log.Println("Database migrations executed successfully")
	return nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
