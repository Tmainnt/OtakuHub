package models

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"strings"
)

type ChatRepository struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

func (r *ChatRepository) GetRooms(userID int) ([]ChatRoom, error) {
	rows, err := r.db.Query(`SELECT cr.id, cr.name, cr.is_private, COALESCE(cr.created_by, 0),
		EXISTS (SELECT 1 FROM chat_room_members mine WHERE mine.room_id = cr.id AND mine.user_id = $1),
		EXISTS (SELECT 1 FROM chat_room_members lead WHERE lead.room_id = cr.id AND lead.user_id = $1 AND lead.role = 'leader'),
		(SELECT COUNT(*) FROM chat_room_members total WHERE total.room_id = cr.id), cr.created_at
		FROM chat_rooms cr
		WHERE NOT cr.is_private OR EXISTS (SELECT 1 FROM chat_room_members mine WHERE mine.room_id = cr.id AND mine.user_id = $1)
		ORDER BY cr.created_at DESC, cr.id DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	rooms := make([]ChatRoom, 0)
	for rows.Next() {
		var cr ChatRoom
		if err := rows.Scan(&cr.ID, &cr.Name, &cr.IsPrivate, &cr.CreatedBy, &cr.IsMember, &cr.IsLeader, &cr.MemberCount, &cr.CreatedAt); err != nil {
			return nil, err
		}
		rooms = append(rooms, cr)
	}
	return rooms, nil
}

func (r *ChatRepository) CreateRoom(name string, isPrivate bool, userID int) (*ChatRoom, error) {
	codeBytes := make([]byte, 8)
	if _, err := rand.Read(codeBytes); err != nil {
		return nil, err
	}
	inviteCode := strings.ToUpper(hex.EncodeToString(codeBytes))
	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	var cr ChatRoom
	cr.Name, cr.IsPrivate, cr.CreatedBy, cr.IsMember, cr.IsLeader, cr.MemberCount = name, isPrivate, userID, true, true, 1
	err = tx.QueryRow(`INSERT INTO chat_rooms (name, is_private, created_by, invite_code) VALUES ($1, $2, $3, $4) RETURNING id, created_at`, name, isPrivate, userID, inviteCode).Scan(&cr.ID, &cr.CreatedAt)
	if err != nil {
		return nil, err
	}
	if _, err = tx.Exec(`INSERT INTO chat_room_members (room_id, user_id, role) VALUES ($1, $2, 'leader')`, cr.ID, userID); err != nil {
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		return nil, err
	}
	return &cr, nil
}

func (r *ChatRepository) IsRoomMember(roomID, userID int) (bool, error) {
	var isMember bool
	err := r.db.QueryRow(`SELECT EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = $1 AND user_id = $2)`, roomID, userID).Scan(&isMember)
	return isMember, err
}

func (r *ChatRepository) IsRoomLeader(roomID, userID int) (bool, error) {
	var isLeader bool
	err := r.db.QueryRow(`SELECT EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = $1 AND user_id = $2 AND role = 'leader')`, roomID, userID).Scan(&isLeader)
	return isLeader, err
}

func (r *ChatRepository) JoinRoom(roomID, userID int) error {
	var isPrivate bool
	if err := r.db.QueryRow(`SELECT is_private FROM chat_rooms WHERE id = $1`, roomID).Scan(&isPrivate); err != nil {
		return err
	}
	if isPrivate {
		return errors.New("private rooms require an invitation code")
	}
	_, err := r.db.Exec(`INSERT INTO chat_room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT (room_id, user_id) DO NOTHING`, roomID, userID)
	return err
}

func (r *ChatRepository) JoinByInviteCode(code string, userID int) (*int, error) {
	var roomID int
	err := r.db.QueryRow(`SELECT id FROM chat_rooms WHERE invite_code = $1`, strings.ToUpper(strings.TrimSpace(code))).Scan(&roomID)
	if err != nil {
		return nil, err
	}
	if _, err := r.db.Exec(`INSERT INTO chat_room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT (room_id, user_id) DO NOTHING`, roomID, userID); err != nil {
		return nil, err
	}
	return &roomID, nil
}

func (r *ChatRepository) GetRoomManagement(roomID int) (string, []ChatRoomMember, error) {
	var inviteCode string
	if err := r.db.QueryRow(`SELECT invite_code FROM chat_rooms WHERE id = $1`, roomID).Scan(&inviteCode); err != nil {
		return "", nil, err
	}
	rows, err := r.db.Query(`SELECT u.id, u.username, m.role FROM chat_room_members m JOIN users u ON u.id = m.user_id WHERE m.room_id = $1 ORDER BY (m.role = 'leader') DESC, u.username`, roomID)
	if err != nil {
		return "", nil, err
	}
	defer rows.Close()
	members := make([]ChatRoomMember, 0)
	for rows.Next() {
		var member ChatRoomMember
		if err := rows.Scan(&member.UserID, &member.Username, &member.Role); err != nil {
			return "", nil, err
		}
		members = append(members, member)
	}
	return inviteCode, members, rows.Err()
}

func (r *ChatRepository) PromoteRoomLeaders(roomID int, userIDs []int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, userID := range userIDs {
		result, err := tx.Exec(`UPDATE chat_room_members SET role = 'leader' WHERE room_id = $1 AND user_id = $2`, roomID, userID)
		if err != nil {
			return err
		}
		count, err := result.RowsAffected()
		if err != nil {
			return err
		}
		if count == 0 {
			return sql.ErrNoRows
		}
	}
	return tx.Commit()
}

func (r *ChatRepository) DeleteRoom(roomID, userID int) error {
	result, err := r.db.Exec(`DELETE FROM chat_rooms WHERE id = $1 AND EXISTS (SELECT 1 FROM chat_room_members WHERE room_id = $1 AND user_id = $2 AND role = 'leader')`, roomID, userID)
	if err != nil {
		return err
	}
	count, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if count == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *ChatRepository) SaveMessage(m *Message) error {
	query := `INSERT INTO messages (room_id, sender_id, recipient_id, content, file_url, file_type)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, (SELECT username FROM users WHERE id = $2)`
	return r.db.QueryRow(query, m.RoomID, m.SenderID, m.RecipientID, m.Content, m.FileUrl, m.FileType).Scan(&m.ID, &m.CreatedAt, &m.SenderUsername)
}

func (r *ChatRepository) GetRoomMessages(roomID, afterID int) ([]Message, error) {
	query := `SELECT m.id, m.room_id, m.sender_id, u.username, m.content, m.created_at
		FROM messages m JOIN users u ON u.id = m.sender_id
		WHERE m.room_id = $1 AND m.id > $2
		ORDER BY m.id ASC LIMIT 100`
	if afterID == 0 {
		query = `SELECT m.id, m.room_id, m.sender_id, u.username, m.content, m.created_at
			FROM (SELECT id, room_id, sender_id, content, created_at FROM messages WHERE room_id = $1 ORDER BY id DESC LIMIT 100) m
			JOIN users u ON u.id = m.sender_id ORDER BY m.id ASC`
	}
	var rows *sql.Rows
	var err error
	if afterID == 0 {
		rows, err = r.db.Query(query, roomID)
	} else {
		rows, err = r.db.Query(query, roomID, afterID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := make([]Message, 0)
	for rows.Next() {
		var message Message
		if err := rows.Scan(&message.ID, &message.RoomID, &message.SenderID, &message.SenderUsername, &message.Content, &message.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, message)
	}
	return messages, rows.Err()
}
