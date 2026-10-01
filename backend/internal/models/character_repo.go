package models

import (
	"database/sql"
	"encoding/json"
	"fmt"
)

type CharacterRepository struct {
	db *sql.DB
}

type CharacterFilters struct {
	Name       string
	MediaTitle string
	MediaType  string
	YearFrom   int
	YearTo     int
}

func NewCharacterRepository(db *sql.DB) *CharacterRepository {
	return &CharacterRepository{db: db}
}

const characterSelect = `
	SELECT c.id, c.name, COALESCE(c.personal_info, ''), COALESCE(c.birthplace, ''),
		COALESCE(c.family_details, ''), COALESCE(c.image_collection, ''), COALESCE(c.related_media_songs_games, ''),
		COALESCE((SELECT MIN(NULLIF(m0.release_year, 0)) FROM character_media cm0 JOIN media m0 ON m0.id = cm0.media_id WHERE cm0.character_id = c.id), 0),
		COALESCE(json_agg(json_build_object('id', m.id, 'title', m.title, 'type', m.type, 'release_year', m.release_year)
			ORDER BY m.release_year, m.title) FILTER (WHERE m.id IS NOT NULL), '[]'::json)
	FROM characters c
	LEFT JOIN character_media cm ON cm.character_id = c.id
	LEFT JOIN media m ON m.id = cm.media_id`

func scanCharacter(scanner interface{ Scan(...any) error }) (*Character, error) {
	var character Character
	var appearances []byte
	if err := scanner.Scan(
		&character.ID, &character.Name, &character.PersonalInfo, &character.Birthplace,
		&character.FamilyDetails, &character.ImageCollection, &character.RelatedMediaSongsGames,
		&character.FirstAppearanceYear, &appearances,
	); err != nil {
		return nil, err
	}
	if err := json.Unmarshal(appearances, &character.Appearances); err != nil {
		return nil, fmt.Errorf("decode character appearances: %w", err)
	}
	if character.Appearances == nil {
		character.Appearances = []MediaAppearance{}
	}
	return &character, nil
}

func (r *CharacterRepository) GetAll(filters CharacterFilters) ([]Character, error) {
	query := characterSelect + `
	WHERE ($1 = '' OR c.name ILIKE '%' || $1 || '%')
	AND ($2 = '' OR EXISTS (
		SELECT 1 FROM character_media cm2 JOIN media m2 ON m2.id = cm2.media_id
		WHERE cm2.character_id = c.id AND m2.title ILIKE '%' || $2 || '%'))
	AND ($3 = '' OR EXISTS (
		SELECT 1 FROM character_media cm3 JOIN media m3 ON m3.id = cm3.media_id
		WHERE cm3.character_id = c.id AND m3.type = $3))
	AND ($4 = 0 OR COALESCE((SELECT MIN(NULLIF(m4.release_year, 0)) FROM character_media cm4 JOIN media m4 ON m4.id = cm4.media_id WHERE cm4.character_id = c.id), 0) >= $4)
	AND ($5 = 0 OR COALESCE((SELECT MIN(NULLIF(m5.release_year, 0)) FROM character_media cm5 JOIN media m5 ON m5.id = cm5.media_id WHERE cm5.character_id = c.id), 0) <= $5)
	GROUP BY c.id ORDER BY c.name`
	rows, err := r.db.Query(query, filters.Name, filters.MediaTitle, filters.MediaType, filters.YearFrom, filters.YearTo)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Character, 0)
	for rows.Next() {
		character, err := scanCharacter(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *character)
	}
	return list, rows.Err()
}

func (r *CharacterRepository) GetByID(id int) (*Character, error) {
	query := characterSelect + ` WHERE c.id = $1 GROUP BY c.id`
	return scanCharacter(r.db.QueryRow(query, id))
}

func (r *CharacterRepository) GetForMedia(mediaID int) ([]Character, error) {
	rows, err := r.db.Query(`
		SELECT c.id, c.name, COALESCE(c.personal_info, ''), COALESCE(c.birthplace, ''),
			COALESCE(c.family_details, ''), COALESCE(c.image_collection, ''), COALESCE(c.related_media_songs_games, ''),
			COALESCE((SELECT MIN(NULLIF(mf.release_year, 0)) FROM character_media cmf JOIN media mf ON mf.id = cmf.media_id WHERE cmf.character_id = c.id), 0),
			m.id, m.title, m.type, m.release_year
		FROM character_media cm
		JOIN characters c ON c.id = cm.character_id
		JOIN media m ON m.id = cm.media_id
		WHERE cm.media_id = $1
		ORDER BY c.name`, mediaID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := make([]Character, 0)
	for rows.Next() {
		var character Character
		var appearance MediaAppearance
		if err := rows.Scan(
			&character.ID, &character.Name, &character.PersonalInfo, &character.Birthplace,
			&character.FamilyDetails, &character.ImageCollection, &character.RelatedMediaSongsGames,
			&character.FirstAppearanceYear, &appearance.ID, &appearance.Title, &appearance.Type, &appearance.ReleaseYear,
		); err != nil {
			return nil, err
		}
		character.Appearances = []MediaAppearance{appearance}
		list = append(list, character)
	}
	return list, rows.Err()
}

func (r *CharacterRepository) SetMediaRelations(characterID int, mediaIDs []int) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.Exec(`DELETE FROM character_media WHERE character_id = $1`, characterID); err != nil {
		return err
	}
	for _, mediaID := range mediaIDs {
		if _, err := tx.Exec(`INSERT INTO character_media (character_id, media_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, characterID, mediaID); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (r *CharacterRepository) Create(c *Character) error {
	query := `INSERT INTO characters (name, personal_info, birthplace, family_details, image_collection, related_media_songs_games) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`
	if err := r.db.QueryRow(query, c.Name, c.PersonalInfo, c.Birthplace, c.FamilyDetails, c.ImageCollection, c.RelatedMediaSongsGames).Scan(&c.ID); err != nil {
		return err
	}
	return r.SetMediaRelations(c.ID, mediaIDs(c.Appearances))
}

func (r *CharacterRepository) Update(c *Character) error {
	query := `UPDATE characters SET name=$1, personal_info=$2, birthplace=$3, family_details=$4, image_collection=$5, related_media_songs_games=$6 WHERE id=$7`
	if _, err := r.db.Exec(query, c.Name, c.PersonalInfo, c.Birthplace, c.FamilyDetails, c.ImageCollection, c.RelatedMediaSongsGames, c.ID); err != nil {
		return err
	}
	return r.SetMediaRelations(c.ID, mediaIDs(c.Appearances))
}

func mediaIDs(appearances []MediaAppearance) []int {
	ids := make([]int, 0, len(appearances))
	seen := make(map[int]struct{}, len(appearances))
	for _, appearance := range appearances {
		if appearance.ID > 0 {
			if _, exists := seen[appearance.ID]; !exists {
				ids = append(ids, appearance.ID)
				seen[appearance.ID] = struct{}{}
			}
		}
	}
	return ids
}

func (r *CharacterRepository) Delete(id int) error {
	_, err := r.db.Exec(`DELETE FROM characters WHERE id = $1`, id)
	return err
}
