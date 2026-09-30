package models

import (
	"database/sql"
)

type PostRepository struct {
	db *sql.DB
}

func NewPostRepository(db *sql.DB) *PostRepository {
	return &PostRepository{db: db}
}

func (r *PostRepository) GetAll() ([]Post, error) {
	rows, err := r.db.Query(`SELECT id, user_id, content, media_urls, created_at FROM posts ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Post
	for rows.Next() {
		var p Post
		if err := rows.Scan(&p.ID, &p.UserID, &p.Content, &p.MediaUrls, &p.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *PostRepository) Create(p *Post) error {
	query := `INSERT INTO posts (user_id, content, media_urls) VALUES ($1, $2, $3) RETURNING id, created_at`
	return r.db.QueryRow(query, p.UserID, p.Content, p.MediaUrls).Scan(&p.ID, &p.CreatedAt)
}

func (r *PostRepository) Delete(id, userID int) error {
	query := `DELETE FROM posts WHERE id = $1 AND user_id = $2`
	_, err := r.db.Exec(query, id, userID)
	return err
}
