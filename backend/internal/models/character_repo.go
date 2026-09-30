package models

import (
	"database/sql"
)

type CharacterRepository struct {
	db *sql.DB
}

func NewCharacterRepository(db *sql.DB) *CharacterRepository {
	return &CharacterRepository{db: db}
}

func (r *CharacterRepository) GetAll() ([]Character, error) {
	rows, err := r.db.Query(`SELECT id, name, personal_info, birthplace, family_details, image_collection, related_media_songs_games FROM characters`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []Character
	for rows.Next() {
		var c Character
		if err := rows.Scan(&c.ID, &c.Name, &c.PersonalInfo, &c.Birthplace, &c.FamilyDetails, &c.ImageCollection, &c.RelatedMediaSongsGames); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	return list, nil
}

func (r *CharacterRepository) GetByID(id int) (*Character, error) {
	query := `SELECT id, name, personal_info, birthplace, family_details, image_collection, related_media_songs_games FROM characters WHERE id = $1`
	var c Character
	err := r.db.QueryRow(query, id).Scan(&c.ID, &c.Name, &c.PersonalInfo, &c.Birthplace, &c.FamilyDetails, &c.ImageCollection, &c.RelatedMediaSongsGames)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *CharacterRepository) Create(c *Character) error {
	query := `INSERT INTO characters (name, personal_info, birthplace, family_details, image_collection, related_media_songs_games) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	return r.db.QueryRow(query, c.Name, c.PersonalInfo, c.Birthplace, c.FamilyDetails, c.ImageCollection, c.RelatedMediaSongsGames).Scan(&c.ID)
}

func (r *CharacterRepository) Update(c *Character) error {
	query := `UPDATE characters SET name=$1, personal_info=$2, birthplace=$3, family_details=$4, image_collection=$5, related_media_songs_games=$6 WHERE id=$7`
	_, err := r.db.Exec(query, c.Name, c.PersonalInfo, c.Birthplace, c.FamilyDetails, c.ImageCollection, c.RelatedMediaSongsGames, c.ID)
	return err
}

func (r *CharacterRepository) Delete(id int) error {
	query := `DELETE FROM characters WHERE id = $1`
	_, err := r.db.Exec(query, id)
	return err
}
