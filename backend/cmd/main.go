package main

import (
	"log"
	"net/http"
	"os"

	"otakuhub-backend/internal/database"
	"otakuhub-backend/internal/handlers"
	"otakuhub-backend/internal/middleware"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env if present
	_ = godotenv.Load(".env")

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "your_jwt_secret_key_here"
	}

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, jwtSecret)
	userHandler := handlers.NewUserHandler(db)
	mediaHandler := handlers.NewMediaHandler(db)
	charHandler := handlers.NewCharacterHandler(db)
	adminHandler := handlers.NewAdminHandler(db)
	postHandler := handlers.NewPostHandler(db)
	chatHandler := handlers.NewChatHandler(db)

	mux := http.NewServeMux()

	// Health check
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Auth routes
	mux.HandleFunc("/api/auth/register", authHandler.Register)
	mux.HandleFunc("/api/auth/login", authHandler.Login)

	// User routes
	mux.HandleFunc("/api/users/profile", userHandler.GetProfile)
	mux.HandleFunc("/api/users/favorites", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			userHandler.GetFavorites(w, r)
		case http.MethodPost:
			userHandler.AddFavorite(w, r)
		case http.MethodDelete:
			userHandler.DeleteFavorite(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// Media routes
	mux.HandleFunc("/api/media", mediaHandler.GetMediaList)
	mux.HandleFunc("/api/media/", mediaHandler.GetMediaDetail)

	// Character routes
	mux.HandleFunc("/api/characters", charHandler.GetCharacterList)
	mux.HandleFunc("/api/characters/", charHandler.GetCharacterDetail)

	// Admin routes
	mux.HandleFunc("/api/admin/media", adminHandler.HandleMediaCRUD)
	mux.HandleFunc("/api/admin/characters", adminHandler.HandleCharacterCRUD)

	// Post routes
	mux.HandleFunc("/api/posts", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			postHandler.GetPosts(w, r)
		case http.MethodPost:
			postHandler.CreatePost(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/users/recommendations", postHandler.GetRecommendations)

	// Chat routes
	mux.HandleFunc("/api/chat/rooms", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			chatHandler.GetRooms(w, r)
		case http.MethodPost:
			chatHandler.CreateRoom(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/chat/upload", chatHandler.HandleFileUpload)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	handler := middleware.CorsMiddleware(middleware.LogMiddleware(mux))

	log.Printf("Starting OtakuHub Go backend server on port %s...", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
