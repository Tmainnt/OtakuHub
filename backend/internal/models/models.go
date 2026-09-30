package models

import "time"

type User struct {
	ID           int       `json:"id"`
	Username     string    `json:"username"`
	PasswordHash string    `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
}

type Media struct {
	ID                int       `json:"id"`
	Title             string    `json:"title"`
	Type              string    `json:"type"` // anime, manga, novel
	OriginCountry     string    `json:"origin_country"`
	SourceFormat      string    `json:"source_format"`
	ReleaseYear       int       `json:"release_year"`
	Creator           string    `json:"creator"`
	EpisodesOrVolumes int       `json:"episodes_or_volumes"`
	WatchOrderInfo    string    `json:"watch_order_info"`
	OstList           string    `json:"ost_list"`
	SocialLinks       string    `json:"social_links"`
	CreatedAt         time.Time `json:"created_at"`
}

type Character struct {
	ID                     int    `json:"id"`
	Name                   string `json:"name"`
	PersonalInfo           string `json:"personal_info"`
	Birthplace             string `json:"birthplace"`
	FamilyDetails          string `json:"family_details"`
	ImageCollection        string `json:"image_collection"`
	RelatedMediaSongsGames string `json:"related_media_songs_games"`
}

type Favorite struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	ItemID    int       `json:"item_id"`
	ItemType  string    `json:"item_type"` // media, character
	CreatedAt time.Time `json:"created_at"`
}

type Post struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	MediaUrls string    `json:"media_urls"`
	CreatedAt time.Time `json:"created_at"`
}

type ChatRoom struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	IsPrivate bool      `json:"is_private"`
	CreatedAt time.Time `json:"created_at"`
}

type Message struct {
	ID          int       `json:"id"`
	RoomID      int       `json:"room_id"`
	SenderID    int       `json:"sender_id"`
	RecipientID *int      `json:"recipient_id,omitempty"`
	Content     string    `json:"content"`
	FileUrl     string    `json:"file_url,omitempty"`
	FileType    string    `json:"file_type,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}
