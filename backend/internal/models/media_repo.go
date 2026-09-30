package models

import (
	"database/sql"
	"fmt"
)

type MediaRepository struct {
	db *sql.DB
}

func NewMediaRepository(db *sql.DB) *MediaRepository {
	return &MediaRepository{db: db}
}

func (r *MediaRepository) GetAll(query, mediaType string) ([]Media, error) {
	sqlQuery := `SELECT id, title, type, origin_country, source_format, release_year, creator, episodes_or_volumes, watch_order_info, ost_list, social_links, created_at FROM media WHERE 1=1`
	var args []interface{}
	argCount := 1

	if query != "" {
		sqlQuery += fmt.Sprintf(` AND title ILIKE $%d`, argCount)
		args = append(args, "%"+query+"%")
		argCount++
	}

	if mediaType != "" {
		sqlQuery += fmt.Sprintf(` AND type = $%d`, argCount)
		args = append(args, mediaType)
		argCount++
	}

	sqlQuery += ` ORDER BY id DESC`

	rows, err := r.db.Query(sqlQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Media
	for rows.Next() {
		var m Media
		if err := rows.Scan(&m.ID, &m.Title, &m.Type, &m.OriginCountry, &m.SourceFormat, &m.ReleaseYear, &m.Creator, &m.EpisodesOrVolumes, &m.WatchOrderInfo, &m.OstList, &m.SocialLinks, &m.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *MediaRepository) GetByID(id int) (*Media, error) {
	query := `SELECT id, title, type, origin_country, source_format, release_year, creator, episodes_or_volumes, watch_order_info, ost_list, social_links, created_at FROM media WHERE id = $1`
	var m Media
	err := r.db.QueryRow(query, id).Scan(&m.ID, &m.Title, &m.Type, &m.OriginCountry, &m.SourceFormat, &m.ReleaseYear, &m.Creator, &m.EpisodesOrVolumes, &m.WatchOrderInfo, &m.OstList, &m.SocialLinks, &m.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *MediaRepository) Create(m *Media) error {
	query := `INSERT INTO media (title, type, origin_country, source_format, release_year, creator, episodes_or_volumes, watch_order_info, ost_list, social_links) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`
	return r.db.QueryRow(query, m.Title, m.Type, m.OriginCountry, m.SourceFormat, m.ReleaseYear, m.Creator, m.EpisodesOrVolumes, m.WatchOrderInfo, m.OstList, m.SocialLinks).Scan(&m.ID)
}

func (r *MediaRepository) Update(m *Media) error {
	query := `UPDATE media SET title=$1, type=$2, origin_country=$3, source_format=$4, release_year=$5, creator=$6, episodes_or_volumes=$7, watch_order_info=$8, ost_list=$9, social_links=$10 WHERE id=$11`
	_, err := r.db.Exec(query, m.Title, m.Type, m.OriginCountry, m.SourceFormat, m.ReleaseYear, m.Creator, m.EpisodesOrVolumes, m.WatchOrderInfo, m.OstList, m.SocialLinks, m.ID)
	return err
}

func (r *MediaRepository) Delete(id int) error {
	query := `DELETE FROM media WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
