package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"otakuhub-backend/internal/middleware"
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
	userID, ok := r.Context().Value(middleware.UserContextKey).(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	userIDValue, err := strconv.Atoi(userID)
	if err != nil || userIDValue <= 0 {
		http.Error(w, "Invalid authenticated user", http.StatusUnauthorized)
		return
	}
	p.UserID = userIDValue
	if strings.TrimSpace(p.Content) == "" {
		http.Error(w, "Post content is required", http.StatusBadRequest)
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode([]interface{}{})
}
