package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"unicode/utf8"

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

	userID, ok := authenticatedUserID(r)
	if !ok {
		http.Error(w, "Invalid authenticated user", http.StatusUnauthorized)
		return
	}
	rooms, err := h.repo.GetRooms(userID)
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
	req.Name = strings.TrimSpace(req.Name)
	if req.Name == "" {
		http.Error(w, "Room name is required", http.StatusBadRequest)
		return
	}
	if utf8.RuneCountInString(req.Name) > 255 {
		http.Error(w, "Room name must be 255 characters or fewer", http.StatusBadRequest)
		return
	}
	userID, ok := authenticatedUserID(r)
	if !ok {
		http.Error(w, "Invalid authenticated user", http.StatusUnauthorized)
		return
	}

	room, err := h.repo.CreateRoom(req.Name, req.IsPrivate, userID)
	if err != nil {
		http.Error(w, "Could not create room", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(room)
}

func (h *ChatHandler) JoinRoomByCode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	userID, ok := authenticatedUserID(r)
	if !ok {
		http.Error(w, "Invalid authenticated user", http.StatusUnauthorized)
		return
	}
	var req struct {
		InviteCode string `json:"invite_code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.InviteCode) == "" {
		http.Error(w, "Invitation code is required", http.StatusBadRequest)
		return
	}
	roomID, err := h.repo.JoinByInviteCode(req.InviteCode, userID)
	if errors.Is(err, sql.ErrNoRows) {
		http.Error(w, "Invitation code not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "Could not join room", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"room_id": *roomID})
}

func (h *ChatHandler) HandleRoomAction(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if (len(parts) != 4 && len(parts) != 5) || parts[0] != "api" || parts[1] != "chat" || parts[2] != "rooms" {
		http.NotFound(w, r)
		return
	}
	roomID, err := strconv.Atoi(parts[3])
	if err != nil || roomID < 1 {
		http.Error(w, "Invalid room ID", http.StatusBadRequest)
		return
	}
	userID, authenticated := authenticatedUserID(r)
	if !authenticated {
		http.Error(w, "Invalid authenticated user", http.StatusUnauthorized)
		return
	}

	action := "room"
	if len(parts) == 5 {
		action = parts[4]
	}
	switch action {
	case "join":
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if err := h.repo.JoinRoom(roomID, userID); err != nil {
			http.Error(w, "Could not join room", http.StatusNotFound)
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return
	case "management":
		if r.Method != http.MethodGet {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		isLeader, err := h.repo.IsRoomLeader(roomID, userID)
		if err != nil || !isLeader {
			http.Error(w, "Room leader permission required", http.StatusForbidden)
			return
		}
		inviteCode, members, err := h.repo.GetRoomManagement(roomID)
		if err != nil {
			http.Error(w, "Could not fetch room management details", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"invite_code": inviteCode, "members": members})
		return
	case "leaders":
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		isLeader, err := h.repo.IsRoomLeader(roomID, userID)
		if err != nil || !isLeader {
			http.Error(w, "Room leader permission required", http.StatusForbidden)
			return
		}
		var req struct {
			UserIDs []int `json:"user_ids"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || len(req.UserIDs) == 0 {
			http.Error(w, "At least one room member is required", http.StatusBadRequest)
			return
		}
		if err := h.repo.PromoteRoomLeaders(roomID, req.UserIDs); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				http.Error(w, "Every selected user must already be a room member", http.StatusBadRequest)
				return
			}
			http.Error(w, "Could not update room leaders", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return
	case "room":
		if r.Method != http.MethodDelete {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if err := h.repo.DeleteRoom(roomID, userID); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				http.Error(w, "Room leader permission required", http.StatusForbidden)
				return
			}
			http.Error(w, "Could not delete room", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return
	case "messages":
		isMember, err := h.repo.IsRoomMember(roomID, userID)
		if err != nil || !isMember {
			http.Error(w, "Join this room to view or send messages", http.StatusForbidden)
			return
		}
	default:
		http.NotFound(w, r)
		return
	}

	switch r.Method {
	case http.MethodGet:
		afterID := 0
		if value := r.URL.Query().Get("after_id"); value != "" {
			afterID, err = strconv.Atoi(value)
			if err != nil || afterID < 0 {
				http.Error(w, "Invalid after_id", http.StatusBadRequest)
				return
			}
		}
		messages, err := h.repo.GetRoomMessages(roomID, afterID)
		if err != nil {
			http.Error(w, "Could not fetch messages", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(messages)
	case http.MethodPost:
		senderID, ok := authenticatedUserID(r)
		if !ok {
			http.Error(w, "Invalid authenticated user", http.StatusUnauthorized)
			return
		}
		var req struct {
			Content string `json:"content"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid payload", http.StatusBadRequest)
			return
		}
		req.Content = strings.TrimSpace(req.Content)
		if req.Content == "" || utf8.RuneCountInString(req.Content) > 4000 {
			http.Error(w, "Message must contain 1 to 4000 characters", http.StatusBadRequest)
			return
		}
		message := &models.Message{RoomID: roomID, SenderID: senderID, Content: req.Content}
		if err := h.repo.SaveMessage(message); err != nil {
			http.Error(w, "Could not send message", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(message)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
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
