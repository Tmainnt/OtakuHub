package models

import (
	"database/sql"
)

type ChatRepository struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

func (r *ChatRepository) GetRooms() ([]ChatRoom, error) {
	rows, err := r.db.Query(`SELECT id, name, is_private, created_at FROM chat_rooms`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rooms []ChatRoom
	for rows.Next() {
		var cr ChatRoom
		if err := rows.Scan(&cr.ID, &cr.Name, &cr.IsPrivate, &cr.CreatedAt); err != nil {
			return nil, err
		}
		rooms = append(rooms, cr)
	}
	return rooms, nil
}

func (r *ChatRepository) CreateRoom(name string, isPrivate bool) (*ChatRoom, error) {
	query := `INSERT INTO chat_rooms (name, is_private) VALUES ($1, $2) RETURNING id, created_at`
	var cr ChatRoom
	cr.Name = name
	cr.IsPrivate = isPrivate
	err := r.db.QueryRow(query, name, isPrivate).Scan(&cr.ID, &cr.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &cr, nil
}

func (r *ChatRepository) SaveMessage(m *Message) error {
	query := `INSERT INTO messages (room_id, sender_id, recipient_id, content, file_url, file_type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`
	return r.db.QueryRow(query, m.RoomID, m.SenderID, m.RecipientID, m.Content, m.FileUrl, m.FileType).Scan(&m.ID, &m.CreatedAt)
}
