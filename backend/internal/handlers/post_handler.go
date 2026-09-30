package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"otakuhub-backend/internal/models"
)

type PostHandler struct {
	repo *models.PostRepository
}

func NewPostHandler(db *sql.DB) *PostHandler {
	return &PostHandler{repo: models.NewPostRepository(db)}
}

func (h *PostHandler) GetPosts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	posts, err := h.repo.GetAll()
	if err != nil {
		http.Error(w, "Could not fetch posts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)
}

func (h *PostHandler) CreatePost(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var p models.Post
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if err := h.repo.Create(&p); err != nil {
		http.Error(w, "Could not create post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(p)
}

func (h *PostHandler) GetRecommendations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	recommendations := []map[string]interface{}{
		{"id": 2, "username": "AnimeOtaku99", "match_percentage": 95, "favorite_genre": "Action & Fantasy"},
		{"id": 3, "username": "MangaReaderX", "match_percentage": 88, "favorite_genre": "Romance & Slice of Life"},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(recommendations)
}
