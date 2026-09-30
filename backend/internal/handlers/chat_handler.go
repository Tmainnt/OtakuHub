package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"otakuhub-backend/internal/models"
)

type ChatHandler struct {
	repo *models.ChatRepository
}

func NewChatHandler(db *sql.DB) *ChatHandler {
	return &ChatHandler{repo: models.NewChatRepository(db)}
}

func (h *ChatHandler) GetRooms(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rooms, err := h.repo.GetRooms()
	if err != nil {
		http.Error(w, "Could not fetch chat rooms", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(rooms)
}

func (h *ChatHandler) CreateRoom(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Name      string `json:"name"`
		IsPrivate bool   `json:"is_private"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	room, err := h.repo.CreateRoom(req.Name, req.IsPrivate)
	if err != nil {
		http.Error(w, "Could not create room", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(room)
}

func (h *ChatHandler) HandleFileUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Enforce 50MB max file size limit per requirement
	r.Body = http.MaxBytesReader(w, r.Body, 50<<20)
	if err := r.ParseMultipartForm(50 << 20); err != nil {
		http.Error(w, "File size exceeds 50MB limit", http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"file uploaded successfully","size_limit":"<= 50MB"}`))
}
