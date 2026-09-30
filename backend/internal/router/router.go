package router

import (
	"net/http"

	"otakuhub-backend/internal/middleware"
)

func NewRouter() http.Handler {
	mux := http.NewServeMux()

	// Health check endpoint
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// Add CORS middleware wrapper
	return middleware.CorsMiddleware(mux)
}
