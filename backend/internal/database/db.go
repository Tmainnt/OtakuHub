package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func InitDB() (*sql.DB, error) {
	host := getEnv("DB_HOST", "localhost")
	port := getEnv("DB_PORT", "5432")
	user := getEnv("DB_USER", "postgres")
	password := getEnv("DB_PASSWORD", "Reyzaburrel123@")
	dbname := getEnv("DB_NAME", "otakuhub")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		return nil, fmt.Errorf("error connecting to database: %v", err)
	}

	log.Println("Successfully connected to PostgreSQL database")
	runMigrations(DB)
	return DB, nil
}

func runMigrations(db *sql.DB) {
	schemaQuery := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

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
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
	`
	_, err := db.Exec(schemaQuery)
	if err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}
	log.Println("Database migrations executed successfully")
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
