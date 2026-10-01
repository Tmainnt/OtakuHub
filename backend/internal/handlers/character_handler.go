package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"otakuhub-backend/internal/models"
)

type CharacterHandler struct {
	repo *models.CharacterRepository
}

func NewCharacterHandler(db *sql.DB) *CharacterHandler {
	return &CharacterHandler{repo: models.NewCharacterRepository(db)}
}

func (h *CharacterHandler) GetCharacterList(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	filters := models.CharacterFilters{
		Name:       strings.TrimSpace(r.URL.Query().Get("query")),
		MediaTitle: strings.TrimSpace(r.URL.Query().Get("title")),
		MediaType:  strings.TrimSpace(r.URL.Query().Get("type")),
	}
	var err error
	if value := r.URL.Query().Get("year_from"); value != "" {
		filters.YearFrom, err = strconv.Atoi(value)
		if err != nil || filters.YearFrom < 0 {
			http.Error(w, "Invalid year_from", http.StatusBadRequest)
			return
		}
	}
	if value := r.URL.Query().Get("year_to"); value != "" {
		filters.YearTo, err = strconv.Atoi(value)
		if err != nil || filters.YearTo < 0 || (filters.YearFrom > 0 && filters.YearTo < filters.YearFrom) {
			http.Error(w, "Invalid year_to", http.StatusBadRequest)
			return
		}
	}
	list, err := h.repo.GetAll(filters)
	if err != nil {
		http.Error(w, "Could not fetch characters", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(list)
}

func (h *CharacterHandler) GetCharacterDetail(w http.ResponseWriter, r *http.Request) {
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
		http.Error(w, "Invalid character ID", http.StatusBadRequest)
		return
	}

	c, err := h.repo.GetByID(id)
	if err != nil {
		http.Error(w, "Character not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}
