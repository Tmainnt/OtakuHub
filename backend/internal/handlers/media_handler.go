package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"otakuhub-backend/internal/models"
)

type MediaHandler struct {
	repo          *models.MediaRepository
	characterRepo *models.CharacterRepository
}

func NewMediaHandler(db *sql.DB) *MediaHandler {
	return &MediaHandler{repo: models.NewMediaRepository(db), characterRepo: models.NewCharacterRepository(db)}
}

func (h *MediaHandler) GetMediaList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query().Get("query")
	mediaType := r.URL.Query().Get("type")

	mediaList, err := h.repo.GetAll(query, mediaType)
	if err != nil {
		http.Error(w, "Could not fetch media list", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mediaList)
}

func (h *MediaHandler) GetMediaDetail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	parts := strings.Split(r.URL.Path, "/")
	if len(parts) == 0 {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	idStr := parts[len(parts)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid media ID", http.StatusBadRequest)
		return
	}

	media, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "Media not found", http.StatusNotFound)
		return
	}
	media.Characters, err = h.characterRepo.GetForMedia(id)
	if err != nil {
		http.Error(w, "Could not fetch title characters", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(media)
}
