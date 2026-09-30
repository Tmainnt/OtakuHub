package models

import (
	"database/sql"
	"errors"
	"time"

	"golang.org/x/crypto/bcrypt"
)

type UserRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(username, password string) (*User, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	query := `INSERT INTO users (username, password_hash, created_at) VALUES ($1, $2, $3) RETURNING id, username, created_at`
	var user User
	now := time.Now()
	err = r.db.QueryRow(query, username, string(hashedPassword), now).Scan(&user.ID, &user.Username, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetUserByUsername(username string) (*User, string, error) {
	query := `SELECT id, username, password_hash, created_at FROM users WHERE username = $1`
	var user User
	var passwordHash string
	err := r.db.QueryRow(query, username).Scan(&user.ID, &user.Username, &passwordHash, &user.CreatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, "", errors.New("user not found")
		}
		return nil, "", err
	}
	return &user, passwordHash, nil
}

func (r *UserRepository) GetUserByID(id int) (*User, error) {
	query := `SELECT id, username, created_at FROM users WHERE id = $1`
	var user User
	err := r.db.QueryRow(query, id).Scan(&user.ID, &user.Username, &user.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepository) GetUserFavorites(userID int) ([]Favorite, error) {
	query := `SELECT id, user_id, item_id, item_type, created_at FROM favorites WHERE user_id = $1`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var favorites []Favorite
	for rows.Next() {
		var f Favorite
		if err := rows.Scan(&f.ID, &f.UserID, &f.ItemID, &f.ItemType, &f.CreatedAt); err != nil {
			return nil, err
		}
		favorites = append(favorites, f)
	}
	return favorites, nil
}

func (r *UserRepository) AddFavorite(userID, itemID int, itemType string) error {
	query := `INSERT INTO favorites (user_id, item_id, item_type) VALUES ($1, $2, $3)`
	_, err := r.db.Exec(query, userID, itemID, itemType)
	return err
}

func (r *UserRepository) DeleteFavorite(favoriteID, userID int) error {
	query := `DELETE FROM favorites WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, favoriteID, userID)
	return err
}
