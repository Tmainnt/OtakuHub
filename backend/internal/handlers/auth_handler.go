package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"otakuhub-backend/internal/models"

	"github.com/golang-jwt/jwt/v4"
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	userRepo *models.UserRepository
	jwtKey   []byte
}

func NewAuthHandler(db *sql.DB, jwtSecret string) *AuthHandler {
	return &AuthHandler{
		userRepo: models.NewUserRepository(db),
		jwtKey:   []byte(jwtSecret),
	}
}

type Credentials struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type tokenClaims struct {
	Role string `json:"role"`
	jwt.RegisteredClaims
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		writeAuthError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	creds.Username = strings.TrimSpace(creds.Username)
	if utf8.RuneCountInString(creds.Username) < 3 || utf8.RuneCountInString(creds.Username) > 32 {
		writeAuthError(w, http.StatusBadRequest, "Username must be between 3 and 32 characters")
		return
	}
	if len(creds.Password) < 8 || len(creds.Password) > 72 {
		writeAuthError(w, http.StatusBadRequest, "Password must be between 8 and 72 bytes")
		return
	}

	role := "user"
	if adminUsername := strings.TrimSpace(os.Getenv("ADMIN_USERNAME")); adminUsername != "" && strings.EqualFold(creds.Username, adminUsername) {
		role = "admin"
	}
	user, err := h.userRepo.CreateUser(creds.Username, creds.Password, role)
	if err != nil {
		var postgresErr *pq.Error
		if errors.As(err, &postgresErr) && postgresErr.Code == "23505" {
			writeAuthError(w, http.StatusConflict, "That username is already taken")
			return
		}
		log.Printf("Could not create account: %v", err)
		writeAuthError(w, http.StatusInternalServerError, "Could not create account")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		writeAuthError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}
	creds.Username = strings.TrimSpace(creds.Username)
	if creds.Username == "" || creds.Password == "" {
		writeAuthError(w, http.StatusBadRequest, "Username and password are required")
		return
	}

	user, passwordHash, err := h.userRepo.GetUserByUsername(creds.Username)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeAuthError(w, http.StatusUnauthorized, "Invalid username or password")
		} else {
			log.Printf("Could not look up account for sign in: %v", err)
			writeAuthError(w, http.StatusInternalServerError, "Could not sign in right now")
		}
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(creds.Password)); err != nil {
		writeAuthError(w, http.StatusUnauthorized, "Invalid username or password")
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &tokenClaims{
		Role: user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   strconv.Itoa(user.ID),
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(h.jwtKey)
	if err != nil {
		writeAuthError(w, http.StatusInternalServerError, "Could not generate session")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"token": tokenString, "user_id": user.ID, "username": user.Username, "role": user.Role})
}

func writeAuthError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}
