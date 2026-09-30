package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"otakuhub-backend/internal/models"
)

type AdminHandler struct {
	mediaRepo *models.MediaRepository
	charRepo  *models.CharacterRepository
}

func NewAdminHandler(db *sql.DB) *AdminHandler {
	return &AdminHandler{
		mediaRepo: models.NewMediaRepository(db),
		charRepo:  models.NewCharacterRepository(db),
	}
}

func (h *AdminHandler) HandleMediaCRUD(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var m models.Media
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		if err := h.mediaRepo.Create(&m); err != nil {
			http.Error(w, "Could not create media", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(m)

	case http.MethodPut:
		var m models.Media
		if err := json.NewDecoder(r.Body).Decode(&m); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		if err := h.mediaRepo.Update(&m); err != nil {
			http.Error(w, "Could not update media", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"media updated"}`))

	case http.MethodDelete:
		idStr := r.URL.Query().Get("id")
		id, _ := strconv.Atoi(idStr)
		if err := h.mediaRepo.Delete(id); err != nil {
			http.Error(w, "Could not delete media", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"media deleted"}`))

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *AdminHandler) HandleCharacterCRUD(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		var c models.Character
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		if err := h.charRepo.Create(&c); err != nil {
			http.Error(w, "Could not create character", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(c)

	case http.MethodPut:
		var c models.Character
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		if err := h.charRepo.Update(&c); err != nil {
			http.Error(w, "Could not update character", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"character updated"}`))

	case http.MethodDelete:
		idStr := r.URL.Query().Get("id")
		id, _ := strconv.Atoi(idStr)
		if err := h.charRepo.Delete(id); err != nil {
			http.Error(w, "Could not delete character", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"character deleted"}`))

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}
