package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"otakuhub-backend/internal/database"
	"otakuhub-backend/internal/handlers"
	"otakuhub-backend/internal/middleware"

	"github.com/joho/godotenv"
)

func main() {
	loadEnvironment()

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET is required")
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
	protected := func(handler http.HandlerFunc) http.Handler {
		return middleware.AuthMiddleware([]byte(jwtSecret), handler)
	}
	adminProtected := func(handler http.HandlerFunc) http.Handler {
		return protected(func(w http.ResponseWriter, r *http.Request) {
			middleware.RequireAdmin(handler).ServeHTTP(w, r)
		})
	}
	mux.Handle("/api/users/profile", protected(userHandler.GetProfile))
	mux.Handle("/api/users/favorites", protected(func(w http.ResponseWriter, r *http.Request) {
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
	}))

	// Media routes
	mux.Handle("/api/media", protected(mediaHandler.GetMediaList))
	mux.Handle("/api/media/", protected(mediaHandler.GetMediaDetail))

	// Character routes
	mux.Handle("/api/characters", protected(charHandler.GetCharacterList))
	mux.Handle("/api/characters/", protected(charHandler.GetCharacterDetail))

	// Admin routes
	mux.Handle("/api/admin/media", adminProtected(adminHandler.HandleMediaCRUD))
	mux.Handle("/api/admin/characters", adminProtected(adminHandler.HandleCharacterCRUD))

	// Post routes
	mux.HandleFunc("/api/posts", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			postHandler.GetPosts(w, r)
		case http.MethodPost:
			protected(postHandler.CreatePost).ServeHTTP(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	})
	mux.Handle("/api/users/recommendations", protected(postHandler.GetRecommendations))

	// Chat routes
	mux.Handle("/api/chat/rooms", protected(func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			chatHandler.GetRooms(w, r)
		case http.MethodPost:
			chatHandler.CreateRoom(w, r)
		default:
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		}
	}))
	mux.Handle("/api/chat/join", protected(chatHandler.JoinRoomByCode))
	mux.Handle("/api/chat/rooms/", protected(chatHandler.HandleRoomAction))
	mux.Handle("/api/chat/upload", protected(chatHandler.HandleFileUpload))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	handler := middleware.CorsMiddleware(middleware.LogMiddleware(mux))

	log.Printf("Starting OtakuHub Go backend server on port %s...", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func loadEnvironment() {
	workingDir, err := os.Getwd()
	if err != nil {
		log.Printf("Could not determine working directory for .env lookup: %v", err)
		return
	}

	// Support starting the server from the repository root, backend/, or backend/cmd/.
	paths := []string{".env", "backend/.env", "../.env", "../../.env", "../../backend/.env"}
	seen := make(map[string]struct{}, len(paths))
	for _, candidate := range paths {
		path := filepath.Clean(filepath.Join(workingDir, candidate))
		if _, exists := seen[path]; exists {
			continue
		}
		seen[path] = struct{}{}

		if info, statErr := os.Stat(path); statErr != nil || info.IsDir() {
			continue
		}
		if loadErr := godotenv.Load(path); loadErr != nil {
			log.Printf("Could not load environment file %s: %v", path, loadErr)
		}
	}
}
