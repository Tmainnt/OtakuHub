package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"otakuhub-backend/internal/middleware"
	"otakuhub-backend/internal/models"
)

type UserHandler struct {
	userRepo *models.UserRepository
}

func authenticatedUserID(r *http.Request) (int, bool) {
	value, ok := r.Context().Value(middleware.UserContextKey).(string)
	if !ok {
		return 0, false
	}
	id, err := strconv.Atoi(value)
	return id, err == nil && id > 0
}

func ownsUserRequest(w http.ResponseWriter, r *http.Request, requested int) bool {
	userID, ok := authenticatedUserID(r)
	if !ok || userID != requested {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return false
	}
	return true
}

func NewUserHandler(db *sql.DB) *UserHandler {
	return &UserHandler{
		userRepo: models.NewUserRepository(db),
	}
}

func (h *UserHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract user ID or username from URL or context
	// For simplicity, let's accept query parameter ?id=... or parse path
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "User ID required", http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}
	viewerID, authenticated := authenticatedUserID(r)
	if !authenticated {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	user, err := h.userRepo.GetUserByID(id)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	favorites := []models.Favorite{}
	if viewerID == id {
		favorites, err = h.userRepo.GetUserFavorites(id)
		if err != nil {
			favorites = []models.Favorite{}
		}
	}

	response := map[string]interface{}{
		"user":        user,
		"favorites":   favorites,
		"radar_stats": map[string]int{},
		"is_owner":    viewerID == id,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *UserHandler) GetFavorites(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userIDStr := r.URL.Query().Get("user_id")
	if userIDStr == "" {
		http.Error(w, "User ID required", http.StatusBadRequest)
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}
	if !ownsUserRequest(w, r, userID) {
		return
	}

	favorites, err := h.userRepo.GetUserFavorites(userID)
	if err != nil {
		http.Error(w, "Could not fetch favorites", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(favorites)
}

func (h *UserHandler) AddFavorite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		UserID   int    `json:"user_id"`
		ItemID   int    `json:"item_id"`
		ItemType string `json:"item_type"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}
	if !ownsUserRequest(w, r, req.UserID) {
		return
	}

	err := h.userRepo.AddFavorite(req.UserID, req.ItemID, req.ItemType)
	if err != nil {
		http.Error(w, "Could not add favorite", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Write([]byte(`{"status":"favorite added"}`))
}

func (h *UserHandler) DeleteFavorite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	favIDStr := r.URL.Query().Get("id")
	userIDStr := r.URL.Query().Get("user_id")
	if favIDStr == "" || userIDStr == "" {
		http.Error(w, "Favorite ID and User ID required", http.StatusBadRequest)
		return
	}

	favID, _ := strconv.Atoi(favIDStr)
	userID, _ := strconv.Atoi(userIDStr)
	if !ownsUserRequest(w, r, userID) {
		return
	}

	err := h.userRepo.DeleteFavorite(favID, userID)
	if err != nil {
		http.Error(w, "Could not delete favorite", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"favorite deleted"}`))
}
